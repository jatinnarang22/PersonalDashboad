import * as insightService from '../services/insightService.js';

export async function getTodayInsights(req, res, next) {
  try {
    const data = await insightService.getTodayInsights();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
