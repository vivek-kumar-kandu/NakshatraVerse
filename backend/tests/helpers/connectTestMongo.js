// ─────────────────────────────────────────────────────────────────────────
// Shared test helper — Mongo connection for integration tests.
//
// vitest gives each test file its own isolated module registry (even
// within the same worker thread), so there is no way for a single
// "connect once globally" step to actually be shared across test files —
// each file that touches Mongo-backed routes must establish its own
// connection. This helper exists so that requirement is expressed once,
// in one place, instead of being hand-duplicated in every test file:
//
//   const { connectMongo } = await import("../../db/mongoConnection.js");
//   await connectMongo();
//
// Only import this in test files that actually exercise Mongo-backed
// routes (auth, family profiles, notifications, saved reports,
// personalization). Non-Mongo integration tests (panchang, festivals,
// api, lifeCoach, explanation, explorerAi/explorerApi, aiTimeline) must
// NOT import this — doing so would make them depend on Mongo/network
// availability for no reason, exactly the regression this file's
// existence is meant to prevent.
// ─────────────────────────────────────────────────────────────────────────
import { connectMongo } from "../../db/mongoConnection.js";

export async function connectTestMongo() {
  await connectMongo();
}

export default connectTestMongo;
