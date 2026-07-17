import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// config.js reads env vars at import time; set them before importing
// anything that transitively imports config.js, so tests are deterministic
// regardless of the real backend/.env on disk.
process.env.GOOGLE_API_KEY = "test-key-for-unit-tests";
// Note: config.js uses `Number(x) || default`, so "0" would fall through to
// the default (2) — use "1" with a tiny backoff instead to keep the
// failure-path test fast without changing config.js's parsing behavior.
process.env.GEMINI_MAX_RETRIES = "1";
process.env.GEMINI_RETRY_BASE_MS = "10";
process.env.GEMINI_TOTAL_BUDGET_MS = "5000";
process.env.GEMINI_FALLBACK_MODEL = "";

const { callGemini, getGeminiCacheStats, clearGeminiCache } = await import("../../services/ai/geminiService.js");

function mockFetchOnce(status, body) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

const SAMPLE_GEMINI_BODY = {
  candidates: [
    {
      finishReason: "STOP",
      content: { parts: [{ text: JSON.stringify({ loveLife: "text", career: "text" }) }] },
    },
  ],
};

describe("callGemini", () => {
  beforeEach(() => {
    clearGeminiCache();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a successful Gemini response into an object", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, SAMPLE_GEMINI_BODY));
    const result = await callGemini("some prompt");
    expect(result).toEqual({ loveLife: "text", career: "text" });
  });

  it("caches identical prompts — a second call does not hit fetch again", async () => {
    const fetchMock = mockFetchOnce(200, SAMPLE_GEMINI_BODY);
    vi.stubGlobal("fetch", fetchMock);

    await callGemini("identical prompt");
    await callGemini("identical prompt");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getGeminiCacheStats().hits).toBeGreaterThanOrEqual(1);
  });

  it("does not cache across different prompts", async () => {
    const fetchMock = mockFetchOnce(200, SAMPLE_GEMINI_BODY);
    vi.stubGlobal("fetch", fetchMock);

    await callGemini("prompt A");
    await callGemini("prompt B");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("mutating the returned object does not corrupt the cache for the next caller", async () => {
    vi.stubGlobal("fetch", mockFetchOnce(200, SAMPLE_GEMINI_BODY));

    const first = await callGemini("mutate-safety prompt");
    first.loveLife = "MUTATED";

    const second = await callGemini("mutate-safety prompt"); // served from cache
    expect(second.loveLife).toBe("text"); // not "MUTATED"
  });

  it("never caches a failed (non-2xx) response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "upstream error",
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(callGemini("failing prompt")).rejects.toThrow();
    expect(getGeminiCacheStats().size).toBe(0);
  });
});
