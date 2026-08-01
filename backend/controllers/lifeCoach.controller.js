// ─────────────────────────────────────────────────────────────────────────
// AI Life Coach Controller — V4.3 (AI Life Coach)
// HTTP layer only: validate the request, delegate to lifeCoachService, and
// shape the response/error exactly like assistant.controller.js's
// postChatMessage. No astrology calculation or prompt construction happens
// here.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateLifeCoachRequest } from "../validators/lifeCoach.validator.js";
import { generateDailyGuidance } from "../services/ai/lifeCoachService.js";

export const postDailyGuidance = asyncHandler(async (req, res) => {
  const { errors, date, lat, lon } = validateLifeCoachRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/life-coach/guidance: ${errors.join(", ")}`);
<<<<<<< HEAD
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
=======
    return res.status(400).json({ error: req.t("errors.invalidRequest", { errors: errors.join(", ") }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }

  const { chart, report } = req.body;

  try {
<<<<<<< HEAD
    const result = await generateDailyGuidance({ chart, report, date, lat, lon });
=======
    const result = await generateDailyGuidance({ chart, report, date, lat, lon, language: req.language });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
    res.json(result);
  } catch (err) {
    logger.error("Life Coach guidance error:", err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
<<<<<<< HEAD
    res.status(status).json({ error: err.message || "The AI Life Coach is unavailable right now." });
=======
    res.status(status).json({ error: err.message || req.t("errors.serviceUnavailable", { feature: "The AI Life Coach" }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }
});

export default { postDailyGuidance };
