import * as goalService from '../services/goalService.js';

export async function getGoals(req, res, next) {
  try {
    const goals = await goalService.getGoals();
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

export async function postGoals(req, res, next) {
  try {
    const goals = await goalService.upsertGoals(req.body);
    res.json(goals);
  } catch (err) {
    next(err);
  }
}
