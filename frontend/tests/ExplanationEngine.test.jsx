import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─────────────────────────────────────────────────────────────────────────
// V5.3 — Explainable Report Intelligence
// Covers the shared useExplanation hook's own state machine (lazy load,
// loading/error states, cache reuse across a changed cacheKey, and the
// module-level shared cache surviving across separate component mounts —
// the frontend half of the Explanation Engine's "shared caching"
// requirement) plus the explanationApi.js client's request/response
// shaping.
// ─────────────────────────────────────────────────────────────────────────

const { useExplanation, clearSharedExplanationCache } = await import("../src/hooks/useExplanation.js");

function Harness({ cacheKey, fetcher, enabled = true }) {
  const { data, loading, error, request, retry } = useExplanation({ cacheKey, fetcher, enabled });
  return (
    <div>
      <button onClick={request}>request</button>
      <button onClick={retry}>retry</button>
      {loading && <span>loading</span>}
      {error && <span role="alert">{error}</span>}
      {data && <span>data:{JSON.stringify(data)}</span>}
    </div>
  );
}

describe("useExplanation", () => {
  beforeEach(() => {
    clearSharedExplanationCache();
  });

  it("does not fetch until request() is called", () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    render(<Harness cacheKey="k1" fetcher={fetcher} />);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("shows loading then data on a successful request", async () => {
    let resolvePromise;
    const fetcher = vi.fn().mockReturnValue(new Promise((res) => { resolvePromise = res; }));
    const user = userEvent.setup();
    render(<Harness cacheKey="k2" fetcher={fetcher} />);

    await user.click(screen.getByText("request"));
    expect(screen.getByText("loading")).toBeInTheDocument();

    resolvePromise({ hello: "world" });
    await waitFor(() => expect(screen.getByText(/data:/)).toBeInTheDocument());
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });

  it("shows an error and supports retry", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<Harness cacheKey="k3" fetcher={fetcher} />);

    await user.click(screen.getByText("request"));
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");

    await user.click(screen.getByText("retry"));
    await waitFor(() => expect(screen.getByText(/data:/)).toBeInTheDocument());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("shares its cache across separate mounts for the same cacheKey (shared caching)", async () => {
    const fetcher = vi.fn().mockResolvedValue({ shared: true });
    const user = userEvent.setup();
    const { unmount } = render(<Harness cacheKey="shared-key" fetcher={fetcher} />);
    await user.click(screen.getByText("request"));
    await waitFor(() => expect(screen.getByText(/data:/)).toBeInTheDocument());
    unmount();

    // A brand-new mount (simulating a different surface, e.g. Timeline
    // instead of Explorer) with the SAME cacheKey should not refetch.
    render(<Harness cacheKey="shared-key" fetcher={fetcher} />);
    await user.click(screen.getByText("request"));
    await waitFor(() => expect(screen.getByText(/data:/)).toBeInTheDocument());
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("resets to whatever is cached for a new cacheKey rather than carrying over stale data", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: "A" });
    const user = userEvent.setup();
    const { rerender } = render(<Harness cacheKey="key-A" fetcher={fetcher} />);
    await user.click(screen.getByText("request"));
    await waitFor(() => expect(screen.getByText(/data:/)).toBeInTheDocument());

    const fetcherB = vi.fn().mockResolvedValue({ value: "B" });
    rerender(<Harness cacheKey="key-B" fetcher={fetcherB} />);
    expect(screen.queryByText(/data:/)).not.toBeInTheDocument();
  });
});

describe("explanationApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchReportSummary posts to /api/explanation/report-summary and returns the parsed body", async () => {
    const { fetchReportSummary } = await import("../src/utils/explanationApi.js");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: "All good." }),
    });

    const result = await fetchReportSummary({ chart: { a: 1 }, report: {}, history: [] });
    expect(result).toEqual({ summary: "All good." });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/explanation/report-summary");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ chart: { a: 1 }, report: {}, history: [] });
  });

  it("throws the backend's error message on a non-OK response", async () => {
    const { fetchConfidenceExplanation } = await import("../src/utils/explanationApi.js");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid request: category is required." }),
    });

    await expect(fetchConfidenceExplanation({ chart: {}, category: "" })).rejects.toThrow(/category is required/i);
  });
});
