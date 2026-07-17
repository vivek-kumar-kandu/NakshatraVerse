// ─────────────────────────────────────────────────────────────────────────
// Rule Engine (core)
// Single responsibility: evaluate a declarative rule (a set of AND-combined
// "conditions") against a chart's planetary facts, and interpolate a
// matched rule's detail template. This is the only place that knows HOW to
// check a condition; yoga/dosha/remedy rule evaluators only know WHICH
// rules to run (loaded from JSON) — a clean separation between the engine
// (this file) and the rule data (backend/rules/*.json).
//
// Adding a new kind of condition = add one function to OPERATORS below.
// Adding a new yoga/dosha = edit JSON, no code change (Open/Closed).
// ─────────────────────────────────────────────────────────────────────────
import { houseOf } from "../astrology/housePlacementEngine.js";
import { PLANETS, SIGN_NAMES, SIGN_LORD } from "../astrology/constants.js";
import { loadRules } from "./ruleLoader.js";

// Builds a { "Sun": "Sun ☀️", "Moon": "Moon 🌙", ... } lookup once, so rule
// JSON can refer to planets by their plain name instead of needing to know
// about (or duplicate) the emoji-suffixed keys used internally.
const PLAIN_TO_FULL_KEY = PLANETS.reduce((map, fullKey) => {
  const plainName = fullKey.split(" ")[0];
  map[plainName] = fullKey;
  return map;
}, {});

function fullKey(plainName) {
  return PLAIN_TO_FULL_KEY[plainName] || plainName;
}

function houseOfPlain(planetary, plainName) {
  return houseOf(planetary, fullKey(plainName));
}

function signOfPlain(planetary, plainName) {
  return planetary[fullKey(plainName)]?.sign;
}

// Houses run 1-12 cyclically; true if h lies strictly between start and end
// going forward (exclusive of start, inclusive of end) — identical
// semantics to the original inline `isBetweenCyclic` helper.
function isBetweenCyclic(start, end, h) {
  const span = [];
  let cur = start;
  while (cur !== end) {
    cur = (cur % 12) + 1;
    span.push(cur);
  }
  return span.includes(h);
}

// Resolves a condition's target house list: either an explicit "houses"
// array, or a named "houseGroup" looked up from houses.json.
function resolveHouseList(condition, housesConfig) {
  if (Array.isArray(condition.houses)) return condition.houses;
  if (condition.houseGroup) {
    const group = housesConfig?.houseGroups?.[condition.houseGroup];
    if (!group) {
      throw new Error(`Rule Engine: unknown houseGroup "${condition.houseGroup}"`);
    }
    return group;
  }
  return [];
}

// Each operator: (condition, planetary, housesConfig) -> boolean
const OPERATORS = {
  sameHouse(condition, planetary) {
    const a = houseOfPlain(planetary, condition.planetA);
    const b = houseOfPlain(planetary, condition.planetB);
    return Boolean(a) && Boolean(b) && a === b;
  },

  houseIn(condition, planetary, housesConfig) {
    const house = houseOfPlain(planetary, condition.planet);
    if (!house) return false;
    const allowed = resolveHouseList(condition, housesConfig);
    return allowed.includes(house);
  },

  mutualHouseDiffIn(condition, planetary) {
    const a = houseOfPlain(planetary, condition.planetA);
    const b = houseOfPlain(planetary, condition.planetB);
    if (!a || !b) return false;
    const diff = Math.abs(a - b) % 12;
    return condition.allowedDiffs.includes(diff);
  },

  allBetweenAxis(condition, planetary) {
    const start = houseOfPlain(planetary, condition.axisStart);
    const end = houseOfPlain(planetary, condition.axisEnd);
    if (!start || !end) return false;
    return condition.planets.every((plainName) => {
      const h = houseOfPlain(planetary, plainName);
      return isBetweenCyclic(start, end, h);
    });
  },

  // ── Priority 3.2 additions (Advanced Yoga/Dosha Engine) ─────────────────
  // Everything below is purely additive: existing operators/behavior above
  // are untouched, so every Priority 2/3.1 rule keeps matching exactly as
  // before. New rule files (yogasAdvanced.json / doshasAdvanced.json) are
  // the only consumers of these.

  // True if the planet currently sits in one of the given signs.
  signIn(condition, planetary) {
    const sign = signOfPlain(planetary, condition.planet);
    if (!sign) return false;
    return (condition.signs || []).includes(sign);
  },

  // True if the planet occupies a sign it rules (Swakshetra/own sign).
  inOwnSign(condition, planetary) {
    const sign = signOfPlain(planetary, condition.planet);
    if (!sign) return false;
    return SIGN_LORD[sign] === condition.planet;
  },

  // True if the planet is in its classical exaltation (Uchcha) sign.
  inExaltation(condition, planetary) {
    const exaltation = loadRules("exaltation");
    const sign = signOfPlain(planetary, condition.planet);
    return Boolean(sign) && exaltation[condition.planet] === sign;
  },

  // True if the planet is in its classical debilitation (Neecha) sign.
  inDebilitation(condition, planetary) {
    const debilitation = loadRules("debilitation");
    const sign = signOfPlain(planetary, condition.planet);
    return Boolean(sign) && debilitation[condition.planet] === sign;
  },

  // Forward house-distance (1 = same house, 12 = one before) from a
  // reference planet ("from") to a target planet ("planet"), used for
  // Chandra (Moon)-relative yogas like Adhi Yoga / Kemadruma Yoga.
  houseDistanceFromIn(condition, planetary) {
    const from = houseOfPlain(planetary, condition.from);
    const to = houseOfPlain(planetary, condition.planet);
    if (!from || !to) return false;
    const distance = ((to - from + 12) % 12) + 1;
    return (condition.distances || []).includes(distance);
  },

  // All listed planets share exactly the same house (n-way conjunction;
  // generalizes the 2-planet-only `sameHouse` operator).
  conjunctAll(condition, planetary) {
    const houses = (condition.planets || []).map((p) => houseOfPlain(planetary, p));
    if (houses.some((h) => !h)) return false;
    return houses.every((h) => h === houses[0]);
  },

  // The dispositor (sign-lord) of the planet's current sign is itself
  // placed in one of the given houses/houseGroup — used for Neecha Bhanga
  // (debilitation-cancellation) style rules.
  dispositorInHouseGroup(condition, planetary, housesConfig) {
    const sign = signOfPlain(planetary, condition.planet);
    if (!sign) return false;
    const dispositor = SIGN_LORD[sign];
    const house = houseOfPlain(planetary, dispositor);
    if (!house) return false;
    const allowed = resolveHouseList(condition, housesConfig);
    return allowed.includes(house);
  },

  // The classical lord of a given house number (derived from this chart's
  // Lagna sign) is placed in one of the given houses — used for Viparita
  // Raja Yoga (dusthana lord placed in another dusthana). Requires the
  // evaluation context to carry `lagna`; resolves to false (never matches)
  // if lagna is unavailable, rather than throwing, so this stays additive
  // and safe even if a caller forgets to pass context.
  houseLordInHouses(condition, planetary, housesConfig, context = {}) {
    const { lagna } = context;
    if (!lagna) return false;
    const lagnaIndex = SIGN_NAMES.indexOf(lagna);
    if (lagnaIndex < 0) return false;
    const houseSign = SIGN_NAMES[(lagnaIndex + condition.house - 1) % 12];
    const lord = SIGN_LORD[houseSign];
    const lordHouse = houseOfPlain(planetary, lord);
    if (!lordHouse) return false;
    const allowed = resolveHouseList(condition, housesConfig);
    return allowed.includes(lordHouse) && lordHouse !== condition.house;
  },

  // Logical OR across a nested list of sub-conditions (any one matching
  // is enough). Sub-conditions are evaluated with the same engine/operator
  // set, including further nesting of anyOf/allOf/not.
  anyOf(condition, planetary, housesConfig, context) {
    return (condition.conditions || []).some((sub) =>
      evaluateCondition(sub, planetary, housesConfig, context)
    );
  },

  // Logical AND across a nested list of sub-conditions — equivalent to the
  // rule's own top-level condition list, but usable *inside* an anyOf/not
  // for grouping.
  allOf(condition, planetary, housesConfig, context) {
    return (condition.conditions || []).every((sub) =>
      evaluateCondition(sub, planetary, housesConfig, context)
    );
  },

  // Logical NOT of a single nested sub-condition.
  not(condition, planetary, housesConfig, context) {
    return !evaluateCondition(condition.condition, planetary, housesConfig, context);
  },

  // ── Priority 6 (V2.0 Advanced Astrology Engine) addition ────────────────
  // True if planetA and planetB mutually occupy each other's sign (each is
  // the dispositor of the other's current sign) — the classical definition
  // of Parivartana (mutual sign exchange) Yoga. Purely additive: existing
  // operators/behavior above are untouched.
  mutualSignExchange(condition, planetary) {
    const signA = signOfPlain(planetary, condition.planetA);
    const signB = signOfPlain(planetary, condition.planetB);
    if (!signA || !signB) return false;
    return SIGN_LORD[signA] === condition.planetB && SIGN_LORD[signB] === condition.planetA;
  },
};

// `context` is an optional, additive bag of chart-level facts (currently
// just `{ lagna }`) needed by a few Priority 3.2 operators (e.g.
// houseLordInHouses). Existing callers that don't pass it are unaffected —
// every Priority 2/3.1 operator ignores the parameter entirely.
function evaluateCondition(condition, planetary, housesConfig, context = {}) {
  const operator = OPERATORS[condition.operator];
  if (!operator) {
    throw new Error(`Rule Engine: unknown condition operator "${condition.operator}"`);
  }
  return operator(condition, planetary, housesConfig, context);
}

// A rule matches when every one of its conditions passes (logical AND).
export function ruleMatches(rule, planetary, housesConfig, context = {}) {
  return rule.conditions.every((condition) => evaluateCondition(condition, planetary, housesConfig, context));
}

// Builds the {Planet_house}/{Planet_sign} fact map used for template
// interpolation, covering every planet referenced anywhere in the rule.
function buildTemplateFacts(planetary) {
  const facts = {};
  for (const plainName of Object.keys(PLAIN_TO_FULL_KEY)) {
    facts[`${plainName}_house`] = houseOfPlain(planetary, plainName);
    facts[`${plainName}_sign`] = signOfPlain(planetary, plainName);
  }
  return facts;
}

// Replaces {token} placeholders in a template string using both the
// planetary fact map and any extra values passed in (e.g. lagna-lord
// remedy fields), leaving unresolved placeholders untouched.
export function interpolate(template, planetary, extra = {}) {
  const facts = { ...buildTemplateFacts(planetary || {}), ...extra };
  return template.replace(/\{(\w+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(facts, token) ? facts[token] : match
  );
}

export default { ruleMatches, interpolate };
