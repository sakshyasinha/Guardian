import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Flame, Clock, CheckCircle, Target, Shield, X } from 'lucide-react';
import { GamificationState, Goal, Task, BlockerRecord } from '../types';

interface ProgressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: GamificationState;
  goals: Goal[];
  tasks: Task[];
  blockers: BlockerRecord[];
}

export const ProgressDrawer: React.FC<ProgressDrawerProps> = ({
  isOpen,
  onClose,
  gamification,
  goals,
  tasks,
  blockers
}) => {
  // Derive real statistics
  const milestonesCompleted = tasks.filter(t => t.completed).length;
  const goalsCompleted = goals.filter(g => g.status === 'completed').length;
  
  // Deadlines Saved: Completed goals that had at least one logged blocker
  const deadlinesSaved = goals.filter(g => 
    g.status === 'completed' && blockers.some(b => b.goalId === g.id)
  ).length;

  // Total Focus Hours: Completed tasks * task duration
  const totalFocusHours = tasks
    .filter(t => t.completed)
    .reduce((sum, t) => sum + t.durationHours, 0);

  // Longest streak from localStorage, updated dynamically
  const storedLongest = localStorage.getItem('guardian_longest_streak');
  const longestStreak = Math.max(
    gamification.streak,
    storedLongest ? parseInt(storedLongest, 10) : 0
  );

  if (isOpen) {
    localStorage.setItem('guardian_longest_streak', longestStreak.toString());
  }

  const hasHistory = milestonesCompleted > 0 || goalsCompleted > 0;

  // Progression subtle label
  const getSubtleRank = (lvl: number) => {
    if (lvl <= 1) return 'Consistent Starter';
    if (lvl <= 2) return 'Focused Builder';
    if (lvl <= 3) return 'Deadline Defender';
    if (lvl <= 4) return 'Recovery Master';
    return 'Guardian Plan Master';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-45"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight">Progress Profile</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Real-time statistics & planning stamina</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {!hasHistory ? (
                <div className="text-center py-12 px-4 space-y-3 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
                  <Award className="w-8 h-8 text-neutral-300 mx-auto" />
                  <h4 className="text-xs font-bold text-neutral-800">Not enough history yet.</h4>
                  <p className="text-[11px] text-neutral-400 max-w-[240px] mx-auto leading-relaxed">
                    Complete your first milestone to initialize your persistent statistics profile.
                  </p>
                </div>
              ) : (
                <>
                  {/* Subtle Profile Level */}
                  <div className="bg-gradient-to-br from-neutral-900 to-indigo-950 p-5 rounded-2xl text-white border border-neutral-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Shield className="w-24 h-24" />
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-mono font-bold text-lg shadow-inner">
                        {gamification.level}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-300 block">
                          Current Rank
                        </span>
                        <h4 className="font-bold text-sm text-neutral-100 tracking-tight leading-none mt-1">
                          {getSubtleRank(gamification.level)}
                        </h4>
                        <div className="mt-3 w-48 space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400">
                            <span>XP: {gamification.xp} / {gamification.level * 100}</span>
                            <span>{gamification.xp % 100}%</span>
                          </div>
                          <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                              style={{ width: `${gamification.xp % 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Planning Stamina</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* STAT 1: STREAK */}
                      <div className="bg-neutral-50/60 border border-neutral-200/50 p-4 rounded-2xl flex flex-col justify-between">
                        <Flame className="w-5 h-5 text-amber-500" />
                        <div className="mt-4">
                          <span className="text-[10px] text-neutral-400 block font-medium">Longest Streak</span>
                          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                            {longestStreak} <span className="text-xs font-sans text-neutral-500 font-normal">days</span>
                          </span>
                        </div>
                      </div>

                      {/* STAT 2: HOURS */}
                      <div className="bg-neutral-50/60 border border-neutral-200/50 p-4 rounded-2xl flex flex-col justify-between">
                        <Clock className="w-5 h-5 text-sky-500" />
                        <div className="mt-4">
                          <span className="text-[10px] text-neutral-400 block font-medium">Total Focus Hours</span>
                          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                            {totalFocusHours.toFixed(1)} <span className="text-xs font-sans text-neutral-500 font-normal">hrs</span>
                          </span>
                        </div>
                      </div>

                      {/* STAT 3: MILESTONES */}
                      <div className="bg-neutral-50/60 border border-neutral-200/50 p-4 rounded-2xl flex flex-col justify-between">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <div className="mt-4">
                          <span className="text-[10px] text-neutral-400 block font-medium">Milestones Done</span>
                          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                            {milestonesCompleted}
                          </span>
                        </div>
                      </div>

                      {/* STAT 4: GOALS */}
                      <div className="bg-neutral-50/60 border border-neutral-200/50 p-4 rounded-2xl flex flex-col justify-between">
                        <Target className="w-5 h-5 text-indigo-500" />
                        <div className="mt-4">
                          <span className="text-[10px] text-neutral-400 block font-medium">Goals Completed</span>
                          <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                            {goalsCompleted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STAT 5: DEADLINES SAVED (Full Width) */}
                    <div className="bg-emerald-50/35 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block font-medium">Deadlines Saved</span>
                          <p className="text-[11px] text-neutral-500 leading-normal mt-0.5">
                            At-risk goals rescued and finished on time.
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold font-mono text-emerald-800 shrink-0">
                        {deadlinesSaved}
                      </span>
                    </div>
                  </div>

                  {/* Motivational Quote */}
                  <div className="p-4 bg-indigo-50/30 border border-indigo-150/40 rounded-xl text-center">
                    <p className="text-[11px] text-neutral-600 italic">
                      "Stamina is not built through giant leaps, but through quiet, persistent everyday completions."
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
