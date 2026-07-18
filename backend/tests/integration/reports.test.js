import { describe, it, expect } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "nakshatraverse-reports-test-"));

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-integration-tests";
process.env.DATA_DIR = TEST_DATA_DIR;

const { createApp } = await import("../../server.js");
const app = createApp();

let userCounter = 0;
function makeUser() {
  userCounter += 1;
  return { name: "Priya Test", email: `priya${userCounter}@example.com`, password: "password123" };
}
const CHART_PAYLOAD = {
  userData: { name: "Priya Test", dob: "1992-03-10", tob: "14:20", pob: "Delhi", lagna: "Leo" },
  chart: {
    lagna: "Leo",
    moonSign: "Cancer",
    sunSign: "Pisces",
    planetary: { "Sun ☀️": { house: 8, sign: "Pisces" } },
    numerology: { mulank: 1, bhagyank: 4 },
    doshas: [],
    yogas: [],
  },
  report: {
    loveLife: "a", career: "b", finance: "c", health: "d", marriage: "e",
    doshas: "No major dosha detected.", yogas: "No major yoga detected.",
    remedies: "f", lifeSummary: "g",
  },
};

async function loginAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send(makeUser());
  return agent;
}

describe("Saved reports (requires authentication)", () => {
  it("rejects unauthenticated save/list/get/delete with 401", async () => {
    expect((await request(app).post("/api/reports").send(CHART_PAYLOAD)).status).toBe(401);
    expect((await request(app).get("/api/reports")).status).toBe(401);
    expect((await request(app).get("/api/reports/whatever")).status).toBe(401);
    expect((await request(app).delete("/api/reports/whatever")).status).toBe(401);
  });

  it("saves a report, lists it, fetches it, then deletes it", async () => {
    const agent = await loginAgent();

    const saveRes = await agent.post("/api/reports").send({ title: "My Reading", ...CHART_PAYLOAD });
    expect(saveRes.status).toBe(201);
    const reportId = saveRes.body.report.id;
    expect(reportId).toBeTruthy();

    const listRes = await agent.get("/api/reports");
    expect(listRes.status).toBe(200);
    expect(listRes.body.reports).toHaveLength(1);
    expect(listRes.body.reports[0]).toMatchObject({ id: reportId, title: "My Reading" });

    const getRes = await agent.get(`/api/reports/${reportId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.report.userData).toMatchObject(CHART_PAYLOAD.userData);

    const deleteRes = await agent.delete(`/api/reports/${reportId}`);
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await agent.get(`/api/reports/${reportId}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it("prevents one user from reading another user's report", async () => {
    const owner = await loginAgent();
    const saveRes = await owner.post("/api/reports").send(CHART_PAYLOAD);
    const reportId = saveRes.body.report.id;

    const intruder = request.agent(app);
    await intruder.post("/api/auth/register").send({ name: "Intruder", email: "intruder@example.com", password: "password123" });
    const res = await intruder.get(`/api/reports/${reportId}`);
    expect(res.status).toBe(404);
  });
});

describe("PDF export", () => {
  it("generates an ad hoc PDF without requiring authentication", async () => {
    const res = await request(app).post("/api/reports/export-pdf").send(CHART_PAYLOAD);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
  });

  it("generates a PDF for a saved report (authenticated, owner only)", async () => {
    const agent = await loginAgent();
    const saveRes = await agent.post("/api/reports").send(CHART_PAYLOAD);
    const reportId = saveRes.body.report.id;

    const res = await agent.get(`/api/reports/${reportId}/pdf`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });
});
