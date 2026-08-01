// ─────────────────────────────────────────────────────────────────────────
// Assistant Controller — V3.0 Phase 4 (AI Astrology Assistant)
// HTTP layer only: validate the request, delegate to assistantService, and
// shape the response/error exactly like the existing astrology.controller.js
// endpoints. No astrology calculation or prompt construction happens here.
// ─────────────────────────────────────────────────────────────────────────
import logger from "../services/utils/logger.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateChatRequest } from "../validators/assistant.validator.js";
import { answerChatQuestion } from "../services/ai/assistantService.js";

export const postChatMessage = asyncHandler(async (req, res) => {
  const errors = validateChatRequest(req.body);
  if (errors.length) {
    logger.warn(`Validation failed for /api/assistant/chat: ${errors.join(", ")}`);
<<<<<<< HEAD
    return res.status(400).json({ error: `Invalid request: ${errors.join(", ")}` });
=======
    return res.status(400).json({ error: req.t("errors.invalidRequest", { errors: errors.join(", ") }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }

  const { chart, report, history, question, festivalContext, panchangContext, muhuratContext } = req.body;

  try {
    const result = await answerChatQuestion({
      chart,
      report,
      history,
      question,
      // V4.5 Phase 4 (AI Report Chat): optional, backend-computed-only
      // extra context. All three are undefined on every existing caller,
      // so this is purely additive.
      festivalContext,
      panchangContext,
      muhuratContext,
<<<<<<< HEAD
=======
      // Multilingual Foundation Phase: resolved by middleware/language.js.
      // A no-op for English (today's only populated language) — see
      // services/localization/aiLanguageInstruction.js.
      language: req.language,
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
    });
    res.json(result);
  } catch (err) {
    logger.error("Assistant chat error:", err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
<<<<<<< HEAD
    res.status(status).json({ error: err.message || "The AI assistant is unavailable right now." });
=======
    res.status(status).json({ error: err.message || req.t("errors.serviceUnavailable", { feature: "The AI assistant" }) });
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
  }
});

export default { postChatMessage };
