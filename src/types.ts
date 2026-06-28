/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// -------------------------------------------------------------------------
// Original / Alternate Types
// -------------------------------------------------------------------------

export interface SubTask {
  id: string;
  title: string;
  estimatedHours: number;
  completed: boolean;
  recommendedDate: string; // YYYY-MM-DD
  energyRequired: 'high' | 'medium' | 'low';
  phase: 'research' | 'execution' | 'refinement' | 'review';
}

export interface BlockerDiagnosis {
  id: string;
  timestamp: string;
  type: 'perfectionism' | 'overwhelm' | 'lack_of_interest' | 'exhaustion' | 'unclear_steps';
  analysis: string;
  microStep: string; // Actionable 5-min micro-task to break the freeze
}

export interface RecoveryAction {
  id: string;
  originalTaskTitle: string;
  recoveredAction: string;
  priority: 'high' | 'critical';
  timeSavingMin: number;
}

export interface Deadline {
  id: string;
  title: string;
  description: string;
  targetDate: string; // ISO date string
  estimatedHours: number; // calculated total workload hours
  availableHoursPerDay: number; // user hours available per day
  currentProgress: number; // 0-100
  status: 'planning' | 'on_track' | 'high_risk' | 'critical' | 'completed';
  riskScore: number; // 0 - 100
  riskReason: string; // Gemini diagnosis of risk
  subtasks: SubTask[];
  blockerDiagnoses: BlockerDiagnosis[];
  recoveryHistory: {
    timestamp: string;
    reason: string;
    actions: RecoveryAction[];
    previousRiskScore: number;
  }[];
}

export interface UserPreferences {
  sleepStart: string; // "23:00"
  sleepEnd: string; // "07:00"
  peakEnergy: 'morning' | 'afternoon' | 'evening';
  sessionDuration: number; // default 50 mins
  bufferRatio: number; // 1.2 meaning 20% safety margin
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: 'Award' | 'Flame' | 'Zap' | 'Target' | 'Trophy' | 'Shield';
  type: 'streak' | 'xp' | 'subtasks' | 'deadlines' | 'crisis';
  threshold: number;
}

export interface UserStats {
  streak: number;
  longestStreak: number;
  lastCompletionDate: string | null; // YYYY-MM-DD
  xp: number;
  level: number;
  totalSubtasksCompleted: number;
  totalDeadlinesCompleted: number;
  unlockedAchievementIds: string[];
}


// -------------------------------------------------------------------------
// Core Planner & Guardian Context Types
// -------------------------------------------------------------------------

export type TimelineStatus = 'on-track' | 'slightly-behind' | 'at-risk' | 'critical' | 'completed';

export interface Goal {
  id: string;
  name: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high';
  status: TimelineStatus;
  createdAt: string;
  completedAt?: string;
  planSource?: 'ai' | 'fallback_ai' | 'local';
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  durationHours: number;
  bestTimeContext: string;
  whyItMatters?: string;
  reminderRecommendation?: string;
  suggestedWorkBlockMinutes?: number;
  isTimerEligible?: boolean;
  isDeferred?: boolean;
  checklist: ChecklistItem[];
  drafts?: Record<string, string>; // Maps checklistItem id to generated markdown draft
}

export interface FocusSession {
  taskId: string | null;
  isRunning: boolean;
  secondsRemaining: number;
  totalSeconds: number;
  isBreak: boolean;
  completedCount: number;
}

export interface RecoveryRecommendation {
  id: string;
  goalId: string;
  scopeReduction: string;
  condensedSchedule: string;
  timeSavedHours: number;
  created: number;
  proposalVersion: number;
  status: 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED';
  scheduleSignature: string;
  rearrangedTasks: { taskTitle: string; suggestedAction: string }[];
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastCompletedDate: string | null;
  totalTasksCompleted: number;
  totalSubtasksCompleted: number;
}

export type BlockerType = 
  | 'not_enough_time' 
  | 'harder_than_expected' 
  | 'got_distracted' 
  | 'forgot_about_it' 
  | 'too_many_tasks_today' 
  | 'low_motivation' 
  | 'unexpected_event' 
  | 'didnt_understand' 
  | 'other';

export interface BlockerRecord {
  id: string;
  goalId: string;
  taskId: string;
  blockerType: BlockerType;
  optionalNote?: string;
  loggedAt?: string;
  timestamp?: string;
}

export interface CompletionDayData {
  xpGained: number;
  tasksCompleted: number;
  subtasksCompleted: number;
  timestamp: string;
}

export type CompletionHistory = Record<string, CompletionDayData>;

export interface ToastState {
  id: string;
  title: string;
  message: string;
  xp: number;
  streak: number;
  levelFrom: number;
  levelTo: number;
}
