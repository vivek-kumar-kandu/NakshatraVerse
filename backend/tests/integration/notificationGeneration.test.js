import { describe, it, expect } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// V4.4 Phase 2 (Intelligent Notification Generation) integration tests.
// Mirrors tests/integration/notifications.test.js's exact setup pattern
// (own tmp DATA_DIR, own agent-per-test auth via /api/auth/register).
// Exercises the new POST /api/notifications/generate route end-to-end,
// including duplicate prevention across two consecutive calls.
// ─────────────────────────────────────────────────────────────────────────

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "nakshatraverse-notification-generation-test-"));

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-integration-tests";
process.env.DATA_DIR = TEST_DATA_DIR;

const { createApp } = await import("../../server.js");
const app = createApp();

let userCounter = 0;
function makeUser() {
  userCounter += 1;
  return { name: "Notification Gen Test", email: `notifgentest${userCounter}@example.com`, password: "password123" };
}

async function loginAgent() {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send(makeUser());
  return { agent, userId: res.body.user.id };
}

describe("POST /api/notifications/generate", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/notifications/generate");
    expect(res.status).toBe(401);
  });

  it("generates at least today's Panchang notifications for a fresh user with no saved chart", async () => {
    const { agent } = await loginAgent();
    const res = await agent.post("/api/notifications/generate");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("generated");
    expect(res.body).toHaveProperty("skippedDuplicate");
    expect(res.body).toHaveProperty("errors");
    expect(res.body.generated).toBeGreaterThan(0);

    const list = await agent.get("/api/notifications").query({ category: "panchang" });
    expect(list.body.notifications.length).toBeGreaterThan(0);
    expect(list.body.notifications.some((n) => n.title === "Today's Panchang is Ready")).toBe(true);
  });

  it("does not duplicate the same day's notifications on a second call", async () => {
    const { agent } = await loginAgent();
    const first = await agent.post("/api/notifications/generate");
    const firstCount = (await agent.get("/api/notifications").query({ limit: 100 })).body.pagination.total;

    const second = await agent.post("/api/notifications/generate");
    const secondCount = (await agent.get("/api/notifications").query({ limit: 100 })).body.pagination.total;

    expect(second.status).toBe(200);
    expect(second.body.skippedDuplicate).toBeGreaterThan(0);
    expect(secondCount).toBe(firstCount);
    expect(first.body.generated).toBe(firstCount);
  });

  it("every generated notification has a valid category/priority and, where set, a dedupeKey in metadata", async () => {
    const { agent } = await loginAgent();
    await agent.post("/api/notifications/generate");
    const list = await agent.get("/api/notifications").query({ limit: 100 });

    const validCategories = ["system", "reminder", "ai", "panchang", "muhurat", "prediction", "transit", "family", "festival", "general"];
    const validPriorities = ["critical", "high", "medium", "low"];
    for (const n of list.body.notifications) {
      expect(validCategories).toContain(n.category);
      expect(validPriorities).toContain(n.priority);
      expect(n.metadata).toBeTypeOf("object");
    }
  });

  // V4.5 Phase 1A (Festival Backend Infrastructure) — Notification
  // Integration. Confirms the Festival Engine's output actually reaches
  // the Notification Center as "Festival Today/Tomorrow" or "Important
  // Vrat Today/Tomorrow" whenever an occurrence genuinely falls on
  // today/tomorrow, without asserting on which specific festival that is
  // (which depends on the date the test suite happens to run).
  //
  // V4.5 Phase 2 (Festival Intelligence) additionally runs its own sibling
  // generator (festivalIntelligenceNotificationGenerator.js) under this
  // same "festival" category — Preparation/Fasting/Puja/Starting/Ending
  // reminders — whenever an occurrence's timing genuinely warrants one.
  // Both generators are legitimate, additive sources for this category,
  // so every title either generator can produce is allowed here.
  it("generates Festival/Vrat notifications with the correct category and title shape whenever one applies today/tomorrow", async () => {
    const { agent } = await loginAgent();
    await agent.post("/api/notifications/generate");
    const list = await agent.get("/api/notifications").query({ category: "festival", limit: 100 });
    expect(list.status).toBe(200);

    const allowedTitles = [
      // V4.5 Phase 1A — Festival Backend Infrastructure (existing Festival/Vrat generator)
      "Festival Today", "Festival Tomorrow", "Important Vrat Today", "Important Vrat Tomorrow",
      // V4.5 Phase 2 — Festival Intelligence (festivalIntelligenceNotificationGenerator.js)
      "Festival Preparation Reminder", "Fasting Reminder", "Puja Reminder", "Festival Starting", "Festival Ending",
    ];
    for (const n of list.body.notifications) {
      expect(allowedTitles).toContain(n.title);
      expect(n.metadata.festivalKey).toBeTruthy();
    }
  });
});
