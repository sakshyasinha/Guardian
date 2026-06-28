import { BlockerRecord, BlockerType, Task } from '../types';

export const BLOCKER_LABELS: Record<BlockerType, string> = {
  not_enough_time: 'Not enough time',
  harder_than_expected: 'Harder than expected',
  got_distracted: 'Got distracted',
  forgot_about_it: 'Forgot about it',
  too_many_tasks_today: 'Too many tasks today',
  low_motivation: 'Low motivation',
  unexpected_event: 'Unexpected event',
  didnt_understand: "Didn't understand the material",
  other: 'Other'
};

export interface BlockerStat {
  type: BlockerType;
  label: string;
  count: number;
}

export interface AdaptationInfo {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  explanation: string;
  type: 'time' | 'complexity' | 'focus' | 'comprehension' | 'load';
}

/**
 * Computes frequency stats for all logged blockers (without percentage-heavy charts to prevent fake precision).
 */
export function getBlockerStats(blockers: BlockerRecord[]): BlockerStat[] {
  const counts: Record<BlockerType, number> = {
    not_enough_time: 0,
    harder_than_expected: 0,
    got_distracted: 0,
    forgot_about_it: 0,
    too_many_tasks_today: 0,
    low_motivation: 0,
    unexpected_event: 0,
    didnt_understand: 0,
    other: 0,
  };

  blockers.forEach(b => {
    if (counts[b.blockerType] !== undefined) {
      counts[b.blockerType]++;
    } else {
      counts.other++;
    }
  });

  return Object.entries(counts)
    .map(([type, count]) => ({
      type: type as BlockerType,
      label: BLOCKER_LABELS[type as BlockerType],
      count,
    }))
    .filter(stat => stat.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns user-friendly descriptions of adaptations.
 */
export function getActiveAdaptations(blockers: BlockerRecord[]): AdaptationInfo[] {
  const counts = blockers.reduce((acc, b) => {
    acc[b.blockerType] = (acc[b.blockerType] || 0) + 1;
    return acc;
  }, {} as Record<BlockerType, number>);

  const timeCount = counts['not_enough_time'] || 0;
  const harderCount = counts['harder_than_expected'] || 0;
  const distractedCount = counts['got_distracted'] || 0;
  const understandCount = counts['didnt_understand'] || 0;
  const loadCount = (counts['too_many_tasks_today'] || 0) + (counts['not_enough_time'] || 0);

  return [
    {
      id: 'buffer_expansion',
      title: 'I added extra time to similar tasks.',
      description: 'Extra padding added to task durations based on logged setbacks.',
      isActive: timeCount >= 2,
      explanation: `Since "Not enough time" was noted, I have added gentle extra time buffers to future tasks to keep your schedule realistic and stress-free.`,
      type: 'time'
    },
    {
      id: 'subtask_decompression',
      title: 'I broke down complex tasks into smaller, manageable milestones.',
      description: 'Divides complex work into smaller checkboxes automatically.',
      isActive: harderCount >= 2,
      explanation: `Because some milestones required more effort than expected, future complex tasks are auto-divided into bite-sized, practical checklists.`,
      type: 'complexity'
    },
    {
      id: 'pomodoro_shortening',
      title: 'I recommended shorter focus sprints to prevent distraction.',
      description: 'Reduces recommended session lengths to prevent distraction.',
      isActive: distractedCount >= 2,
      explanation: `To keep your momentum clean, focus blocks have been dynamically adjusted from 25m to shorter focus intervals.`,
      type: 'focus'
    },
    {
      id: 'concept_summaries',
      title: 'I generated starting walkthroughs and foundational guides.',
      description: 'Provides warm-up explanations of the task to build confidence.',
      isActive: understandCount >= 2,
      explanation: `To help you cross the starting line of unfamiliar tasks, AI starters will include structured walkthrough notes.`,
      type: 'comprehension'
    },
    {
      id: 'workload_reduction',
      title: 'You now have fewer major tasks today.',
      description: 'Caps recommended goals to avoid scheduling overload and burnout.',
      isActive: loadCount >= 3,
      explanation: `With high workload or time strain recorded, I have limited your recommended daily milestones to protect your energy.`,
      type: 'load'
    }
  ];
}

/**
 * Returns a multiplier for estimated study/work hours based on the 'not_enough_time' pattern.
 */
export function getAdaptiveDurationMultiplier(blockers: BlockerRecord[]): number {
  const count = blockers.filter(b => b.blockerType === 'not_enough_time').length;
  if (count >= 4) return 1.40; // 40% buffer
  if (count >= 2) return 1.25; // 25% buffer
  return 1.0;
}

/**
 * Returns adaptive Pomodoro length recommendations in minutes.
 */
export function getAdaptivePomodoroMinutes(blockers: BlockerRecord[], defaultMinutes: number): number {
  const distractedCount = blockers.filter(b => b.blockerType === 'got_distracted').length;
  if (distractedCount >= 4) return 15;
  if (distractedCount >= 2) return 20;
  return defaultMinutes;
}

/**
 * Returns adaptive daily task counts.
 */
export function getAdaptiveDailyTaskLimit(blockers: BlockerRecord[]): number {
  const counts = blockers.reduce((acc, b) => {
    acc[b.blockerType] = (acc[b.blockerType] || 0) + 1;
    return acc;
  }, {} as Record<BlockerType, number>);

  const loadCount = (counts['too_many_tasks_today'] || 0) + (counts['not_enough_time'] || 0);
  if (loadCount >= 5) return 2;
  if (loadCount >= 3) return 3;
  return 4; // standard default
}

/**
 * Gets user-friendly descriptions of what Guardian has observed.
 */
export function getGuardianObservations(blockers: BlockerRecord[]): string[] {
  const observations: string[] = [];
  if (blockers.length === 0) return [];

  const counts = blockers.reduce((acc, b) => {
    acc[b.blockerType] = (acc[b.blockerType] || 0) + 1;
    return acc;
  }, {} as Record<BlockerType, number>);

  const timeCount = counts['not_enough_time'] || 0;
  const harderCount = counts['harder_than_expected'] || 0;
  const distractedCount = counts['got_distracted'] || 0;
  const understandCount = counts['didnt_understand'] || 0;
  const loadCount = (counts['too_many_tasks_today'] || 0);
  const motivationCount = (counts['low_motivation'] || 0);

  if (timeCount >= 2) {
    observations.push("You frequently find that planned milestones require a bit more time to execute properly.");
  } else if (timeCount === 1) {
    observations.push("You faced a slight time constraint on a task recently.");
  }

  if (harderCount >= 2) {
    observations.push("Complex, multi-step milestones tend to feel a bit heavier than originally planned.");
  } else if (harderCount === 1) {
    observations.push("One of your targets required more unexpected effort than planned.");
  }

  if (distractedCount >= 2) {
    observations.push("Long, open-ended sessions tend to make staying focused a challenge.");
  } else if (distractedCount === 1) {
    observations.push("Distractions occasionally pause your momentum.");
  }

  if (understandCount >= 2) {
    observations.push("Starting a milestone can feel difficult when the task is completely new.");
  } else if (understandCount === 1) {
    observations.push("Initial complexity about the task delayed a milestone check-in.");
  }

  if (loadCount >= 2) {
    observations.push("Piling too many active targets on a single day creates scheduling friction.");
  }

  if (motivationCount >= 2) {
    observations.push("Starting focus blocks is harder when motivation runs a bit low.");
  }

  // Fallback if low data but not matching rules
  if (observations.length === 0 && blockers.length > 0) {
    observations.push("You are checking in with Guardian to navigate daily scheduling hurdles.");
    observations.push("Setbacks are being safely mapped to gentle planning adjustments.");
  }

  return observations;
}

/**
 * Gets user-friendly explanations of changes applied.
 */
export function getAppliedChangesList(blockers: BlockerRecord[]): string[] {
  const changes: string[] = [];
  if (blockers.length === 0) return [];

  const counts = blockers.reduce((acc, b) => {
    acc[b.blockerType] = (acc[b.blockerType] || 0) + 1;
    return acc;
  }, {} as Record<BlockerType, number>);

  const timeCount = counts['not_enough_time'] || 0;
  const harderCount = counts['harder_than_expected'] || 0;
  const distractedCount = counts['got_distracted'] || 0;
  const understandCount = counts['didnt_understand'] || 0;
  const loadCount = (counts['too_many_tasks_today'] || 0) + (counts['not_enough_time'] || 0);

  if (timeCount >= 2) {
    changes.push(`I added extra time buffer to similar tasks to protect your deadlines.`);
  }
  if (harderCount >= 2) {
    changes.push("I broke down complex tasks into smaller, bite-sized checkpoints.");
  }
  if (distractedCount >= 2) {
    changes.push(`I shortened target focused intervals to shorter focus sprints for cleaner execution stamina.`);
  }
  if (understandCount >= 2) {
    changes.push("I added structured guides and starting reference steps to reduce start-up friction.");
  }
  if (loadCount >= 3) {
    changes.push(`You now have one fewer major task today to protect your energy.`);
  }

  // Fallback if low data but no adaptations fully active yet
  if (changes.length === 0 && blockers.length > 0) {
    changes.push("Guardian is monitoring your rhythm. Adaptations will trigger as patterns emerge.");
  }

  return changes;
}
