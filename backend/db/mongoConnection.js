// ─────────────────────────────────────────────────────────────────────────
// Mongo Connection Lifecycle (Priority 5.2 → Phase 3 hardening)
//
// Single responsibility: establish, share, and tear down the one Mongoose
// connection this process ever needs. Every repository (User/Report/
// Notification/FamilyProfile) talks to Mongoose's default connection
// directly via their models — this module's only job is making sure that
// connection exists before anything tries to use it, exactly once, no
// matter who asks or how many times.
//
// Design notes:
//   - Singleton + idempotent: connectMongo() is safe to call from many
//     places (the real server boot path AND every integration test file
//     that imports server.js independently) without ever opening a second
//     connection or throwing "Trying to open unclosed connection". A
//     readyState check short-circuits an already-connected call; an
//     in-flight promise is shared so concurrent callers await the same
//     attempt instead of racing two connects.
//   - Retry with backoff: a transient Atlas hiccup on the very first
//     attempt (cold start, brief network blip) no longer takes the whole
//     process down immediately — see config.MONGODB_MAX_RETRIES/
//     MONGODB_RETRY_BASE_MS (same shape as GEMINI_MAX_RETRIES/
//     GEMINI_RETRY_BASE_MS elsewhere in this codebase).
//   - Test-safe: process.exit(1) is only ever called outside NODE_ENV=test
//     — a connection failure in a test run surfaces as a normal thrown
//     error in that test file's own output instead of silently killing
//     the whole Vitest worker (and every other test file running in it).
//   - No secrets logged: the URI's credentials are masked before any log
//     line ever includes it.
//   - Graceful shutdown: disconnectMongo() lets server.js's existing
//     SIGTERM/SIGINT handler close the DB connection as part of the same
//     graceful-shutdown sequence it already runs for the HTTP server.
// ─────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import config from "../config/env.js";

function maskMongoUri(uri) {
  if (!uri) return "(not set)";
  // mongodb://user:password@host... -> mongodb://user:****@host...
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, "$1****$3");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Tracks the single in-flight/completed connection attempt for this
// process. Reset to null on failure so a later call can retry from a
// clean slate instead of replaying a rejected promise forever.
let connectingPromise = null;

async function connectWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= config.MONGODB_MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(config.MONGODB_URI);
      console.log(`✅ MongoDB Atlas Connected (${maskMongoUri(config.MONGODB_URI)})`);
      return conn;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === config.MONGODB_MAX_RETRIES;
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${config.MONGODB_MAX_RETRIES} failed: ${error.message}`
      );
      if (!isLastAttempt) {
        const delay = config.MONGODB_RETRY_BASE_MS * attempt;
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// Idempotent, safe to call from anywhere (server boot, or independently
// from every integration test file that imports server.js) without ever
// double-connecting.
export async function connectMongo() {
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting.
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectingPromise) return connectingPromise;

  if (!config.MONGODB_URI) {
    const err = new Error(
      "MONGODB_URI is missing. Set it in backend/.env (see backend/.env.example)."
    );
    console.error("❌ MongoDB Connection Failed:", err.message);
    // Only crash the real server boot path — a test run should see this
    // as a normal thrown/rejected error in its own output instead of the
    // whole test worker being killed.
    if (config.NODE_ENV !== "test") process.exit(1);
    throw err;
  }

  connectingPromise = connectWithRetry().catch((error) => {
    console.error("❌ MongoDB Connection Failed after all retries:", error.message);
    connectingPromise = null; // allow a future call to retry from scratch
    if (config.NODE_ENV !== "test") process.exit(1);
    throw error;
  });

  return connectingPromise;
}

// Graceful shutdown — called from server.js's SIGTERM/SIGINT handler
// alongside the HTTP server's own close(), so the process never exits
// while a Mongo connection is still mid-flight.
export async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  connectingPromise = null;
  console.log("MongoDB connection closed.");
}

export default { connectMongo, disconnectMongo };
