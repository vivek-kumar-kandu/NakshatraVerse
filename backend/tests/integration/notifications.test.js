import { describe, it, expect } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// V4.4 Phase 1 (Notification Infrastructure) integration tests.
// Mirrors tests/integration/familyRelationshipHub.test.js's exact setup
// pattern (own tmp DATA_DIR, own agent-per-test auth via
// /api/auth/register). There is no public POST /api/notifications route
// in this phase (see notification.routes.js's header), so tests seed data
// directly through notificationService.createNotification — the same
// internal insertion point Phase 2 will eventually call.
// ─────────────────────────────────────────────────────────────────────────

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "nakshatraverse-notifications-test-"));

process.env.GOOGLE_API_KEY = "test-key-for-integration-tests";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-integration-tests";
process.env.DATA_DIR = TEST_DATA_DIR;

const { createApp } = await import("../../server.js");
const notificationService = await import("../../services/notifications/notificationService.js");
const app = createApp();

let userCounter = 0;
function makeUser() {
  userCounter += 1;
  return { name: "Notification Test", email: `notiftest${userCounter}@example.com`, password: "password123" };
}

async function loginAgent() {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send(makeUser());
  return { agent, userId: res.body.user.id };
}

function seed(userId, overrides = {}) {
  return notificationService.createNotification(userId, {
    title: "Test Notification",
    message: "A test message.",
    category: "general",
    priority: "medium",
    ...overrides,
  });
}

describe("GET /api/notifications", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("returns an empty list with pagination for a fresh user", async () => {
    const { agent } = await loginAgent();
    const res = await agent.get("/api/notifications");
    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([]);
    expect(res.body.pagination).toMatchObject({ page: 1, total: 0, totalPages: 1 });
  });

  it("lists only the authenticated user's own notifications", async () => {
    const { agent: agentA, userId: userIdA } = await loginAgent();
    const { agent: agentB } = await loginAgent();
    await seed(userIdA, { title: "A's notification" });

    const resA = await agentA.get("/api/notifications");
    const resB = await agentB.get("/api/notifications");
    expect(resA.body.notifications).toHaveLength(1);
    expect(resB.body.notifications).toHaveLength(0);
  });

  it("supports search, category, priority, and read-status filters", async () => {
    const { agent, userId } = await loginAgent();
    const n1 = await seed(userId, { title: "Panchang for today", category: "panchang", priority: "low" });
    await seed(userId, { title: "Critical dosha alert", category: "prediction", priority: "critical" });
    await notificationService.markRead(userId, n1.id);

    const bySearch = await agent.get("/api/notifications").query({ search: "dosha" });
    expect(bySearch.body.notifications).toHaveLength(1);
    expect(bySearch.body.notifications[0].category).toBe("prediction");

    const byCategory = await agent.get("/api/notifications").query({ category: "panchang" });
    expect(byCategory.body.notifications).toHaveLength(1);

    const byPriority = await agent.get("/api/notifications").query({ priority: "critical" });
    expect(byPriority.body.notifications).toHaveLength(1);

    const byRead = await agent.get("/api/notifications").query({ isRead: "true" });
    expect(byRead.body.notifications).toHaveLength(1);
    expect(byRead.body.notifications[0].id).toBe(n1.id);

    const byUnread = await agent.get("/api/notifications").query({ isRead: "false" });
    expect(byUnread.body.notifications).toHaveLength(1);
  });

  it("supports sort=priority and pagination", async () => {
    const { agent, userId } = await loginAgent();
    await seed(userId, { title: "Low", priority: "low" });
    await seed(userId, { title: "Critical", priority: "critical" });
    await seed(userId, { title: "Medium", priority: "medium" });

    const sorted = await agent.get("/api/notifications").query({ sort: "priority" });
    expect(sorted.body.notifications.map((n) => n.priority)).toEqual(["critical", "medium", "low"]);

    const page1 = await agent.get("/api/notifications").query({ limit: 2, page: 1 });
    expect(page1.body.notifications).toHaveLength(2);
    expect(page1.body.pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await agent.get("/api/notifications").query({ limit: 2, page: 2 });
    expect(page2.body.notifications).toHaveLength(1);
  });

  it("excludes expired notifications by default", async () => {
    const { agent, userId } = await loginAgent();
    await seed(userId, { title: "Expired", expiresAt: new Date(Date.now() - 60000).toISOString() });
    await seed(userId, { title: "Active" });

    const res = await agent.get("/api/notifications");
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].title).toBe("Active");
  });
});

describe("GET /api/notifications/unread-count and /latest", () => {
  it("reports the correct unread count and latest notification", async () => {
    const { agent, userId } = await loginAgent();
    const n1 = await seed(userId, { title: "First" });
    await seed(userId, { title: "Second" });
    await notificationService.markRead(userId, n1.id);

    const countRes = await agent.get("/api/notifications/unread-count");
    expect(countRes.body.unreadCount).toBe(1);

    const latestRes = await agent.get("/api/notifications/latest");
    expect(latestRes.body.notification.title).toBe("Second");
  });
});

describe("GET /api/notifications/:id", () => {
  it("404s for a notification belonging to another user", async () => {
    const { userId: userIdA } = await loginAgent();
    const { agent: agentB } = await loginAgent();
    const n1 = await seed(userIdA, { title: "Owned by A" });

    const res = await agentB.get(`/api/notifications/${n1.id}`);
    expect(res.status).toBe(404);
  });

  it("404s for a nonexistent id", async () => {
    const { agent } = await loginAgent();
    const res = await agent.get("/api/notifications/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/notifications/:id/read and /mark-all-read", () => {
  it("marks a single notification read", async () => {
    const { agent, userId } = await loginAgent();
    const n1 = await seed(userId);
    const res = await agent.post(`/api/notifications/${n1.id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  it("marks every unread notification read for the user only", async () => {
    const { agent: agentA, userId: userIdA } = await loginAgent();
    const { agent: agentB, userId: userIdB } = await loginAgent();
    await seed(userIdA);
    await seed(userIdA);
    await seed(userIdB);

    const res = await agentA.post("/api/notifications/mark-all-read");
    expect(res.body.updated).toBe(2);

    const listA = await agentA.get("/api/notifications").query({ isRead: "false" });
    expect(listA.body.notifications).toHaveLength(0);
    const listB = await agentB.get("/api/notifications").query({ isRead: "false" });
    expect(listB.body.notifications).toHaveLength(1);
  });
});

describe("DELETE /api/notifications/:id and /read", () => {
  it("deletes a single notification (ownership-checked)", async () => {
    const { userId: userIdA } = await loginAgent();
    const { agent: agentB } = await loginAgent();
    const n1 = await seed(userIdA);

    const forbidden = await agentB.delete(`/api/notifications/${n1.id}`);
    expect(forbidden.status).toBe(404);
  });

  it("deletes all read notifications for the user only", async () => {
    const { agent, userId } = await loginAgent();
    const read1 = await seed(userId, { title: "Read 1" });
    const read2 = await seed(userId, { title: "Read 2" });
    await seed(userId, { title: "Unread" });
    await notificationService.markRead(userId, read1.id);
    await notificationService.markRead(userId, read2.id);

    const res = await agent.delete("/api/notifications/read");
    expect(res.body.deleted).toBe(2);

    const remaining = await agent.get("/api/notifications");
    expect(remaining.body.notifications).toHaveLength(1);
    expect(remaining.body.notifications[0].title).toBe("Unread");
  });
});
