import { asyncHandler } from "../middleware/errorHandler.js";
import { getPersonalization } from "../services/personalization/personalizationService.js";

export const getPersonalizedInsights = asyncHandler(async (req, res) => {
  const { reportId, period } = req.query;
<<<<<<< HEAD
  res.json(getPersonalization(req.user.id, reportId, period));
=======
  res.json(await getPersonalization(req.user.id, reportId, period));
>>>>>>> dd91dee (release: NakshatraVerse v1.0.0 Production Ready)
});

export default { getPersonalizedInsights };
