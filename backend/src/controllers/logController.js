import * as logService from '../services/logService.js';

export async function createLog(req, res, next) {
  try {
    const log = await logService.createLog(req.body);
    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
}

export async function getLogs(req, res, next) {
  try {
    const logs = await logService.getAllLogs();
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function getLogByDate(req, res, next) {
  try {
    const { date } = req.params;
    const log = await logService.getLogByDate(date);
    if (!log) {
      return res.status(404).json({ error: 'Log not found for this date' });
    }
    res.json(log);
  } catch (err) {
    if (err.message === 'Invalid date') {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    next(err);
  }
}
