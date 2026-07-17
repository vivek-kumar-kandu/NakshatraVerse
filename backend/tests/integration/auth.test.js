import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated, disposable data directory so these tests never touch a real
// users.json/reports.json and can run repeatably from a clean slate.
const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "nakshatraverse-auth-test-"));

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-integration-tests";
process.env.DATA_DIR = TEST_DATA_DIR;

const { createApp } = await import("../../server.js");
const app = createApp();

const USER = { name: "Asha Test", email: "asha@example.com", password: "password123" };

describe("POST /api/auth/register", () => {
  it("creates an account and sets session cookies", async () => {
    const res = await request(app).post("/api/auth/register").send(USER);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: USER.name, email: USER.email });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    const cookies = res.headers["set-cookie"].join(";");
    expect(cookies).toMatch(/nv_access_token=/);
    expect(cookies).toMatch(/nv_refresh_token=/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it("rejects a duplicate email with 409", async () => {
    const res = await request(app).post("/api/auth/register").send(USER);
    expect(res.status).toBe(409);
  });

  it("rejects a weak password with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "X", email: "weak@example.com", password: "abc" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: USER.email, password: USER.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(USER.email);
  });

  it("returns the same error for wrong password and unknown email (no enumeration)", async () => {
    const wrongPassword = await request(app).post("/api/auth/login").send({ email: USER.email, password: "wrongpassword1" });
    const unknownEmail = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "whatever123" });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 with no session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid session cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: USER.email, password: USER.password });
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(USER.email);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookies", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: USER.email, password: USER.password });
    const res = await agent.post("/api/auth/logout");
    expect(res.status).toBe(200);
    const meAfter = await agent.get("/api/auth/me");
    expect(meAfter.status).toBe(401);
  });
});

describe("Existing astrology endpoints remain unaffected (regression)", () => {
  it("GET /api/health still works with auth routes mounted", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
