// ─────────────────────────────────────────────────────────────────────────
// Remedy Rule Evaluator
// Single responsibility: derive remedies from the Lagna lord + detected
// doshas using config-driven templates (rules/remedies.json). Logic order
// and output are unchanged from the original hardcoded remedyEngine.js:
//   1. Lagna-lord remedies (general + fasting), if the lord is known.
//   2. One remedy per matching detected dosha.
//   3. Bail out to [] if nothing was detected AND nothing was added yet.
//   4. Otherwise always append the general charity remedy.
// ─────────────────────────────────────────────────────────────────────────
import { loadRules } from "./ruleLoader.js";
import { SIGN_LORD } from "../astrology/constants.js";

function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(values, token) ? values[token] : match
  );
}

export function evaluateRemedies({ lagna, doshas }) {
  const config = loadRules("remedies");
  const remedies = [];

  const lordName = SIGN_LORD[lagna];
  const lordInfo = lordName ? config.planetRemedyInfo[lordName] : null;

  if (lordInfo) {
    for (const remedyDef of config.lagnaLordRemedies) {
      remedies.push({
        type: remedyDef.type,
        detail: fillTemplate(remedyDef.template, { lord: lordName, ...lordInfo }),
      });
    }
  }

  doshas.forEach((ds) => {
    const remedyDef = config.doshaRemedies[ds.name];
    if (remedyDef) {
      remedies.push({ type: remedyDef.type, detail: remedyDef.detail });
    }
  });

  if (doshas.length === 0 && remedies.length === 0) {
    return [];
  }

  remedies.push({
    type: config.generalRemedy.type,
    detail: config.generalRemedy.detail,
  });

  return remedies;
}

export default { evaluateRemedies };
