import { describe, it, expect, vi } from "vitest";
import { TTLCache, memoizeSync, memoizeAsync } from "../../services/utils/cache.js";

describe("TTLCache", () => {
  it("returns undefined for a missing key (miss)", () => {
    const cache = new TTLCache({ name: "t" });
    expect(cache.get("nope")).toBeUndefined();
    expect(cache.getStats().misses).toBe(1);
  });

  it("stores and retrieves a value (hit)", () => {
    const cache = new TTLCache({ name: "t" });
    cache.set("a", 123);
    expect(cache.get("a")).toBe(123);
    expect(cache.getStats().hits).toBe(1);
  });

  it("expires entries after ttlMs", () => {
    vi.useFakeTimers();
    const cache = new TTLCache({ name: "t", ttlMs: 1000 });
    cache.set("a", "value");
    vi.advanceTimersByTime(1001);
    expect(cache.get("a")).toBeUndefined();
    vi.useRealTimers();
  });

  it("evicts the least-recently-used entry once at capacity", () => {
    const cache = new TTLCache({ name: "t", maxEntries: 2, ttlMs: 60000 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // touch "a" so "b" becomes least-recently-used
    cache.set("c", 3); // should evict "b", not "a"
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("clear() empties the cache", () => {
    const cache = new TTLCache({ name: "t" });
    cache.set("a", 1);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
  });
});

describe("memoizeSync", () => {
  it("calls the underlying function only once per distinct key", () => {
    const cache = new TTLCache({ name: "t" });
    const fn = vi.fn((x) => x * 2);
    const memoized = memoizeSync(fn, { cache, keyFn: (x) => String(x) });

    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
    expect(memoized(6)).toBe(12);

    expect(fn).toHaveBeenCalledTimes(2); // once for 5, once for 6
  });
});

describe("memoizeAsync", () => {
  it("never caches a rejected promise", async () => {
    const cache = new TTLCache({ name: "t" });
    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount++;
      if (callCount === 1) throw new Error("transient failure");
      return "ok";
    });
    const memoized = memoizeAsync(fn, { cache, keyFn: () => "key" });

    await expect(memoized()).rejects.toThrow("transient failure");
    await expect(memoized()).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("caches a successful result for subsequent calls", async () => {
    const cache = new TTLCache({ name: "t" });
    const fn = vi.fn(async () => "computed-once");
    const memoized = memoizeAsync(fn, { cache, keyFn: () => "key" });

    await memoized();
    await memoized();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
