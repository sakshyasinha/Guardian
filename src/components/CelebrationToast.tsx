import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { ToastState } from '../types';

interface CelebrationToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

export const CelebrationToast: React.FC<CelebrationToastProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 bg-neutral-950 text-white rounded-2xl shadow-2xl p-4 border border-neutral-800 w-80 font-sans"
        >
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500/15 text-emerald-400 p-2 rounded-xl border border-emerald-500/20 shrink-0">
              <CheckCircle className="w-5 h-5 fill-emerald-500/10" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-100 tracking-tight leading-none">
                  Milestone Completed
                </h4>
                <button 
                  onClick={onClose}
                  className="text-neutral-500 hover:text-neutral-300 text-xs font-mono select-none cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-[11px] text-neutral-400 leading-normal">
                Congratulations on completing this planned milestone!
              </p>

              {/* Progress highlights */}
              <div className="mt-3 pt-2.5 border-t border-neutral-800/80 grid grid-cols-2 gap-2">
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 flex items-center gap-1.5 justify-center">
                  <span className="text-xs font-extrabold text-indigo-400 font-mono">+{toast.xp} XP</span>
                </div>
                
                <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-800 flex items-center gap-1.5 justify-center">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 shrink-0 animate-pulse" />
                  <span className="text-xs font-bold text-amber-400 font-mono">{toast.streak} Day Streak</span>
                </div>
              </div>

              {/* Level indicator if upgraded or current */}
              <div className="mt-2.5 bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl flex items-center justify-between gap-1.5 text-[11px]">
                <div className="flex items-center gap-1 font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Progression Level</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-white text-[11px]">
                  {toast.levelFrom === toast.levelTo ? (
                    <span>Level {toast.levelTo}</span>
                  ) : (
                    <>
                      <span>Lvl {toast.levelFrom}</span>
                      <ArrowRight className="w-3 h-3 text-neutral-400" />
                      <span className="text-indigo-400">Lvl {toast.levelTo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
