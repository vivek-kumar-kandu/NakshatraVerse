// ─────────────────────────────────────────────────────────────────────────
// Shadbala Rule Evaluator (foundation)
// Single responsibility: combine Sthana Bala (from sign dignity +
// planetary friendship), Dig Bala, Naisargika Bala, and a Chesta Bala proxy
// (from retrograde status) into a composite foundation Shadbala score,
// using config-driven data (rules/shadbala.json, rules/naisargikaBala.json)
// instead of any hardcoded logic. Kaala Bala and Drik Bala are intentionally
// out of scope for this phase — see rules/shadbala.json for why.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { evaluateDigBala } from "./digBalaRuleEvaluator.js";

function plainName(fullKey) {
  return fullKey.split(" ")[0];
}

export function evaluateShadbala(planetary, dignity = {}, friendship = {}, retrograde = {}) {
  const config = loadRules("shadbala");
  const naisargika = loadRules("naisargikaBala");
  const digBala = evaluateDigBala(planetary);
  const result = {};

  for (const fullKey of Object.keys(planetary)) {
    const name = plainName(fullKey);

    let sthanaKey = "neutral";
    const state = dignity[name]?.state;
    if (state === "exalted") sthanaKey = "exalted";
    else if (state === "debilitated") sthanaKey = "debilitated";
    else if (state === "ownSign") sthanaKey = "ownSign";
    else {
      const relation = friendship[name]?.relation;
      if (relation === "friend") sthanaKey = "friendSign";
      else if (relation === "enemy") sthanaKey = "enemySign";
      else sthanaKey = "neutral";
    }
    const sthanaBala = config.sthanaBalaByDignity[sthanaKey];

    const dig = digBala[name]?.virupas ?? 0;
    const naisargikaBala = naisargika.virupas[name] ?? 0;

    let chestaBala;
    if (config.chestaBalaExempt.includes(name)) {
      chestaBala = config.chestaBalaExemptValue;
    } else {
      chestaBala = retrograde[name] ? config.chestaBalaVirupas.retrograde : config.chestaBalaVirupas.direct;
    }

    const total = Number((sthanaBala + dig + naisargikaBala + chestaBala).toFixed(2));

    result[name] = {
      sthanaBala,
      sthanaBalaBasis: sthanaKey,
      digBala: dig,
      naisargikaBala,
      chestaBala,
      total,
      componentsIncluded: config.components,
      componentsOmitted: config.omittedComponents,
    };
  }
  return result;
}

export default { evaluateShadbala };
