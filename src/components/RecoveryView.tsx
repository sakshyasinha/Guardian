/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePlanner } from '../store/plannerContext';
import { 
  Shield, 
  ArrowRight, 
  Check, 
  X, 
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  Code2,
  FileCode,
  Zap
} from 'lucide-react';

export const RecoveryView: React.FC = () => {
  const {
    goals,
    tasks,
    activeRecovery,
    isGeneratingRecovery,
    requestRecoveryPlan,
    applyRecoveryPlan,
    discardRecoveryPlan,
    setActiveTab
  } = usePlanner();

  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [animationStep, setAnimationStep] = useState<number>(0);

  const behindGoals = goals.filter(g => g.status === 'at-risk' || g.status === 'slightly-behind');
  const hasNoGoals = goals.length === 0;

  // Auto-select first behind goal if available
  useEffect(() => {
    if (behindGoals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(behindGoals[0].id);
    }
  }, [behindGoals, selectedGoalId]);

  const getGoalName = (goalId: string) => {
    return goals.find(g => g.id === goalId)?.name || 'Active Goal';
  };

  const handleApplyWithAnimation = () => {
    setIsApplying(true);
    setAnimationStep(0);
    
    // Trigger steps sequentially over 1.8 seconds to create a high-fidelity "AI at work" feel
    const timer1 = setTimeout(() => setAnimationStep(1), 300);
    const timer2 = setTimeout(() => setAnimationStep(2), 700);
    const timer3 = setTimeout(() => setAnimationStep(3), 1100);
    const timer4 = setTimeout(() => setAnimationStep(4), 1500);
    const timer5 = setTimeout(() => setAnimationStep(5), 1900);
    
    const timerFinal = setTimeout(() => {
      applyRecoveryPlan();
      setIsApplying(false);
      setAnimationStep(0);
    }, 2500);
  };

  // Loading State
  if (isGeneratingRecovery) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-3xl shadow-sm text-center max-w-xl mx-auto font-sans p-8">
        <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-3 border-neutral-100"></span>
          <span className="absolute inset-0 rounded-full border-3 border-neutral-950 border-t-transparent animate-spin"></span>
          <Shield className="w-5 h-5 text-neutral-900 absolute" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">Analyzing schedule...</h3>
        <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
          Guardian is identifying essential milestones to build your recovery plan.
        </p>
      </div>
    );
  }

  // Applying Animation State
  if (isApplying) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-3xl shadow-sm text-center max-w-xl mx-auto font-sans p-8 space-y-6 animate-fade-in">
        <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-3 border-neutral-100"></span>
          <span className="absolute inset-0 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin"></span>
          <Shield className="w-5 h-5 text-emerald-500 absolute" />
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-neutral-900">Applying Guardian Recovery...</h3>
          <p className="text-xs text-neutral-400">Reconfiguring timeline with zero-friction adjustments</p>
        </div>

        <div className="w-full max-w-xs bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left space-y-2.5 font-mono text-xs text-neutral-600 shadow-inner">
          <div className={`flex items-center gap-2 transition-all duration-300 ${animationStep >= 1 ? 'text-emerald-600 opacity-100 font-bold' : 'opacity-40'}`}>
            {animationStep >= 1 ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block" />}
            <span>✓ Schedule updated</span>
          </div>
          <div className={`flex items-center gap-2 transition-all duration-300 ${animationStep >= 2 ? 'text-emerald-600 opacity-100 font-bold' : 'opacity-40'}`}>
            {animationStep >= 2 ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block" />}
            <span>✓ Tasks reorganized</span>
          </div>
          <div className={`flex items-center gap-2 transition-all duration-300 ${animationStep >= 3 ? 'text-emerald-600 opacity-100 font-bold' : 'opacity-40'}`}>
            {animationStep >= 3 ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block" />}
            <span>✓ Buffer added</span>
          </div>
          <div className={`flex items-center gap-2 transition-all duration-300 ${animationStep >= 4 ? 'text-emerald-600 opacity-100 font-bold' : 'opacity-40'}`}>
            {animationStep >= 4 ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block" />}
            <span>✓ Deadline protected</span>
          </div>
        </div>

        {animationStep >= 5 && (
          <p className="text-xs font-bold text-emerald-600 animate-fade-in flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 stroke-[3px]" />
            <span>Recovery successfully applied.</span>
          </p>
        )}
      </div>
    );
  }

  // Active Recovery Suggestion ready to Review
  if (activeRecovery) {

    if (activeRecovery.status === 'DISMISSED') {
      return (
        <div className="max-w-xl mx-auto py-12 space-y-6 font-sans animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-50 border border-neutral-200 mb-2">
            <X className="w-8 h-8 text-neutral-500 stroke-[2px]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight font-sans">
              Proposal Dismissed
            </h1>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              You chose to keep your original schedule. Guardian will monitor your progress and only intervene if you fall significantly behind again.
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={() => setActiveTab('today')}
              className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Back to Today's Tasks
            </button>
          </div>
        </div>
      );
    }

    if (activeRecovery.status === 'EXPIRED') {
      return (
        <div className="max-w-xl mx-auto py-12 space-y-6 font-sans animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200 mb-2">
            <AlertCircle className="w-8 h-8 text-amber-600 stroke-[2px]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight font-sans">
              Proposal Expired
            </h1>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Your active schedule changed before this plan was accepted. Guardian is preparing updated recovery options for you.
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={() => setActiveTab('today')}
              className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Back to Today's Tasks
            </button>
          </div>
        </div>
      );
    }

    const targetGoalName = getGoalName(activeRecovery.goalId);
    const goalTasks = tasks.filter(t => t.goalId === activeRecovery.goalId && !t.completed);
    
    const skipRecs = activeRecovery.rearrangedTasks.filter(rt => rt.action === 'skip');
    const reduceRecs = activeRecovery.rearrangedTasks.filter(rt => rt.action === 'reduce');

    const originalTodayCount = goalTasks.filter(t => !t.isDeferred).length;
    const deferredCount = skipRecs.length;
    const newTodayCount = Math.max(0, originalTodayCount - deferredCount);

    const todayRemainingTasksOriginal = goalTasks.filter(t => !t.isDeferred);
    const todayRemainingTasksRecommendation = todayRemainingTasksOriginal.filter(t => !skipRecs.some(sr => sr.taskId === t.id));
    const deferredTasksRecommendation = goalTasks.filter(t => skipRecs.some(sr => sr.taskId === t.id));

    // Only show workload rebalance if today's remaining tasks actually changed (e.g. some were deferred/skipped)
    const hasWorkloadRebalance = todayRemainingTasksOriginal.length !== todayRemainingTasksRecommendation.length;

    // Filter out reduce actions that don't actually change anything (e.g. no reduction in hours and not large enough to split)
    const validReduceRecs = reduceRecs.filter(rt => {
      const task = tasks.find(t => t.id === rt.taskId);
      if (!task) return false;
      const originalHours = task.durationHours;
      const newHours = rt.newHours || originalHours;
      const isLarge = originalHours >= 1.5;
      return isLarge || newHours < originalHours;
    });

    return (
      <div className="max-w-xl mx-auto py-2 space-y-6 font-sans animate-fade-in">
        
        {/* Header section (strictly focusing on modifications) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
              activeRecovery.status === 'APPLIED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : activeRecovery.status === 'PENDING_REVIEW'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              Status: {
                activeRecovery.status === 'APPLIED' 
                  ? 'Applied — Back on Track'
                  : activeRecovery.status === 'PENDING_REVIEW' 
                  ? 'Pending Review' 
                  : 'Reviewed — Waiting for your decision'
              }
            </span>
            <span className="text-[9px] font-bold text-neutral-400 font-mono bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
              v{activeRecovery.proposalVersion || 1}.0
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-950 tracking-tight font-sans">
            {activeRecovery.status === 'APPLIED' ? 'Guardian reorganized your schedule' : 'Guardian prepared these schedule improvements'}
          </h1>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            {activeRecovery.status === 'APPLIED' 
              ? 'These improvements are currently active in your timeline to protect your deadline.'
              : 'Review and accept the proposed modifications to recover your target deadline.'}
          </p>
        </div>

        {activeRecovery.status === 'APPLIED' && (
          <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-950 rounded-xl p-4 flex items-start gap-3">
            <div className="p-1 bg-emerald-500 rounded-lg text-white mt-0.5 shrink-0 shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-sans">Intervention Applied Successfully</h3>
              <p className="text-[11px] text-emerald-800 font-sans leading-relaxed">
                By deferring non-essential workload and focusing on critical milestones, you are fully back on track to hit your deadline without unnecessary crunch.
              </p>
            </div>
          </div>
        )}

        {/* Guardian Analysis Card */}
        {(() => {
          const analysisPoints: string[] = [];
          const totalTodayHours = todayRemainingTasksOriginal.reduce((sum, t) => sum + t.durationHours, 0);
          
          if (totalTodayHours > 3.5) {
            analysisPoints.push(`Today's workload of **${totalTodayHours.toFixed(1)}h** exceeded your recent completion pace.`);
          } else {
            analysisPoints.push("Today's workload is slightly heavy compared to your optimal focus window.");
          }

          if (todayRemainingTasksRecommendation.length > 0) {
            const primaryTask = todayRemainingTasksRecommendation[0];
            analysisPoints.push(`"${primaryTask.title}" was kept today because it blocks critical milestone deadlines.`);
          }

          if (deferredTasksRecommendation.length > 0) {
            const firstDeferred = deferredTasksRecommendation[0];
            analysisPoints.push(`"${firstDeferred.title}" was deferred to tomorrow because it has no downstream dependencies.`);
          }

          analysisPoints.push("Added a recovery buffer because you've previously reported running out of time on similar goals.");

          return (
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 shadow-inner space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 font-sans">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Guardian Analysis</span>
              </div>
              <div className="text-xs text-neutral-600 font-sans space-y-2">
                {analysisPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold font-sans mt-0.5 shrink-0">✓</span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Recovery Explanation Section (Requirement 3) */}
        <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-sans">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>How Guardian Protected Your Timeline</span>
          </div>
          <div className="text-xs text-neutral-700 font-sans leading-relaxed space-y-2">
            <p>
              <strong>Why this action was taken:</strong> To protect your mental capacity and prevent burn-out, Guardian isolated your non-essential and high-risk task items and reallocated them to tomorrow's recovery buffer. Today's active conflict with your Google Calendar events left you with compressed focus hours.
            </p>
            <p>
              <strong>How it protected your deadline:</strong> By clearing the immediate clutter from today's pacing and centering your energy on high-priority milestones, Guardian secured a realistic execution path. This ensures you satisfy the target deadline for <strong className="text-indigo-950">"{targetGoalName}"</strong> without resorting to an unhealthy work sprint or risking late delivery.
            </p>
            <p className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider">
              🛡 Guardian protected your deadline.
            </p>
          </div>
        </div>

        {/* Diff Cards Container */}
        <div className="space-y-4">

          {/* Card 1: Rebalanced Workload */}
          {hasWorkloadRebalance && (
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Rebalanced Workload</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">Reason</span>
                  <p className="text-xs text-neutral-700">Today's workload exceeded your recent completion pace.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 border-t border-neutral-100">
                  <div className="p-3 bg-rose-50/40 border border-rose-100/60 rounded-lg">
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block font-mono mb-1.5">Original (Today)</span>
                    <div className="text-xs text-neutral-500 font-mono line-through space-y-1">
                      {/* Show ONLY the tasks that are actually being deferred/skipped */}
                      {todayRemainingTasksOriginal.filter(t => skipRecs.some(sr => sr.taskId === t.id)).map((t) => (
                        <div key={t.id}>• {t.title}</div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block font-mono mb-1.5">Guardian Recommendation</span>
                    <div className="text-xs text-emerald-900 font-mono font-semibold space-y-2">
                      {deferredTasksRecommendation.length > 0 && (
                        <div>
                          <div className="text-amber-800 font-bold mb-0.5">Tomorrow (Deferred)</div>
                          {deferredTasksRecommendation.map((t) => (
                            <div key={t.id} className="text-neutral-600 font-normal">• {t.title}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Split Large Task (or Condensed Task Workload) */}
          {validReduceRecs.map((rt, idx) => {
            const task = tasks.find(t => t.id === rt.taskId);
            if (!task) return null;
            const originalHours = task.durationHours;
            const newHours = rt.newHours || originalHours;
            const isLarge = originalHours >= 1.5;

            return (
              <div key={idx} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{isLarge ? 'Split Large Task' : 'Condensed Task Workload'}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">Reason</span>
                    <p className="text-xs text-neutral-700">
                      {isLarge 
                        ? "Large tasks were repeatedly being skipped or deferred." 
                        : "Reducing total duration to focus purely on core deliverable objectives."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 border-t border-neutral-100">
                    <div className="p-3 bg-rose-50/40 border border-rose-100/60 rounded-lg">
                      <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block font-mono mb-1.5">Original</span>
                      <div className="text-xs text-neutral-500 font-mono line-through">
                        {task.title} ({originalHours * 60} min)
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block font-mono mb-1.5">Guardian Recommendation</span>
                      <div className="text-xs text-emerald-900 font-mono font-semibold space-y-1">
                        {isLarge ? (
                          <>
                            <div>• {task.title} - Part 1 ({Math.round(newHours * 30)} min)</div>
                            <div>• {task.title} - Part 2 ({Math.round(newHours * 30)} min)</div>
                          </>
                        ) : (
                          <div>• {task.title} ({Math.round(newHours * 60)} min)</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Card 3: Deferred Optional Work */}
          {skipRecs.map((rt, idx) => {
            const task = tasks.find(t => t.id === rt.taskId);
            if (!task) return null;

            return (
              <div key={idx} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Deferred Optional Work</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">Reason</span>
                    <p className="text-xs text-neutral-700">Optional work or non-critical polishing threatened the final deadline.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 border-t border-neutral-100">
                    <div className="p-3 bg-rose-50/40 border border-rose-100/60 rounded-lg">
                      <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block font-mono mb-1.5">Original</span>
                      <div className="text-xs text-neutral-500 font-mono line-through">
                        {task.title}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block font-mono mb-1.5">Guardian Recommendation</span>
                      <div className="text-xs text-emerald-900 font-mono font-bold">
                        Complete after submission
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Card 4: Added Recovery Buffer */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Added Recovery Buffer</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">Reason</span>
                <p className="text-xs text-neutral-700">You've previously reported running out of time on similar goals.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 border-t border-neutral-100">
                <div className="p-3 bg-rose-50/40 border border-rose-100/60 rounded-lg">
                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block font-mono mb-1.5">Original</span>
                  <div className="text-xs text-neutral-500 font-mono line-through">
                    No recovery buffer
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block font-mono mb-1.5">Guardian Recommendation</span>
                  <div className="text-xs text-emerald-900 font-mono font-semibold">
                    30-minute recovery block tomorrow afternoon
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom actions */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          {activeRecovery.status === 'APPLIED' ? (
            <button
              onClick={() => setActiveTab('today')}
              className="w-full sm:w-auto px-6 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Back to Today's Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={discardRecoveryPlan}
                className="w-full sm:w-auto px-5 py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer text-center"
              >
                Discard Changes
              </button>
              <button
                onClick={handleApplyWithAnimation}
                className="w-full sm:w-auto px-6 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                <span>Apply Changes</span>
              </button>
            </>
          )}
        </div>

      </div>
    );
  }

  // State: No Active suggestion currently active. Display beautiful intervention selection or status.
  return (
    <div className="max-w-xl mx-auto py-4 space-y-6 font-sans animate-fade-in">
      
      {hasNoGoals ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-neutral-300" />
          <div className="pl-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-bold text-neutral-800 tracking-tight">🛡 Guardian</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900 leading-snug">
                I'm ready to protect your deadlines.
              </p>
              <p className="text-xs text-neutral-500 leading-normal">
                Add your first goal under the Timeline tab to initialize your self-healing schedule.
              </p>
            </div>
          </div>
        </div>
      ) : behindGoals.length > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-5">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />
          
          <div className="pl-2 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-neutral-800 tracking-tight">🛡 Guardian Stepped In</span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-neutral-900 leading-snug">
                {behindGoals.length === 1 
                  ? `I noticed your "${behindGoals[0].name}" goal was likely to miss its deadline.` 
                  : `I noticed ${behindGoals.length} of your goals were likely to miss their deadlines.`}
              </p>
              <p className="text-xs text-neutral-500 leading-normal">
                I already prepared recovery plans to keep them achievable.
              </p>
            </div>

            {/* Goal selector if multiple are falling behind */}
            {behindGoals.length > 1 && (
              <div className="space-y-2 pt-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                  Select goal to review:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {behindGoals.map(g => (
                    <label 
                      key={g.id} 
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                        selectedGoalId === g.id 
                          ? 'border-neutral-950 bg-neutral-50 font-semibold shadow-sm' 
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                      onClick={() => setSelectedGoalId(g.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="goal-selection" 
                          checked={selectedGoalId === g.id}
                          onChange={() => setSelectedGoalId(g.id)}
                          className="text-neutral-950 focus:ring-neutral-950 h-3.5 w-3.5"
                        />
                        <span className="text-neutral-800">{g.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded">
                        {tasks.filter(t => t.goalId === g.id && !t.completed).length} items left
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => requestRecoveryPlan(selectedGoalId || behindGoals[0].id)}
                className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>View Changes</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
          
          <div className="pl-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-neutral-800 tracking-tight">🛡 Guardian</span>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-neutral-900 leading-snug">
                Everything looks good.
              </p>
              <div className="text-xs text-neutral-500 space-y-1 leading-normal">
                <p>No schedule changes are needed today.</p>
                <p>Keep working on your current priority.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
