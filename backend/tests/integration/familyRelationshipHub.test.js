import { describe, it, expect } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// V4.2 (Family Profiles & Relationship Hub) integration tests.
// Mirrors tests/integration/reports.test.js's exact setup pattern (own
// tmp DATA_DIR, own agent-per-test auth via /api/auth/register).
// ─────────────────────────────────────────────────────────────────────────

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "nakshatraverse-family-test-"));

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-integration-tests";
process.env.DATA_DIR = TEST_DATA_DIR;

const { createApp } = await import("../../server.js");
const app = createApp();

let userCounter = 0;
function makeUser() {
  userCounter += 1;
  return { name: "Family Test", email: `familytest${userCounter}@example.com`, password: "password123" };
}

async function loginAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send(makeUser());
  return agent;
}

const FATHER = { name: "Ramesh Sharma", relationship: "father", gender: "male", dob: "1965-04-12", tob: "06:30", pob: "Jaipur, India" };
const MOTHER = { name: "Sunita Sharma", relationship: "mother", gender: "female", dob: "1968-09-02", tob: "11:15", pob: "Jaipur, India" };

describe("Family Profiles (requires authentication)", () => {
  it("rejects unauthenticated CRUD with 401", async () => {
    expect((await request(app).post("/api/family-profiles").send(FATHER)).status).toBe(401);
    expect((await request(app).get("/api/family-profiles")).status).toBe(401);
    expect((await request(app).get("/api/family-profiles/whatever")).status).toBe(401);
  });

  it("rejects an invalid profile (missing relationship / bad birth fields)", async () => {
    const agent = await loginAgent();
    const res = await agent.post("/api/family-profiles").send({ name: "No Relationship", dob: "1990-01-01", tob: "10:00", pob: "Delhi" });
    expect(res.status).toBe(400);
  });

  it("creates, lists, edits, duplicates, archives, restores, and deletes a profile", async () => {
    const agent = await loginAgent();

    const createRes = await agent.post("/api/family-profiles").send(FATHER);
    expect(createRes.status).toBe(201);
    const profile = createRes.body.profile;
    expect(profile.relationshipLabel).toBe("Father");
    expect(profile.archived).toBe(false);

    const listRes = await agent.get("/api/family-profiles");
    expect(listRes.status).toBe(200);
    expect(listRes.body.profiles.map((p) => p.id)).toContain(profile.id);

    const updateRes = await agent.put(`/api/family-profiles/${profile.id}`).send({ ...FATHER, name: "Ramesh K. Sharma" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.profile.name).toBe("Ramesh K. Sharma");

    const dupRes = await agent.post(`/api/family-profiles/${profile.id}/duplicate`);
    expect(dupRes.status).toBe(201);
    expect(dupRes.body.profile.id).not.toBe(profile.id);

    const archiveRes = await agent.post(`/api/family-profiles/${profile.id}/archive`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.profile.archived).toBe(true);

    const hiddenListRes = await agent.get("/api/family-profiles");
    expect(hiddenListRes.body.profiles.map((p) => p.id)).not.toContain(profile.id);

    const restoreRes = await agent.post(`/api/family-profiles/${profile.id}/restore`);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.profile.archived).toBe(false);

    const deleteRes = await agent.delete(`/api/family-profiles/${profile.id}`);
    expect(deleteRes.status).toBe(200);
    expect((await agent.get(`/api/family-profiles/${profile.id}`)).status).toBe(404);
  });

  it("never lets one user read or touch another user's profile", async () => {
    const agentA = await loginAgent();
    const agentB = await loginAgent();

    const createRes = await agentA.post("/api/family-profiles").send(FATHER);
    const profileId = createRes.body.profile.id;

    expect((await agentB.get(`/api/family-profiles/${profileId}`)).status).toBe(404);
    expect((await agentB.put(`/api/family-profiles/${profileId}`).send(FATHER)).status).toBe(404);
    expect((await agentB.delete(`/api/family-profiles/${profileId}`)).status).toBe(404);
  });
});

describe("Relationship Hub (requires authentication)", () => {
  it("rejects unauthenticated comparisons with 401", async () => {
    const res = await request(app).post("/api/relationship-hub/compare").send({ profileIdA: "a", profileIdB: "b" });
    expect(res.status).toBe(401);
  });

  it("rejects comparing a profile with itself or a missing profile", async () => {
    const agent = await loginAgent();
    const createRes = await agent.post("/api/family-profiles").send(FATHER);
    const id = createRes.body.profile.id;

    const sameRes = await agent.post("/api/relationship-hub/compare").send({ profileIdA: id, profileIdB: id });
    expect(sameRes.status).toBe(400);

    const missingRes = await agent.post("/api/relationship-hub/compare").send({ profileIdA: id, profileIdB: "does-not-exist" });
    expect(missingRes.status).toBe(404);
  });

  it("compares two saved profiles across Kundli Matching, chart, strength, dosha, nakshatra, and predictions", async () => {
    const agent = await loginAgent();
    const fatherRes = await agent.post("/api/family-profiles").send(FATHER);
    const motherRes = await agent.post("/api/family-profiles").send(MOTHER);

    const res = await agent.post("/api/relationship-hub/compare").send({
      profileIdA: fatherRes.body.profile.id,
      profileIdB: motherRes.body.profile.id,
    });

    expect(res.status).toBe(200);
    expect(res.body.kundliMatching.totalScore).toBeTypeOf("number");
    expect(res.body.kundliMatching.ashtakoota.varna).toBeTruthy();
    expect(res.body.birthChartComparison.chartA.lagna).toBeTruthy();
    expect(res.body.birthChartComparison.chartB.lagna).toBeTruthy();
    expect(res.body.planetStrengthComparison.personA.strongest).toBeTruthy();
    expect(res.body.doshaComparison).toBeTruthy();
    expect(res.body.nakshatraComparison.profileA.nakshatra).toBeTruthy();
    expect(Array.isArray(res.body.predictionComparison.personA)).toBe(true);
  });

  it("404s if either profile belongs to a different user", async () => {
    const agentA = await loginAgent();
    const agentB = await loginAgent();
    const aProfile = await agentA.post("/api/family-profiles").send(FATHER);
    const bProfile = await agentB.post("/api/family-profiles").send(MOTHER);

    const res = await agentA.post("/api/relationship-hub/compare").send({
      profileIdA: aProfile.body.profile.id,
      profileIdB: bProfile.body.profile.id,
    });
    expect(res.status).toBe(404);
  });
});
