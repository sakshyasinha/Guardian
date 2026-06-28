/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { usePlanner } from '../store/plannerContext';
import { motion, AnimatePresence } from 'motion/react';
import { GuardianPresence } from './GuardianPresence';
import { 
  Sparkles, 
  X, 
  Send, 
  Activity, 
  ShieldAlert, 
  Calendar, 
  Zap, 
  Split, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Play, 
  Clock, 
  HelpCircle,
  TrendingDown,
  Volume2,
  Trash2,
  Lock,
  ChevronRight
} from 'lucide-react';

interface CopilotMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  simulation?: {
    probabilityChange: string;
    workloadChange: string;
    riskChange: string;
    timelineImpact: string;
  };
  proposals?: {
    type: 'move_task_to_tomorrow' | 'split_milestone' | 'reduce_workload' | 'activate_recovery' | 'extend_deadline' | 'regenerate_checklist';
    taskId?: string;
    goalId?: string;
    title: string;
    description: string;
  }[];
}

export const GuardianCopilot: React.FC = () => {
  const {
    goals,
    tasks,
    blockers,
    activeRecovery,
    activeTab,
    setActiveTab,
    moveTaskToTomorrow,
    splitMilestone,
    reduceWorkload,
    extendGoalDeadline,
    regenerateChecklist,
    setToast,
    triggerAudioChime
  } = usePlanner();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `### Guardian Copilot Active 🛡️\n\nI am your intelligent scheduling agent. Connected directly to your active goals, milestones, timeline risk levels, and learning-rate adaptations.\n\nI don't just chat—**I modify schedules and simulate consequences.** How can I rebalance your schedule today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmProposal, setConfirmProposal] = useState<{
    messageId: string;
    index: number;
    proposal: any;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const activeTasks = tasks.filter(t => !t.completed && !t.isDeferred);
  const topTask = activeTasks[0] || null;

  const suggestedActions = [
    { label: "What if I skip today's task?", query: "What happens if I skip today's task?" },
    { label: "Why is my goal at risk?", query: "Why is this goal at risk?" },
    { label: "Split my current milestone", query: "Split my current milestone" },
    { label: "Reduce today's workload", query: "Reduce today's workload" },
    { label: "Activate recovery mode", query: "Activate recovery mode" },
    { label: "Move task to tomorrow", query: "Move task to tomorrow" },
    { label: "Explain my schedule", query: "Explain my schedule" },
    { label: "Help me finish faster", query: "Help me finish this goal faster" }
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Prepare full context to automatically synchronize with the server
    const context = {
      goals,
      tasks,
      blockers,
      activeRecovery
    };

    const history = messages
      .filter(m => m.id !== 'welcome' && m.role !== 'system')
      .map(m => ({
        role: m.role,
        text: m.text
      }));

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          context
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: 'reply-' + Date.now(),
        role: 'model',
        text: data.reply,
        proposals: data.proposals,
        simulation: data.simulation
      }]);

    } catch (error) {
      console.error("Copilot API Call Failed:", error);
      // Beautiful robust fallback message
      setMessages(prev => [...prev, {
        id: 'reply-err-' + Date.now(),
        role: 'model',
        text: `### Guardian Copilot is temporarily offline\n\nYour core planning tools remain 100% operational! I can still execute local rebalancing operations for you right now. Choose a fallback option below to heal your schedule:`,
        proposals: topTask ? [
          {
            type: "move_task_to_tomorrow",
            taskId: topTask.id,
            title: "Local Fallback: Shift Task to Tomorrow",
            description: "Postpones today's active milestone to restore timeline breathing room."
          },
          {
            type: "split_milestone",
            taskId: topTask.id,
            title: "Local Fallback: Split Current Milestone",
            description: "Divides today's workload into two 50% parts to clear psychological friction."
          }
        ] : []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyProposal = (messageId: string, index: number, proposal: any) => {
    setConfirmProposal({ messageId, index, proposal });
  };

  const executeConfirmedProposal = async () => {
    if (!confirmProposal) return;
    const { proposal, messageId, index } = confirmProposal;

    try {
      // Execute local deterministic action (Tier 1) based on type
      if (proposal.type === 'move_task_to_tomorrow') {
        const taskId = proposal.taskId || topTask?.id;
        if (taskId) moveTaskToTomorrow(taskId);
      } else if (proposal.type === 'split_milestone') {
        const taskId = proposal.taskId || topTask?.id;
        if (taskId) splitMilestone(taskId);
      } else if (proposal.type === 'reduce_workload') {
        const taskId = proposal.taskId || topTask?.id;
        if (taskId) reduceWorkload(taskId);
      } else if (proposal.type === 'extend_deadline') {
        const goalId = proposal.goalId || goals[0]?.id;
        if (goalId) extendGoalDeadline(goalId, 2);
      } else if (proposal.type === 'activate_recovery') {
        const goalId = proposal.goalId || goals[0]?.id;
        if (goalId) {
          setActiveTab('recovery');
        }
      } else if (proposal.type === 'regenerate_checklist') {
        const taskId = proposal.taskId || topTask?.id;
        if (taskId) await regenerateChecklist(taskId);
      }

      // Add feedback notification
      setToast({
        title: "Copilot Rebalanced Successfully!",
        xp: 15,
        streak: 0,
        levelFrom: 1,
        levelTo: 1
      });
      triggerAudioChime('complete');

      // Append system message to chat to document modification
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === messageId && msg.proposals) {
            // Filter out or mark this proposal applied
            return {
              ...msg,
              proposals: msg.proposals.filter((_, idx) => idx !== index)
            };
          }
          return msg;
        }).concat({
          id: 'sys-' + Date.now(),
          role: 'system',
          text: `Applied change: **${proposal.title}**`
        });
      });

    } catch (e) {
      console.error("Action apply failed:", e);
    } finally {
      setConfirmProposal(null);
    }
  };

  return (
    <>
      {/* Floating Guardian Presence Companion and Pulse Launcher */}
      <GuardianPresence onToggleChat={() => setIsOpen(!isOpen)} isChatOpen={isOpen} />

      {/* Main Copilot Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-22 right-6 w-[410px] h-[640px] max-h-[80vh] bg-white border border-neutral-200 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] z-50 flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-neutral-950 text-white p-4 flex items-center justify-between border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-tight">Guardian Copilot</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] text-neutral-400 font-medium font-mono uppercase">Timeline Pacing Agent</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Log Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-neutral-900 text-white text-xs px-4 py-2.5 rounded-2xl max-w-[85%] shadow-sm font-medium">
                        {msg.text}
                      </div>
                    </div>
                  ) : msg.role === 'system' ? (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-[10px] font-bold text-emerald-800 rounded-full border border-emerald-100 font-mono">
                        <Check className="w-3.5 h-3.5" />
                        {msg.text}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-w-[90%]">
                      {/* Markdown rendering simulation */}
                      <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-sm text-xs text-neutral-700 leading-relaxed space-y-2">
                        {/* Custom visual parsing for simple headers/bullets */}
                        {msg.text.split('\n\n').map((paragraph, pIdx) => {
                          if (paragraph.startsWith('###')) {
                            return (
                              <h4 key={pIdx} className="font-bold text-xs text-neutral-900 flex items-center gap-1 mt-1 border-b border-neutral-100 pb-1 uppercase tracking-wider font-mono">
                                {paragraph.replace('###', '').trim()}
                              </h4>
                            );
                          }
                          if (paragraph.startsWith('-') || paragraph.startsWith('*')) {
                            return (
                              <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1">
                                {paragraph.split('\n').map((li, liIdx) => (
                                  <li key={liIdx} className="text-neutral-600 font-medium">
                                    {li.replace(/^[-\*\s]+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          return (
                            <p key={pIdx} className="text-neutral-600 font-medium">
                              {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
                            </p>
                          );
                        })}
                      </div>

                      {/* Render Simulation Consequence Dashboard Card */}
                      {msg.simulation && (
                        <div className="bg-neutral-900 text-white border border-neutral-800 p-3.5 rounded-2xl shadow-md space-y-2.5">
                          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                            <h4 className="text-[10px] font-bold tracking-wider text-neutral-400 font-mono flex items-center gap-1 uppercase">
                              <Activity className="w-3.5 h-3.5 text-indigo-400" />
                              Consequence Simulation
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-800">
                              <span className="text-neutral-400 block mb-0.5">Prob. Change</span>
                              <span className={`text-xs font-bold ${msg.simulation.probabilityChange.includes('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {msg.simulation.probabilityChange}
                              </span>
                            </div>
                            <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-800">
                              <span className="text-neutral-400 block mb-0.5">Risk Impact</span>
                              <span className="text-xs font-bold text-amber-400">
                                {msg.simulation.riskChange}
                              </span>
                            </div>
                            <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-800 col-span-2">
                              <span className="text-neutral-400 block mb-0.5">Daily Workload</span>
                              <span className="text-xs font-bold text-neutral-200">
                                {msg.simulation.workloadChange}
                              </span>
                            </div>
                            <div className="bg-neutral-800/60 p-2 rounded-lg border border-neutral-800 col-span-2">
                              <span className="text-neutral-400 block mb-0.5">Timeline Pacing</span>
                              <span className="text-xs font-bold text-indigo-300">
                                {msg.simulation.timelineImpact}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Render Interactive Proposals (Apply Buttons) */}
                      {msg.proposals && msg.proposals.length > 0 && (
                        <div className="space-y-2 mt-1">
                          {msg.proposals.map((prop, propIdx) => (
                            <div 
                              key={propIdx} 
                              className="bg-white border border-neutral-200 hover:border-indigo-200 p-3 rounded-2xl shadow-sm transition flex flex-col gap-2 relative overflow-hidden group"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="space-y-0.5">
                                  <h5 className="font-bold text-xs text-neutral-800 flex items-center gap-1 font-mono">
                                    <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    {prop.title}
                                  </h5>
                                  <p className="text-[10px] text-neutral-500 leading-normal font-medium">
                                    {prop.description}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleApplyProposal(msg.id, propIdx, prop)}
                                className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-semibold text-[10px] tracking-tight py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition duration-200 active:scale-95 cursor-pointer"
                              >
                                <span>Apply Change</span>
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-200 p-3 rounded-2xl flex items-center gap-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider animate-pulse">Agent reasoning...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggested Actions Section */}
            <div className="p-3 bg-white border-t border-neutral-100 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
              {suggestedActions.map((action, actionIdx) => (
                <button
                  key={actionIdx}
                  onClick={() => handleSendMessage(action.query)}
                  className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-150 border border-neutral-200 text-[10px] font-bold text-neutral-600 rounded-full shrink-0 transition whitespace-nowrap cursor-pointer"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-neutral-200 flex gap-2 shrink-0 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputValue);
                }}
                placeholder="Ask Copilot to split, reduce workload or rebalance..."
                className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-neutral-400 rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 outline-none transition"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition cursor-pointer"
                disabled={isLoading}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Overlay Confirmation Dialog for Applying proposals */}
      <AnimatePresence>
        {confirmProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900 leading-tight">Confirm Copilot Action?</h4>
                  <p className="text-xs text-neutral-500 font-semibold leading-normal">
                    You are applying: <strong className="text-indigo-600">"{confirmProposal.proposal.title}"</strong>.
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    This modification will immediately heal your active database milestones and rebalance your scheduling.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setConfirmProposal(null)}
                  className="px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-bold text-neutral-500 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedProposal}
                  className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-850 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Apply</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
