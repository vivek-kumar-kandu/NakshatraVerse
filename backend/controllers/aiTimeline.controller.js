// ─────────────────────────────────────────────────────────────────────────
// AI Timeline Controller — V5.2 (AI Timeline)
// HTTP layer only: validate the request, delegate to aiTimelineService,
// and shape the response/error exactly like explorerAi.controller.js's
// postExplain. No astrology calculation or prompt construction happens
// here.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateAiTimelineRequest } from "../validators/aiTimeline.validator.js";
import { explainTimelineEvent } from "../services/ai/aiTimelineService.js";

export const postExplain = asyncHandler(async (req, res) => {
  const errors = validateAiTimelineRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/ai-timeline/explain: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  const { chart, report, event, history } = req.body;

  try {
    const result = await explainTimelineEvent({ chart, report, event, history });
    res.json(result);
  } catch (err) {
    logger.error("AI Timeline explain error:", err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({ error: err.message || "The AI Timeline explanation is unavailable right now." });
  }
});

export default { postExplain };
