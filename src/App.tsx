/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { PlannerProvider, usePlanner } from './store/plannerContext';
import { TodayView } from './components/TodayView';
import { TimelineView } from './components/TimelineView';
import { RecoveryView } from './components/RecoveryView';
import { CelebrationToast } from './components/CelebrationToast';
import { GuardianCopilot } from './components/GuardianCopilot';
import logoImg from './lib/logo.jpg';
import { 
  Shield, 
  Calendar, 
  Sparkles, 
  Activity, 
  RotateCcw, 
  Zap, 
  Check,
  X,
  Sliders
} from 'lucide-react';

const GuardianAppShell: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    goals, 
    tasks, 
    toast, 
    setToast,
    isSandboxMode,
    setSandboxMode,
    resetDemo,
    injectMockConflict,
    calendarEvents
  } = usePlanner();

  const hasConflict = calendarEvents.some(e => e.id === 'mock-conflict-1');

  // Simple stats for the tiny top status bar
  const activeTasksCount = tasks.filter(t => {
    if (t.completed) return false;
    const g = goals.find(goal => goal.id === t.goalId);
    return g ? g.status !== 'completed' : true;
  }).length;
  const criticalGoalsCount = goals.filter(g => g.status === 'at-risk').length;

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans flex flex-col antialiased">
      
      {/* Main Premium Clean Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 flex items-center justify-center select-none shadow-[0_2px_5px_rgba(0,0,0,0.12)] ring-1 ring-neutral-200">
               <img src={logoImg} alt="Guardian logo" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-neutral-900 leading-none">Guardian</h1>
              <span className="text-[10px] text-neutral-500 font-medium">Self-Healing Recovery &amp; Execution Copilot</span>
            </div>
          </div>

          {/* Simple Tab Navigators (Only 3 Tabs) */}
          <nav className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/55">
            <button
              id="today-tab-btn"
              onClick={() => setActiveTab('today')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Today
            </button>
            <button
              id="timeline-tab-btn"
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Timeline
            </button>
            <button
              id="recovery-tab-btn"
              onClick={() => setActiveTab('recovery')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition flex items-center gap-1.5 ${
                activeTab === 'recovery'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Recovery Plan
              {criticalGoalsCount > 0 && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
          </nav>

          {/* Spacer to keep alignment perfect */}
          <div className="w-32 hidden md:block" />

        </div>
      </header>

      {/* Main Core Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {activeTab === 'today' && <TodayView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'recovery' && <RecoveryView />}
      </main>

      {/* Humbler, Professional Page Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 mt-12 text-center text-xs text-neutral-400">
        <p className="font-mono">Guardian: Self-Healing Recovery &amp; Execution Copilot • Designed for resilient execution</p>
      </footer>

      {/* Completion Celebration Toast */}
      <CelebrationToast toast={toast} onClose={() => setToast(null)} />

      {/* Intelligent Planning Copilot Floating Panel */}
      <GuardianCopilot />

    </div>
  );
};

export default function App() {
  return (
    <PlannerProvider>
      <GuardianAppShell />
    </PlannerProvider>
  );
}
