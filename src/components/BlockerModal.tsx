/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clock, AlertTriangle, ShieldAlert, Zap, Compass, RefreshCw, Layers, BrainCircuit, HeartHandshake } from 'lucide-react';
import { BlockerType, Task } from '../types';
import { BLOCKER_LABELS } from '../lib/blockerEngine';
import { usePlanner } from '../store/plannerContext';

interface BlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const BLOCKER_ICONS: Record<BlockerType, React.ReactNode> = {
  not_enough_time: <Clock className="w-4 h-4 text-amber-500" />,
  harder_than_expected: <AlertTriangle className="w-4 h-4 text-red-500" />,
  got_distracted: <Compass className="w-4 h-4 text-indigo-500" />,
  forgot_about_it: <ShieldAlert className="w-4 h-4 text-orange-500" />,
  too_many_tasks_today: <Layers className="w-4 h-4 text-sky-500" />,
  low_motivation: <BrainCircuit className="w-4 h-4 text-violet-500" />,
  unexpected_event: <Zap className="w-4 h-4 text-emerald-500" />,
  didnt_understand: <RefreshCw className="w-4 h-4 text-pink-500" />,
  other: <HeartHandshake className="w-4 h-4 text-neutral-500" />
};

export const BlockerModal: React.FC<BlockerModalProps> = ({ isOpen, onClose, task }) => {
  const { logBlocker } = usePlanner();
  const [selectedType, setSelectedType] = useState<BlockerType | null>(null);
  const [note, setNote] = useState('');

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    logBlocker(task.goalId, task.id, selectedType, note.trim() || undefined);
    
    // Reset local form
    setSelectedType(null);
    setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="blocker-modal-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-white border border-neutral-200/80 rounded-2xl shadow-xl overflow-hidden z-10 p-6 flex flex-col max-h-[90vh]"
            id="blocker-modal-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950 font-sans">
                    Help Guardian improve your plan
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Adapting schedule for: <span className="font-semibold text-neutral-600">"{task.title}"</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                  What got in the way?
                </label>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  Choose what fits best. Guardian does not judge; we only gather insights to build a gentler, more sustainable plan around how you actually study.
                </p>
              </div>

              {/* Grid Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="blocker-options-grid">
                {(Object.keys(BLOCKER_LABELS) as BlockerType[]).map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold font-sans transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm shadow-indigo-100'
                          : 'border-neutral-150 bg-white hover:bg-neutral-50 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg transition ${isSelected ? 'bg-indigo-100' : 'bg-neutral-50'}`}>
                        {BLOCKER_ICONS[type]}
                      </div>
                      <span className="truncate">{BLOCKER_LABELS[type]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                    Optional notes
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono font-medium">Any context helps</span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Afternoon class ran late, or wasn't feeling 100%..."
                  className="w-full h-20 p-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-neutral-50/30 placeholder-neutral-400 font-sans"
                  id="blocker-note-input"
                />
              </div>

              {/* Learning Insights Hint */}
              {selectedType && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100/60 rounded-xl flex gap-2.5 items-start">
                  <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-800 block">
                      Adaptive Learner Enabled
                    </span>
                    <p className="text-[11px] text-indigo-950 font-sans font-medium leading-relaxed">
                      {selectedType === 'not_enough_time' && "Guardian will automatically add extra time buffers to future tasks to keep your evenings stress-free."}
                      {selectedType === 'harder_than_expected' && "Guardian will automatically segment future tasks into micro-checklists to prevent feeling overwhelmed."}
                      {selectedType === 'got_distracted' && "Guardian will suggest shorter 15-20 minute focus sprints with prompt breaks."}
                      {selectedType === 'didnt_understand' && "Guardian will pre-generate prerequisite study notes and concept draft guides."}
                      {['too_many_tasks_today', 'forgot_about_it', 'low_motivation', 'unexpected_event', 'other'].includes(selectedType) && "Guardian will recalculate your study rhythm to decrease load and suggest supportive focus check-ins."}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer / Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedType}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer ${
                    selectedType
                      ? 'bg-neutral-900 hover:bg-neutral-800 shadow-sm'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  Submit Blocker
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
