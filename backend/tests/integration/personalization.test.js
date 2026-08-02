import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../server.js");
const { connectTestMongo } = await import("../helpers/connectTestMongo.js");
await connectTestMongo();
const { signAccessToken } = await import("../../services/auth/tokenService.js");
const app = createApp();

// BUG-02 fix: requireAuth now validates tokenVersion against MongoDB, so
// synthetic tokens for non-existent users get 401. We register a real user
// so the test DB has a matching record — consistent with every other test.
const AGENT_EMAIL = `personalization-test-${Date.now()}@example.com`;
const AGENT_PASSWORD = "Test1234!";
let authAgent;

beforeAll(async () => {
  authAgent = request.agent(app);
  await authAgent.post("/api/auth/register").send({
    name: "Personalization User",
    email: AGENT_EMAIL,
    password: AGENT_PASSWORD,
  });
});

describe("GET /api/personalization", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/personalization");
    expect(res.status).toBe(401);
  });
  it("returns the unified empty state for an authenticated user without saved reports", async () => {
    const res = await authAgent.get("/api/personalization?period=weekly");
    expect(res.status).toBe(200);
    expect(res.body.period).toBe("weekly");
    expect(res.body).toHaveProperty("whatsChanged");
    expect(res.body.history).toEqual([]);
  });
});
