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
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  const { chart, report } = req.body;

  try {
    const result = await generateDailyGuidance({ chart, report, date, lat, lon });
    res.json(result);
  } catch (err) {
    logger.error("Life Coach guidance error:", err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({ error: err.message || "The AI Life Coach is unavailable right now." });
  }
});

export default { postDailyGuidance };
