/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlanner } from '../store/plannerContext';
import { Shield, ShieldAlert, ShieldCheck, X } from 'lucide-react';

export type GuardianState = 'idle' | 'welcome' | 'needs-recovery' | 'applied' | 'completed';

interface GuardianPresenceProps {
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const GuardianPresence: React.FC<GuardianPresenceProps> = ({ onToggleChat, isChatOpen }) => {
  const {
    activeRecovery,
    goals,
    activeTab,
    setActiveTab,
    triggerAudioChime
  } = usePlanner();

  const [currentState, setCurrentState] = useState<GuardianState>('idle');
  const [snoozedRecoveryId, setSnoozedRecoveryId] = useState<string | null>(null);
  const [showPulse, setShowPulse] = useState(false);
  const [pulseColor, setPulseColor] = useState<'indigo' | 'emerald' | 'amber'>('indigo');

  // Track completed goals to detect newly completed ones during session
  const completedGoalIds = React.useMemo(() => {
    return goals.filter(g => g.status === 'completed').map(g => g.id);
  }, [goals]);
  const prevCompletedGoalIds = useRef<string[]>(completedGoalIds);
  const prevRecoveryStatus = useRef<string | null>(activeRecovery ? activeRecovery.status : null);

  // 1. Initialize State & Check Welcome Status
  useEffect(() => {
    const isWelcomed = localStorage.getItem('guardian_welcomed') === 'true';
    if (!isWelcomed) {
      setCurrentState('welcome');
    } else if (activeRecovery && activeRecovery.status === 'PENDING_REVIEW' && activeRecovery.id !== snoozedRecoveryId) {
      setCurrentState('needs-recovery');
    } else {
      setCurrentState('idle');
    }
  }, [activeRecovery, snoozedRecoveryId]);

  // 2. Monitor Goal Completion Transitions
  useEffect(() => {
    const newlyCompleted = completedGoalIds.filter(id => !prevCompletedGoalIds.current.includes(id));
    const wasInitialized = prevCompletedGoalIds.current.length > 0;
    
    // Always update the ref immediately so subsequent renders see the latest state
    prevCompletedGoalIds.current = completedGoalIds;
    
    // Only trigger if we had a previous list and there's a newly completed goal
    if (newlyCompleted.length > 0 && wasInitialized) {
      // Transition to completed state
      setCurrentState('completed');
      setPulseColor('emerald');
      setShowPulse(true);
      triggerAudioChime('complete');

      // Reset pulse after animation runs
      const timer = setTimeout(() => {
        setShowPulse(false);
        setCurrentState('idle');
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [completedGoalIds, triggerAudioChime]);

  // 3. Monitor Recovery Applied Transitions
  useEffect(() => {
    if (activeRecovery) {
      const wasPending = prevRecoveryStatus.current === 'PENDING_REVIEW';
      const isAppliedNow = activeRecovery.status === 'APPLIED';
      
      // Always update the ref immediately so subsequent renders see the latest state
      prevRecoveryStatus.current = activeRecovery.status;

      if (wasPending && isAppliedNow) {
        // Transition to applied state
        setCurrentState('applied');
        setPulseColor('emerald');
        setShowPulse(true);
        triggerAudioChime('complete');

        // Reset pulse after animation runs
        const timer = setTimeout(() => {
          setShowPulse(false);
          setCurrentState('idle');
        }, 2500);

        return () => clearTimeout(timer);
      }
    } else {
      prevRecoveryStatus.current = null;
    }
  }, [activeRecovery, triggerAudioChime]);

  // Welcome Handlers
  const handleWelcomeComplete = () => {
    localStorage.setItem('guardian_welcomed', 'true');
    setCurrentState('idle');
    triggerAudioChime('complete');
  };

  // Recovery Alert Handlers
  const handleReviewRecovery = () => {
    setActiveTab('recovery');
    if (activeRecovery) {
      // Mark it reviewed or temporarily dismiss bubble so the user looks at the recovery view
      setSnoozedRecoveryId(activeRecovery.id);
    }
    setCurrentState('idle');
  };

  const handleSnoozeRecovery = () => {
    if (activeRecovery) {
      setSnoozedRecoveryId(activeRecovery.id);
    }
    setCurrentState('idle');
  };

  // Determine active glow and signature styling
  const getGlowColor = () => {
    if (showPulse && pulseColor === 'emerald') return 'emerald';
    if (currentState === 'completed' || currentState === 'applied') return 'emerald';
    if (currentState === 'needs-recovery') return 'amber';
    return 'indigo';
  };

  const glowColor = getGlowColor();

  const handleMainButtonClick = () => {
    // If we have an active intervention bubble, clicking the companion button acts as a primary touchpoint
    if (currentState === 'welcome') {
      handleWelcomeComplete();
    } else if (currentState === 'needs-recovery') {
      handleReviewRecovery();
    } else if (onToggleChat) {
      // Default behavior toggles the Copilot panel
      onToggleChat();
    }
  };

  // Generate bubble data
  const showBubble = currentState !== 'idle' && !isChatOpen;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className="absolute bottom-18 right-0 w-80 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 text-neutral-100 p-4.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] z-50 flex flex-col gap-3.5 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  glowColor === 'emerald'
                    ? 'bg-emerald-400'
                    : glowColor === 'amber'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-indigo-400'
                }`} />
                <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-neutral-400">
                  {currentState === 'welcome' && "Guardian"}
                  {currentState === 'needs-recovery' && "Recovery Suggestion"}
                  {currentState === 'applied' && "Timeline Rebalanced"}
                  {currentState === 'completed' && "Milestone Secured"}
                </span>
              </div>
              
              {/* Optional dismiss button for user-dismissable bubbles */}
              {(currentState === 'welcome' || currentState === 'needs-recovery') && (
                <button 
                  onClick={currentState === 'welcome' ? handleWelcomeComplete : handleSnoozeRecovery}
                  className="text-neutral-500 hover:text-neutral-200 transition cursor-pointer p-0.5 rounded-md hover:bg-neutral-800/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bubble Contents */}
            <div className="text-xs leading-relaxed text-neutral-300 font-medium">
              {currentState === 'welcome' && (
                <div className="space-y-2.5">
                  <p className="font-semibold text-neutral-100 text-sm">Hello.</p>
                  <p>I'm Guardian.</p>
                  <p>I don't remind you after you fall behind.</p>
                  <p className="text-indigo-300 font-semibold">I quietly protect your deadlines.</p>
                  <p>Let's focus on today's work.</p>
                </div>
              )}

              {currentState === 'needs-recovery' && (
                <div className="space-y-2">
                  <p>I noticed today's plan is becoming unrealistic.</p>
                  <p className="text-amber-300 font-semibold">I've already prepared a recovery plan that keeps your deadline achievable.</p>
                </div>
              )}

              {currentState === 'applied' && (
                <div className="flex items-center gap-2 py-1 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Timeline protected.</span>
                </div>
              )}

              {currentState === 'completed' && (
                <div className="flex items-center gap-2 py-1 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Milestone secured.</span>
                </div>
              )}
            </div>

            {/* Actions for Interactive States */}
            {currentState === 'welcome' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleWelcomeComplete}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold tracking-tight transition duration-150 active:scale-95 cursor-pointer text-center shadow-md"
                >
                  Got it
                </button>
              </div>
            )}

            {currentState === 'needs-recovery' && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleReviewRecovery}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold tracking-tight transition duration-150 active:scale-95 cursor-pointer text-center shadow-md"
                >
                  Review Recovery Plan
                </button>
                <button
                  onClick={handleSnoozeRecovery}
                  className="py-1.5 px-3 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded-xl text-[10px] font-bold border border-neutral-800 transition duration-150 active:scale-95 cursor-pointer text-center"
                >
                  Later
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Float Button and Pulse Area */}
      <div className="relative mt-2">
        {/* Soft Radial Pulsing Rings */}
        <AnimatePresence>
          {showPulse && (
            <>
              {/* Ring 1 */}
              <motion.div
                key="pulse-ring-1"
                initial={{ scale: 0.8, opacity: 0.9 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-emerald-500 pointer-events-none z-0"
              />
              {/* Ring 2 */}
              <motion.div
                key="pulse-ring-2"
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{ scale: 3.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.25 }}
                className="absolute inset-0 rounded-full border border-emerald-400 pointer-events-none z-0"
              />
            </>
          )}
        </AnimatePresence>

        {/* The Glassmorphism Guardian Button */}
        <motion.button
          onClick={handleMainButtonClick}
          className="relative w-14 h-14 rounded-full flex items-center justify-center border focus:outline-none transition-shadow duration-300 cursor-pointer z-10"
          style={{
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 
              glowColor === 'emerald' 
                ? 'rgba(16, 185, 129, 0.5)' 
                : glowColor === 'amber' 
                ? 'rgba(245, 158, 11, 0.5)' 
                : 'rgba(99, 102, 241, 0.35)',
            boxShadow: 
              glowColor === 'emerald' 
                ? '0 0 25px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
                : glowColor === 'amber' 
                ? '0 0 25px rgba(245, 158, 11, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)' 
                : '0 0 25px rgba(99, 102, 241, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}
          animate={
            currentState === 'idle' || currentState === 'needs-recovery' || currentState === 'welcome'
              ? {
                  scale: [1, 1.04, 1],
                  opacity: [0.85, 1, 0.85],
                }
              : { scale: 1, opacity: 1 }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
        >
          {/* Central Active Shield Icon */}
          {glowColor === 'emerald' ? (
            <ShieldCheck className="w-6 h-6 text-emerald-400 stroke-[1.75px]" />
          ) : glowColor === 'amber' ? (
            <ShieldAlert className="w-6 h-6 text-amber-400 stroke-[1.75px]" />
          ) : (
            <Shield className="w-6 h-6 text-indigo-400 stroke-[1.75px]" />
          )}

          {/* Core Indicator ping dot */}
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              glowColor === 'emerald' 
                ? 'bg-emerald-400' 
                : glowColor === 'amber' 
                ? 'bg-amber-400' 
                : 'bg-indigo-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              glowColor === 'emerald' 
                ? 'bg-emerald-500' 
                : glowColor === 'amber' 
                ? 'bg-amber-500' 
                : 'bg-indigo-500'
            }`}></span>
          </span>
        </motion.button>
      </div>
    </div>
  );
};
