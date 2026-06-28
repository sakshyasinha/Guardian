/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../store/plannerContext';
import { BlockerModal } from './BlockerModal';
import { TaskConsistencyCard } from './SidebarWidgets';
import { ProgressDrawer } from './ProgressDrawer';
import { Task } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  HelpCircle,
  Flame,
  Trophy,
  Zap,
  Award,
  Shield,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

// Simple Markdown Formatter for AI Starter Presentation
const parseInlineFormatting = (text: string): React.ReactNode[] => {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-neutral-950 font-sans">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-800 border border-neutral-200">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const FormattedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-neutral-200/60 shadow-sm">
            {codeLanguage && (
              <div className="bg-neutral-100 px-3 py-1 text-[10px] font-mono font-bold text-neutral-500 border-b border-neutral-200/60 uppercase tracking-wider">
                {codeLanguage}
              </div>
            )}
            <pre className="p-3 bg-neutral-900 text-neutral-100 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
              {codeBlockLines.join('\n')}
            </pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    if (trimmed.startsWith('#')) {
      const depth = (trimmed.match(/^#+/) || ['#'])[0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      const headingClass = depth === 1 
        ? "text-sm font-extrabold text-neutral-900 tracking-tight mt-3 mb-1.5 font-sans border-b border-neutral-100 pb-1"
        : depth === 2
        ? "text-xs font-bold text-neutral-900 tracking-tight mt-2.5 mb-1 font-sans"
        : "text-[11px] font-bold text-neutral-800 uppercase tracking-wider mt-2 mb-1 font-sans";
      elements.push(
        React.createElement(`h${Math.min(depth + 1, 6)}` as any, { key: `h-${i}`, className: headingClass }, text)
      );
      continue;
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      const text = trimmed.replace(/^[-*•]\s*/, '');
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-indigo-500 font-bold text-sm leading-none select-none">•</span>
          <p className="text-xs text-neutral-700 leading-relaxed font-sans">{parseInlineFormatting(text)}</p>
        </div>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-xs text-neutral-700 leading-relaxed font-sans my-1">
        {parseInlineFormatting(line)}
      </p>
    );
  }

  return <div className="space-y-1.5">{elements}</div>;
};

export const TodayView: React.FC = () => {
  const {
    tasks,
    goals,
    pomodoro,
    isGeneratingDraft,
    startFocus,
    pauseFocus,
    resetFocus,
    toggleTask,
    toggleChecklistItem,
    generateSubtaskDraft,
    gamification,
    triggerAudioChime,
    completionHistory,
    blockers,
    setActiveTab,
    moveTaskToTomorrow,
    activeRecovery,
    calendarEvents,
    isCalendarConnected,
    isSandboxMode,
    connectCalendar,
    disconnectCalendar,
    setSandboxMode,
    resetDemo,
    injectMockConflict
  } = usePlanner();

  const [expandedDrafts, setExpandedDrafts] = useState<Record<string, boolean>>({});
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [customInputVal, setCustomInputVal] = useState<string>('');
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [blockerTask, setBlockerTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Find the highest priority, incomplete task that does not belong to a completed goal, excluding deferred ones
  const activeTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (t.isDeferred) return false;
    const g = goals.find(goal => goal.id === t.goalId);
    return g ? g.status !== 'completed' : true;
  });

  // Collect deferred tasks for tomorrow
  const deferredTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.isDeferred) return false;
    const g = goals.find(goal => goal.id === t.goalId);
    return g ? g.status !== 'completed' : true;
  });
  
  // Sort tasks: match goal priority first, then task duration
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    const goalA = goals.find(g => g.id === a.goalId);
    const goalB = goals.find(g => g.id === b.goalId);
    const pA = goalA?.priority === 'high' ? 3 : goalA?.priority === 'medium' ? 2 : 1;
    const pB = goalB?.priority === 'high' ? 3 : goalB?.priority === 'medium' ? 2 : 1;
    return pB - pA;
  });

  const topTask = sortedActiveTasks[0] || null;
  const nextTasks = sortedActiveTasks.slice(1, 5);

  const getGoalName = (goalId: string) => {
    const g = goals.find(goal => goal.id === goalId);
    return g ? g.name : 'Active Goal';
  };

  const getGoalPriority = (goalId: string) => {
    const g = goals.find(goal => goal.id === goalId);
    return g ? g.priority : 'medium';
  };

  const getNearestDeadlineDay = () => {
    const activeGoals = goals.filter(g => g.status !== 'completed');
    if (activeGoals.length === 0) return "Friday's deadline";
    const sorted = [...activeGoals].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    const nearest = sorted[0];
    try {
      const date = new Date(nearest.deadline);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]}'s deadline`;
    } catch (e) {
      return "Friday's deadline";
    }
  };

  // Pomodoro circular timer geometry
  const strokeWidth = 8;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progressFraction = pomodoro.secondsRemaining / pomodoro.totalSeconds;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleDraftExpansion = (itemId: string) => {
    setExpandedDrafts(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getRankName = (lvl: number) => {
    if (lvl <= 1) return 'Consistent Starter';
    if (lvl <= 2) return 'Focused Builder';
    if (lvl <= 3) return 'Deadline Defender';
    if (lvl <= 4) return 'Recovery Master';
    return 'Guardian Plan Master';
  };

  const atRiskGoals = goals.filter(g => g.status === 'at-risk' || g.status === 'slightly-behind');
  const hasPendingRecovery = activeRecovery !== null && activeRecovery.status === 'PENDING_REVIEW';
  const hasReviewedRecovery = activeRecovery !== null && activeRecovery.status === 'REVIEWED';

  const isBehind = hasPendingRecovery;
  const hasNoGoals = goals.length === 0;
  const isInterventionApplied = activeRecovery !== null && activeRecovery.status === 'APPLIED';

  // Find lowest priority active task for rescheduling recommendation in Slight Risk case
  const lowerPriorityTasks = sortedActiveTasks.filter(t => t.id !== topTask?.id);
  const lowestPriorityTask = lowerPriorityTasks[lowerPriorityTasks.length - 1] || lowerPriorityTasks[0] || null;

  const isSlightlyBehind = !isBehind && !hasReviewedRecovery && lowestPriorityTask !== null && sortedActiveTasks.reduce((sum, t) => sum + t.durationHours, 0) > 3.5;

  // 1. Subtle top-level date context logic
  const getSubtleDateContext = () => {
    const today = new Date("2026-06-27"); // Current day according to our additional metadata
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = today.toLocaleDateString('en-US', options);

    const activeGoals = goals.filter(g => g.status !== 'completed');
    if (activeGoals.length === 0) {
      return {
        dateStr,
        proximityStr: "All milestones secured • No pending deadlines"
      };
    }

    // Sort active goals by deadline
    const sorted = [...activeGoals].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    const nearest = sorted[0];

    try {
      const deadlineDate = new Date(nearest.deadline);
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const deadlineDayName = daysOfWeek[deadlineDate.getDay()];

      // Calculate days difference
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let proximityStr = `Deadline: ${deadlineDayName}`;
      if (diffDays > 0) {
        proximityStr += ` • ${diffDays} day${diffDays === 1 ? '' : 's'} left`;
      } else if (diffDays === 0) {
        proximityStr += ` • Due today`;
      } else {
        proximityStr += ` • Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
      }

      return {
        dateStr,
        proximityStr
      };
    } catch (e) {
      return {
        dateStr,
        proximityStr: "Deadline protected"
      };
    }
  };

  const { dateStr, proximityStr } = getSubtleDateContext();

  const getFocusWindow = (index: number, durationHours: number) => {
    const startHour = 10 + index * 1.5; // Starts at 10:00 AM
    const formatHour = (h: number) => {
      const pm = h >= 12;
      const displayH = h % 12 === 0 ? 12 : Math.floor(h % 12);
      const mStr = h % 1 === 0 ? "00" : "30";
      return `${displayH}:${mStr} ${pm ? 'PM' : 'AM'}`;
    };
    return `${formatHour(startHour)} - ${formatHour(startHour + durationHours)}`;
  };

  const getTomorrowFocusWindow = (index: number, durationHours: number) => {
    const startHour = 9 + index * 1.5; // Starts at 9:00 AM tomorrow
    const formatHour = (h: number) => {
      const pm = h >= 12;
      const displayH = h % 12 === 0 ? 12 : Math.floor(h % 12);
      const mStr = h % 1 === 0 ? "00" : "30";
      return `${displayH}:${mStr} ${pm ? 'PM' : 'AM'}`;
    };
    return `${formatHour(startHour)} - ${formatHour(startHour + durationHours)}`;
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Subtle Top-Level Date & Deadline Context Layer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">{dateStr}</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">{proximityStr}</p>
        </div>
      </div>
      {/* Recovery Summary Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-w-2xl relative overflow-hidden">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-950" />
              <span className="text-xs font-semibold text-neutral-950 uppercase tracking-wider font-mono">Recovery Summary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                hasNoGoals
                  ? 'bg-neutral-300'
                  : hasPendingRecovery 
                  ? 'bg-rose-500 animate-pulse' 
                  : hasReviewedRecovery 
                  ? 'bg-indigo-500' 
                  : isSlightlyBehind 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }`} />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                {hasNoGoals 
                  ? 'Idle' 
                  : hasPendingRecovery 
                  ? 'Attention Required' 
                  : hasReviewedRecovery 
                  ? 'Recovery Plan Ready' 
                  : isSlightlyBehind 
                  ? 'Action Suggested' 
                  : isInterventionApplied || deferredTasks.length > 0
                  ? 'Rebalanced'
                  : 'Optimized'}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-3">
            {hasNoGoals ? (
              <>
                <p className="text-sm font-semibold text-neutral-950 font-sans leading-relaxed">
                  Ready to secure your project deadlines.
                </p>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  Establish your first milestone in the Timeline tab to enable autonomous deadline protection.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 hover:text-neutral-700 font-sans cursor-pointer transition underline"
                  >
                    <span>Define Deadlines</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : hasPendingRecovery ? (
              <>
                <p className="text-sm font-semibold text-neutral-950 font-sans leading-relaxed">
                  {atRiskGoals.length === 1 
                    ? `"${atRiskGoals[0].name}" is at risk of falling behind.` 
                    : `You have ${atRiskGoals.length} milestones requiring attention.`}
                </p>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  Guardian has prepared a recovery plan to protect your target deadline by optimizing your focus schedule.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('recovery')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                  >
                    <span>Review Recovery Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : hasReviewedRecovery ? (
              <>
                <p className="text-sm font-semibold text-neutral-950 font-sans leading-relaxed">
                  Guardian noticed today's workload becoming unrealistic.
                  A recovery plan has already been prepared to protect your deadline.
                </p>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  I've designed a zero-friction plan to protect "{goals.find(g => g.id === activeRecovery?.goalId)?.name || 'your milestone'}".
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('recovery')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                  >
                    <span>Review Recovery Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : isSlightlyBehind ? (
              <>
                <p className="text-sm font-semibold text-neutral-950 font-sans leading-relaxed">
                  Your execution load for today is exceeding sustainable pacing limits.
                </p>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  {lowestPriorityTask 
                    ? `I suggest reallocating "${lowestPriorityTask.title}" to tomorrow to secure your high-priority outcomes.`
                    : "I recommend deferring one secondary milestone to tomorrow. Your core deadline remains perfectly safe."}
                </p>
                {lowestPriorityTask && (
                  <div className="pt-2">
                    <button
                      onClick={() => moveTaskToTomorrow(lowestPriorityTask.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                    >
                      <span>Defer to Tomorrow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              (() => {
                const actions: string[] = [];
                const deferredCount = deferredTasks.length;
                const hasExtraTime = blockers.some(b => b.blockerType === 'not_enough_time');
                const condensedCount = tasks.filter(t => t.title.includes('[Condensed]') && !t.completed).length;

                if (deferredCount > 0) {
                  actions.push(`I deferred ${deferredCount} pacing task${deferredCount === 1 ? '' : 's'} to tomorrow's recovery buffer.`);
                }
                if (hasExtraTime) {
                  actions.push("I reallocated additional time buffers as a precaution.");
                }
                if (condensedCount > 0) {
                  actions.push(`I condensed secondary milestones to protect your target execution window.`);
                }

                if (isInterventionApplied || actions.length > 0) {
                  const nearestDeadline = getNearestDeadlineDay();
                  const firstConflict = calendarEvents.find(event => {
                    const startStr = event.start.dateTime || event.start.date;
                    if (!startStr) return false;
                    const eventStart = new Date(startStr);
                    return eventStart.getDate() === 27;
                  });
                  const conflictName = firstConflict ? firstConflict.summary : null;

                  return (
                    <>
                      <p className="text-sm font-semibold text-neutral-950 font-sans leading-relaxed">
                        Guardian rebalanced your schedule to secure your deadline.
                      </p>
                      
                      {conflictName ? (
                        <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                          Today's <span className="font-semibold text-neutral-800">"{conflictName}"</span> reduced your available focus time, so I moved lower-priority work to tomorrow to secure {nearestDeadline}.
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                          To protect {nearestDeadline}, I balanced your pacing and reallocated secondary loads into tomorrow's recovery buffer.
                        </p>
                      )}

                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('recovery')}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 font-sans cursor-pointer transition underline"
                        >
                          <span>Review Balanced Timeline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  );
                }

                return (
                  <>
                    <p className="text-sm font-semibold text-neutral-950 font-sans leading-relaxed">
                      Your schedule and deadlines are fully optimized.
                    </p>
                    <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                      Your current pace is perfectly on track. No active interventions required.
                    </p>
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Organized Temporal Columns: TODAY vs TOMORROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* TODAY COLUMN: Core Focus & Pacing Queue */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 tracking-wider uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                TODAY
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans mt-0.5">Core Focus &amp; Up Next</p>
            </div>
            {topTask && (
              <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md border border-neutral-200">
                {sortedActiveTasks.length} active focus units
              </span>
            )}
          </div>

          {topTask ? (
            <div className="space-y-6">
              
              {/* CURRENT FOCUS CARD */}
              <div className="bg-white border-2 border-neutral-950 rounded-2xl p-6 shadow-sm space-y-6 transition-all">
                
                {/* Section Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-neutral-950 text-white px-2.5 py-0.75 rounded">
                      Current Focus
                    </span>
                    {activeRecovery && (
                      <span className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                        Protected Priority
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider ${
                      getGoalPriority(topTask.goalId) === 'high' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                        : getGoalPriority(topTask.goalId) === 'medium' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                        : 'bg-neutral-50 text-neutral-600 border border-neutral-100'
                    }`}>
                      {getGoalPriority(topTask.goalId)} priority
                    </span>
                  </div>
                </div>

                {/* Milestone Title */}
                <div className="space-y-1">
                  <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider font-mono">
                    {getGoalName(topTask.goalId)}
                  </p>
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight leading-snug font-sans">
                    {topTask.title}
                  </h3>
                </div>

                {/* Focus Block / Time Allocation Context (Requirement 6) */}
                <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-indigo-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Suggested Work Block</span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-800 font-sans mt-0.5">
                      {Math.round(topTask.durationHours * 60)} min execution block
                    </p>
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      {getFocusWindow(0, topTask.durationHours)}
                    </span>
                  </div>
                  {pomodoro.isRunning && pomodoro.taskId === topTask.id && (
                    <div className="bg-neutral-950 text-white font-mono px-3 py-1.5 rounded-lg text-xs font-bold text-center shrink-0 border border-neutral-850 animate-pulse">
                      Block active • {formatTime(pomodoro.secondsRemaining)}
                    </div>
                  )}
                </div>

                {/* Why It Matters Callout */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-500 block">
                      Why It Matters
                    </span>
                    <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                      {topTask.whyItMatters || "Crucial groundwork to protect your milestones and keep you on schedule."}
                    </p>
                  </div>
                </div>

                {/* Action Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h4 className="font-semibold text-neutral-800 text-xs uppercase tracking-wider">
                      Action Checklist
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-mono bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200/60">
                      {topTask.checklist.filter(c => c.completed).length}/{topTask.checklist.length} Complete
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topTask.checklist.map((item) => {
                      const hasDraft = !!topTask.drafts?.[item.id];
                      const isDraftGenerating = isGeneratingDraft === item.id;
                      const isExpanded = !!expandedDrafts[item.id];

                      return (
                        <div 
                          key={item.id} 
                          className="border border-neutral-100 hover:border-neutral-200 rounded-xl p-3 bg-neutral-50/20 transition duration-150"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start gap-3 cursor-pointer text-sm text-neutral-700 flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleChecklistItem(topTask.id, item.id)}
                                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                              />
                              <span className={`${item.completed ? 'line-through text-neutral-400 font-normal' : 'text-neutral-800 font-medium'} leading-snug`}>
                                {item.text}
                              </span>
                            </label>

                            <div className="shrink-0">
                              {hasDraft ? (
                                <button
                                  onClick={() => toggleDraftExpansion(item.id)}
                                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 bg-indigo-50 rounded-lg transition cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Starter Guide</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              ) : (
                                <button
                                  disabled={isDraftGenerating}
                                  onClick={() => generateSubtaskDraft(topTask.id, item.id, item.text)}
                                  className={`text-xs flex items-center gap-1 font-medium px-2 py-1 rounded-lg transition cursor-pointer ${
                                    isDraftGenerating 
                                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                      : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200'
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-500" />
                                  <span>{isDraftGenerating ? 'Drafting...' : 'AI Starter'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {hasDraft && isExpanded && (
                            <div className="mt-3 pt-3 border-t border-neutral-150 bg-white rounded-lg p-3 text-xs text-neutral-700 shadow-inner max-h-72 overflow-y-auto">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-indigo-600 mb-2">
                                <Terminal className="w-3 h-3" />
                                <span>AI Autonomous Starter Material</span>
                              </div>
                              <div className="bg-neutral-50/50 p-3 rounded-lg border border-neutral-100/80 leading-relaxed font-sans text-xs">
                                <FormattedMarkdown content={topTask.drafts?.[item.id] || ''} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Work Block Configuration & Interactive Timer */}
                <div className="pt-6 border-t border-neutral-100 space-y-4">
                  {topTask.isTimerEligible ? (
                    <div className="space-y-4">
                      {/* Customize Duration */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                          Set Focus Duration
                        </label>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {[10, 15, 20, 30, 45, 60].map((mins) => {
                            const active = (selectedDuration === mins) || (selectedDuration === null && mins === (topTask.suggestedWorkBlockMinutes || Math.round(topTask.durationHours * 60)));
                            return (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => {
                                  setSelectedDuration(mins);
                                  setCustomInputVal('');
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  active 
                                    ? 'bg-neutral-950 border-neutral-950 text-white' 
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                                }`}
                              >
                                {mins} min
                              </button>
                            );
                          })}
                          
                          <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-1 h-[34px] w-20">
                            <input
                              type="text"
                              placeholder="Custom"
                              value={customInputVal}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setCustomInputVal(val);
                                if (val) {
                                  setSelectedDuration(parseInt(val, 10));
                                } else {
                                  setSelectedDuration(null);
                                }
                              }}
                              className="w-full text-xs font-mono focus:outline-none text-neutral-800"
                            />
                            <span className="text-[9px] text-neutral-400 font-mono">m</span>
                          </div>
                        </div>
                      </div>

                      {/* Timer controls */}
                      <div className="flex items-center gap-3 pt-1">
                        {pomodoro.isRunning && pomodoro.taskId === topTask.id ? (
                          <>
                            <button
                              onClick={pauseFocus}
                              className="flex-1 px-4 py-3 flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-900 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
                            >
                              <Pause className="w-4 h-4 fill-white" />
                              <span>Pause Focus Block</span>
                            </button>
                            <button
                              onClick={resetFocus}
                              className="p-3 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition cursor-pointer"
                              title="Reset Focus Timer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              const finalMins = selectedDuration || topTask.suggestedWorkBlockMinutes || Math.round(topTask.durationHours * 60) || 25;
                              startFocus(topTask.id, finalMins);
                            }}
                            className="flex-1 px-4 py-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Start Focus Block</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <HelpCircle className="w-4.5 h-4.5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-700 block">
                            Execution Recommendation
                          </span>
                          <p className="text-xs text-neutral-800 font-medium leading-relaxed font-sans">
                            {topTask.reminderRecommendation || "Execute at your own pace. No timed focus blocks required."}
                          </p>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono bg-white p-2.5 rounded-lg border border-neutral-150">
                        <span className="font-bold text-neutral-600 uppercase text-[8px] tracking-wider block mb-0.5">Instructions</span>
                        {topTask.bestTimeContext}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Complete Buttons */}
                <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-neutral-400">Pacing stable? Report any blockers if stalled.</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setBlockerTask(topTask);
                        setIsBlockerModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                      title="Report blocker to let Guardian adapt"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Stalled / Skip</span>
                    </button>
                    <button
                      onClick={() => toggleTask(topTask.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                      <span>Complete Milestone</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Today's Queue (Remaining Tasks today) */}
              {nextTasks.length > 0 && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                      Execution Queue
                    </h4>
                    <span className="text-[9px] font-mono text-neutral-400">Sequential pacing</span>
                  </div>
                  <div className="space-y-3">
                    {nextTasks.map((task, idx) => (
                      <div
                        key={task.id}
                        className="p-3 bg-neutral-50/50 border border-neutral-150 rounded-xl hover:border-neutral-200 transition flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 pr-2 min-w-0">
                          <p className="text-xs font-semibold text-neutral-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                            <span>{getGoalName(task.goalId)}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-medium">
                              {getFocusWindow(idx + 1, task.durationHours)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const targetMins = task.suggestedWorkBlockMinutes || Math.round(task.durationHours * 60) || 25;
                            startFocus(task.id, targetMins);
                          }}
                          className="text-[10px] font-bold text-neutral-600 hover:text-neutral-900 px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg shrink-0 transition cursor-pointer"
                        >
                          Focus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1 font-sans">No execution units remaining for today</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Your execution path is clear and stable. All target timelines are secured.
              </p>
            </div>
          )}
        </div>

        {/* TOMORROW COLUMN: Buffer & Deferred Milestones */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 tracking-wider uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                TOMORROW
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans mt-0.5">Pacing buffer &amp; Deferred queue</p>
            </div>
            {deferredTasks.length > 0 && (
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100/60 font-bold">
                Deferred
              </span>
            )}
          </div>

          {/* Tomorrow's Recovery Buffer Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Shield className="w-4 h-4 text-neutral-950" />
              <div>
                <h4 className="text-xs font-bold text-neutral-800 tracking-tight font-sans">Recovery Buffer</h4>
              </div>
            </div>

            {deferredTasks.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100/40 rounded-lg space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-700 block">
                    Recovery Summary
                  </span>
                  <p className="text-xs font-medium text-neutral-800 leading-normal">
                    {deferredTasks.length} pacing task{deferredTasks.length === 1 ? '' : 's'} relocated to tomorrow to ensure quality execution.
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Total buffer reserved: <strong className="text-indigo-600">
                      {deferredTasks.reduce((sum, t) => sum + t.durationHours, 0).toFixed(1)} hours
                    </strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">Deferred Tasks</span>
                  {deferredTasks.map((task, idx) => (
                    <div key={task.id} className="p-2.5 bg-neutral-50/70 border border-neutral-150 rounded-lg space-y-1 hover:border-neutral-200 transition">
                      <p className="text-xs font-semibold text-neutral-800 line-clamp-2">{task.title}</p>
                      <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                        <span>{getGoalName(task.goalId)}</span>
                        <span className="font-semibold text-indigo-600">
                          {getTomorrowFocusWindow(idx, task.durationHours)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  Tomorrow's timeline is clear of pacing conflicts.
                </p>
              </div>
            )}
          </div>

          {/* Hackathon Finalist Status Cards */}
          <TaskConsistencyCard 
            gamification={gamification}
            completionHistory={completionHistory}
            onClick={() => setIsDrawerOpen(true)}
          />

          {/* Quiet Google Calendar integration */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Google Calendar</span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isCalendarConnected 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
              }`}>
                {isCalendarConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
              {isCalendarConnected 
                ? 'Your calendar events are synced as quiet constraints to protect standard sleep & focus blocks.' 
                : 'Connect your calendar to automatically identify pacing conflicts and protect core milestone deadlines.'}
            </p>

            <div className="flex items-center justify-end pt-2 border-t border-neutral-100">
              {isCalendarConnected ? (
                <button
                  onClick={disconnectCalendar}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-800 transition underline cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectCalendar}
                  className="text-[10px] font-bold text-neutral-950 hover:text-neutral-700 transition underline cursor-pointer"
                >
                  Connect Calendar
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Progress Detail Profile Drawer (Feature 3) */}
      <ProgressDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        gamification={gamification}
        goals={goals}
        tasks={tasks}
        blockers={blockers}
      />

      <BlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        task={blockerTask}
      />
    </div>
  );
};
