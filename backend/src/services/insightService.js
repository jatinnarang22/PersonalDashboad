import { getGoals } from './goalService.js';
import { getLogByDate } from './logService.js';

/** Instagram minutes: low < 30, medium 30–59, high >= 60 */
export function instagramUsageStatus(instagramMinutes) {
  const m = Number(instagramMinutes) || 0;
  if (m < 30) return 'low';
  if (m < 60) return 'medium';
  return 'high';
}

function todayUTCString() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayInsights() {
  const today = todayUTCString();
  const [goals, log] = await Promise.all([getGoals(), getLogByDate(today)]);

  const stepsGoal = goals.dailyStepsGoal;
  const codingGoal = goals.dailyCodingGoal;

  const steps = log?.steps ?? 0;
  const codingHours = log?.codingHours ?? 0;
  const instagramMinutes = log?.screenTime?.instagram ?? 0;

  const stepGoalMet = steps >= stepsGoal;
  const codingGoalMet = codingHours >= codingGoal;
  const instagramStatus = instagramUsageStatus(instagramMinutes);

  return {
    date: today,
    goals: { dailyStepsGoal: stepsGoal, dailyCodingGoal: codingGoal },
    today: log
      ? {
          steps,
          codingHours,
          instagramMinutes,
          mood: log.mood,
        }
      : null,
    stepGoalMet,
    codingGoalMet,
    instagramUsageStatus: instagramStatus,
    messages: buildMessages(stepGoalMet, codingGoalMet, instagramStatus),
  };
}

function buildMessages(stepGoalMet, codingGoalMet, instagramStatus) {
  const messages = [];
  messages.push(
    stepGoalMet
      ? 'You met your step goal today'
      : 'You have not met your step goal yet today'
  );
  messages.push(
    codingGoalMet
      ? 'You met your coding goal today'
      : 'You have not met your coding goal yet today'
  );
  if (instagramStatus === 'high') {
    messages.push('You spent too much time on Instagram');
  } else if (instagramStatus === 'medium') {
    messages.push('Instagram usage is moderate today');
  } else {
    messages.push('Instagram usage is low today');
  }
  return messages;
}
