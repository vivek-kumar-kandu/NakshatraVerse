// ─────────────────────────────────────────────────────────────────────────
// Rule Loader
// Single responsibility: read a named JSON rule file from backend/rules/
// and parse it once, caching the result for the life of the process. Every
// rule evaluator goes through this instead of reading/parsing JSON itself,
// so file location and caching behavior live in exactly one place.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/services/rules/ -> backend/rules/
const RULES_DIR = path.resolve(__dirname, "../../rules");

const cache = new Map();

/**
 * Load (and cache) a JSON rule file by name, e.g. loadRules("yogas") reads
 * backend/rules/yogas.json.
 */
export function loadRules(name) {
  if (cache.has(name)) return cache.get(name);

  const filePath = path.join(RULES_DIR, `${name}.json`);
  let parsed;
  try {
    const raw = readFileSync(filePath, "utf-8");
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Rule Engine: failed to load rule file "${filePath}": ${err.message}`);
  }
  cache.set(name, parsed);
  return parsed;
}

// Exposed for tests / diagnostics only — not used by production code paths.
export function clearRuleCache() {
  cache.clear();
}

export default { loadRules, clearRuleCache };
