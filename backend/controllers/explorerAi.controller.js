// ─────────────────────────────────────────────────────────────────────────
// Explorer AI Controller — V5.0 Phase 5C (Explorer AI Explanations)
// HTTP layer only: validate the request, delegate to explorerAiService,
// and shape the response/error exactly like assistant.controller.js's
// postChatMessage / lifeCoach.controller.js's postDailyGuidance. No
// astrology calculation or prompt construction happens here.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateExplorerAiRequest } from "../validators/explorerAi.validator.js";
import { explainExplorerItem } from "../services/ai/explorerAiService.js";

export const postExplain = asyncHandler(async (req, res) => {
  const errors = validateExplorerAiRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/explorer-ai/explain: ${errors.join(", ")}`);
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
  }

  const { chart, report, itemType, itemId, itemLabel, contextFacts, history } = req.body;

  try {
    const result = await explainExplorerItem({
      chart, report, itemType, itemId, itemLabel, contextFacts, history,
    });
    res.json(result);
  } catch (err) {
    logger.error("Explorer AI explain error:", err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    res.status(status).json({ error: err.message || "The Explorer AI explanation is unavailable right now." });
  }
});

export default { postExplain };
