import { describe, it, expect } from "vitest";
import request from "supertest";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../server.js");
const { signAccessToken } = await import("../../services/auth/tokenService.js");
const app = createApp();

describe("GET /api/personalization", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/personalization");
    expect(res.status).toBe(401);
  });
  it("returns the unified empty state for an authenticated user without saved reports", async () => {
    const token = signAccessToken({ id: "personalization-empty-user", email: "u@example.com", name: "User" });
    const res = await request(app).get("/api/personalization?period=weekly").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.period).toBe("weekly");
    expect(res.body).toHaveProperty("whatsChanged");
    expect(res.body.history).toEqual([]);
  });
});
