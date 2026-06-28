/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePlanner } from '../store/plannerContext';
import { Calendar, Clock, Plus, Trash2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export const TimelineView: React.FC = () => {
  const {
    goals,
    tasks,
    isGeneratingTasks,
    apiWarning,
    addGoal,
    deleteGoal,
    requestRecoveryPlan
  } = usePlanner();

  // Local Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a descriptive goal name.');
      return;
    }
    if (!deadline) {
      setFormError('Please select a target deadline.');
      return;
    }
    
    const hoursNum = Number(estimatedHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      setFormError('Estimated work hours must be greater than zero.');
      return;
    }

    await addGoal(name, description, deadline, hoursNum, priority);
    
    // Reset Form
    setName('');
    setDescription('');
    setDeadline('');
    setEstimatedHours('8');
    setPriority('medium');
  };

  // Helper formatting utilities
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, options);
  };

  const getGoalProgress = (goalId: string) => {
    const goalTasks = tasks.filter(t => t.goalId === goalId);
    if (goalTasks.length === 0) return 0;
    const completedTasks = goalTasks.filter(t => t.completed);
    return Math.round((completedTasks.length / goalTasks.length) * 100);
  };

  const getRemainingMetrics = (goalId: string, deadlineStr: string) => {
    const goalTasks = tasks.filter(t => t.goalId === goalId && !t.completed);
    const remainingHours = goalTasks.reduce((sum, t) => sum + t.durationHours, 0);

    const deadlineDate = new Date(deadlineStr + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msDiff = deadlineDate.getTime() - today.getTime();
    const daysLeft = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

    const dailyLoad = Number((remainingHours / daysLeft).toFixed(1));

    return {
      remainingHours,
      daysLeft,
      dailyLoad
    };
  };

  const getGoalCompletionDetails = (goal: any) => {
    const compAt = goal.completedAt || new Date().toISOString().split('T')[0];
    const completedDate = new Date(compAt + 'T12:00:00');
    const deadlineDate = new Date(goal.deadline + 'T12:00:00');
    
    const diffTime = deadlineDate.getTime() - completedDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedCompletedDate = completedDate.toLocaleDateString(undefined, options);
    
    let daysText = '';
    let textColor = 'text-indigo-700';
    if (diffDays > 0) {
      daysText = `Finished ${diffDays} day${diffDays > 1 ? 's' : ''} early`;
      textColor = 'text-emerald-700';
    } else if (diffDays < 0) {
      daysText = `Finished ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} late`;
      textColor = 'text-rose-700';
    } else {
      daysText = 'Finished right on time';
      textColor = 'text-indigo-700';
    }
    
    return {
      formattedCompletedDate,
      daysText,
      textColor
    };
  };

  return (
    <div id="timeline-view" className="space-y-10 animate-fade-in">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Create New Goal Form */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm sticky top-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-neutral-700" />
            Add New Goal
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Goal Name
              </label>
              <input
                id="goal-name-input"
                type="text"
                placeholder="e.g. Build Hackathon App, Complete Database Deployment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isGeneratingTasks}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 disabled:bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Goal Details / Description
              </label>
              <textarea
                id="goal-description-textarea"
                placeholder="Briefly describe what you want to achieve or specific tech stack, guidelines, or core execution milestones (e.g. Use React and local storage, build backend API endpoints, etc.)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isGeneratingTasks}
                rows={3}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 disabled:bg-neutral-50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Deadline
              </label>
              <input
                id="goal-deadline-input"
                type="date"
                value={deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isGeneratingTasks}
                className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 disabled:bg-neutral-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Est. Work Hours
                </label>
                <input
                  id="goal-hours-input"
                  type="number"
                  min="1"
                  max="120"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={isGeneratingTasks}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 disabled:bg-neutral-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Priority
                </label>
                <select
                  id="goal-priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  disabled={isGeneratingTasks}
                  className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-800 focus:border-neutral-800 bg-white disabled:bg-neutral-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <button
              id="create-goal-btn"
              type="submit"
              disabled={isGeneratingTasks}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-sm font-semibold py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {isGeneratingTasks ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                  <span>AI Breaking Down Tasks...</span>
                </>
              ) : (
                <span>Analyze & Setup Goal</span>
              )}
            </button>

            {isGeneratingTasks && (
              <p className="text-[10px] text-center text-neutral-500 italic mt-2">
                Guardian is currently generating realistic contextual tasks and checklists via Gemini.
              </p>
            )}
          </form>

          {/* Resilient Planning Core Explanation */}
          <div className="mt-6 pt-5 border-t border-neutral-100 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
              Resilient Fallback Hierarchy
            </h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Guardian utilizes a fail-safe multi-layered execution hierarchy to guarantee you always receive a relevant, highly personalized execution path:
            </p>
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start p-2 bg-indigo-50/40 rounded-xl border border-indigo-100/40">
                <div className="p-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-indigo-900">Layer 1: Primary AI</p>
                  <p className="text-[10px] text-indigo-700 leading-normal">Gemini Pro generates highly specific, bespoke milestones.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start p-2 bg-violet-50/40 rounded-xl border border-violet-100/40">
                <div className="p-1 bg-violet-50 border border-violet-100 rounded-lg text-violet-600 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-violet-900">Layer 2: Adaptive Copilot</p>
                  <p className="text-[10px] text-violet-700 leading-normal">Uses advanced Gemini models to dynamically re-organize schedules.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start p-2 bg-amber-50/40 rounded-xl border border-amber-100/40">
                <div className="p-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-600 shrink-0 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900">Layer 3: Smart Local Planner</p>
                  <p className="text-[10px] text-amber-700 leading-normal">A localized, offline backup that acts immediately when network access is unavailable.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Goals & Timeline Health Monitoring */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-900 text-lg">Goal Health</h3>
            <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-2.5 py-1 rounded-full">
              {goals.filter(g => g.status !== 'completed').length} Active Deadlines
            </span>
          </div>

          {apiWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>{apiWarning}</p>
            </div>
          )}

          {goals.length > 0 ? (
            <div className="space-y-6">
              {goals.map((goal) => {
                const progress = getGoalProgress(goal.id);
                const { remainingHours, daysLeft, dailyLoad } = getRemainingMetrics(goal.id, goal.deadline);
                const goalTasks = tasks.filter(t => t.goalId === goal.id);

                return (
                  <div
                    key={goal.id}
                    className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:border-neutral-300 transition space-y-4"
                  >
                    
                    {/* Goal Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-neutral-900 text-base">{goal.name}</h4>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                              goal.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                              goal.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {goal.priority}
                            </span>
                            
                            {/* Planner Source Badge */}
                            {(!goal.planSource || goal.planSource === 'ai') && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded" title="Generated by Guardian's Primary Gemini model">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                AI Generated Plan
                              </span>
                            )}
                            {goal.planSource === 'fallback_ai' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded" title="Generated by Guardian's secondary high-speed Gemini model">
                                <Sparkles className="w-3 h-3 text-violet-500" />
                                AI Assisted Plan
                              </span>
                            )}
                            {goal.planSource === 'local' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded" title="Guardian's offline planner prepared this backup plan to protect your timeline.">
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                Smart Backup Plan
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Due {formatDate(goal.deadline)}
                          </span>
                          <span>•</span>
                          <span>{goalTasks.length} total milestones</span>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-lg p-2.5 mt-2 max-w-xl leading-relaxed whitespace-pre-wrap">
                            <span className="font-semibold text-[10px] text-neutral-500 uppercase tracking-wider block mb-0.5">Details</span>
                            {goal.description}
                          </p>
                        )}
                      </div>

                      {/* Timeline Health Status Badge */}
                      <div className="sm:text-right shrink-0">
                        {goal.status === 'completed' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Completed
                          </span>
                        )}
                        {goal.status === 'on-track' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            On Track
                          </span>
                        )}
                        {goal.status === 'slightly-behind' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Slightly Behind
                          </span>
                        )}
                        {goal.status === 'at-risk' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            At Risk
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-neutral-600 font-medium">
                        <span>Completion Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>                    {/* Timeline Math Load/Completion Details */}
                    {goal.status === 'completed' ? (() => {
                      const details = getGoalCompletionDetails(goal);
                      return (
                        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl grid grid-cols-2 gap-2 text-center text-xs">
                          <div>
                            <p className="text-neutral-500 font-medium">Completion Date</p>
                            <p className="font-semibold text-neutral-900 mt-0.5">{details.formattedCompletedDate}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500 font-medium">Timeline Performance</p>
                            <p className={`font-bold mt-0.5 ${details.textColor}`}>{details.daysText}</p>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-neutral-500 font-medium">Estimated Work Left</p>
                          <p className="font-semibold text-neutral-900 mt-0.5">{remainingHours} hours</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 font-medium">Days Remaining</p>
                          <p className="font-semibold text-neutral-900 mt-0.5">{daysLeft} days</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 font-medium">Recommended Daily Pace</p>
                          <p className={`font-bold mt-0.5 ${
                            goal.status === 'at-risk' ? 'text-red-700' :
                            goal.status === 'slightly-behind' ? 'text-amber-700' :
                            'text-emerald-700'
                          }`}>
                            {dailyLoad} hrs/day
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Footers */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {(goal.status === 'slightly-behind' || goal.status === 'at-risk') && (
                        <button
                          onClick={() => requestRecoveryPlan(goal.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold rounded-xl border border-red-200/55 transition shadow-sm"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Heal Schedule (Self-Healing)</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
              <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-neutral-900 mb-1">No deadlines tracked yet</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Add your upcoming project delivery, development sprints, resumes, or project execution targets using the form.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
