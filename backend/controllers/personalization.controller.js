import { asyncHandler } from "../middleware/errorHandler.js";
import { getPersonalization } from "../services/personalization/personalizationService.js";

export const getPersonalizedInsights = asyncHandler(async (req, res) => {
  const { reportId, period } = req.query;
  res.json(getPersonalization(req.user.id, reportId, period));
});

export default { getPersonalizedInsights };
