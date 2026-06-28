import React from 'react';
import { Flame, Shield, Target, Award, Info, Calendar } from 'lucide-react';
import { GamificationState, CompletionHistory, Goal, BlockerRecord } from '../types';

interface TaskConsistencyCardProps {
  gamification: GamificationState;
  completionHistory: CompletionHistory;
  onClick: () => void;
}

export const TaskConsistencyCard: React.FC<TaskConsistencyCardProps> = ({
  gamification,
  completionHistory,
  onClick
}) => {
  // Generate a grid of the last 16 weeks.
  // A week has 7 days (Sunday to Saturday).
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
  const totalWeeks = 16;

  // Start date is Sunday of 15 weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - ((totalWeeks - 1) * 7 + currentDayOfWeek));

  // Generate 16 weeks x 7 days grid
  const weeks = [];
  let productiveDaysCount = 0;

  for (let w = 0; w < totalWeeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const currentCellDate = new Date(startDate);
      currentCellDate.setDate(startDate.getDate() + (w * 7 + d));

      const yearStr = currentCellDate.getFullYear();
      const monthStr = (currentCellDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = currentCellDate.getDate().toString().padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      const dayData = completionHistory[dateStr];
      let level: 0 | 1 | 2 | 3 = 0;
      let activityDesc = "No activity logged";

      const isFuture = currentCellDate > today;

      if (!isFuture && dayData) {
        const m = dayData.milestonesCompleted || 0;
        const s = dayData.subtasksCompleted || 0;

        if (m > 0 || s > 0) {
          productiveDaysCount++;
        }

        if (m >= 2) {
          level = 3;
          activityDesc = `${m} milestones, ${s} subtasks completed`;
        } else if (m === 1) {
          level = 2;
          activityDesc = `1 milestone, ${s} subtasks completed`;
        } else if (s > 0) {
          level = 1;
          activityDesc = `${s} subtasks completed`;
        }
      } else if (isFuture) {
        level = 0;
        activityDesc = "Future day";
      }

      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = currentCellDate.toLocaleDateString('en-US', options);
      const tooltipText = isFuture ? `${formattedDate} (Future)` : `${formattedDate}: ${activityDesc}`;

      weekDays.push({
        date: currentCellDate,
        dateStr,
        level,
        tooltipText,
        isFuture
      });
    }
    weeks.push(weekDays);
  }

  // Calculate unique month labels and their column positions
  const monthLabels: { text: string; colIndex: number }[] = [];
  let lastMonthName = "";

  weeks.forEach((week, index) => {
    const sundayDate = week[0].date;
    const monthName = sundayDate.toLocaleDateString('en-US', { month: 'short' });
    if (monthName !== lastMonthName) {
      monthLabels.push({ text: monthName, colIndex: index });
      lastMonthName = monthName;
    }
  });

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 cursor-pointer select-none space-y-4 font-sans relative"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
          <h4 className="text-sm font-bold text-neutral-800 tracking-tight">Task Consistency</h4>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-full">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
          <span className="text-xs font-bold text-amber-600 font-mono">
            {gamification.streak} Day Streak
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Heatmap Grid Wrapper for horizontal scrolling on mobile */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="min-w-[240px] flex gap-2">
            
            {/* Days labels on the left */}
            <div className="flex flex-col justify-between text-[9px] font-semibold text-neutral-400 pr-1 select-none pt-[16px] pb-[4px] h-[92px] shrink-0 text-right w-6">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>
            
            {/* The Heatmap Grid */}
            <div className="flex-1 space-y-1">
              {/* Month Labels row */}
              <div className="relative h-4 text-[9px] text-neutral-400 font-mono font-bold select-none">
                {monthLabels.map((lbl, idx) => {
                  const leftPercent = (lbl.colIndex / totalWeeks) * 100;
                  return (
                    <span 
                      key={idx} 
                      className="absolute transform -translate-x-1/2" 
                      style={{ left: `${leftPercent}%` }}
                    >
                      {lbl.text}
                    </span>
                  );
                })}
              </div>
              
              {/* Columns of Weeks */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      let colorClass = 'bg-neutral-100 hover:bg-neutral-200 border border-transparent';
                      if (day.isFuture) {
                        colorClass = 'bg-neutral-50/50 cursor-not-allowed opacity-30 border border-transparent';
                      } else if (day.level === 1) {
                        colorClass = 'bg-emerald-100 hover:bg-emerald-200 border border-emerald-200/20';
                      } else if (day.level === 2) {
                        colorClass = 'bg-emerald-400 hover:bg-emerald-500 border border-emerald-500/20';
                      } else if (day.level === 3) {
                        colorClass = 'bg-emerald-700 hover:bg-emerald-800 border border-emerald-800/30';
                      }
                      
                      return (
                        <div
                          key={dIdx}
                          className={`w-2.5 h-2.5 rounded-[1.5px] transition-colors relative group cursor-pointer ${colorClass}`}
                        >
                          {/* Tooltip Popup */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-neutral-900 text-white text-[10px] font-medium py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                            {day.tooltipText}
                            {/* Tiny pointer arrow */}
                            <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 absolute top-full left-1/2 transform -translate-x-1/2 -mt-[3px]"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Legend & Secondary Info */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-100 pt-3">
          <span className="font-semibold text-neutral-500">
            {productiveDaysCount} active days
          </span>
          <div className="flex items-center gap-1.5 select-none font-medium">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <span className="w-2 h-2 rounded-[1px] bg-neutral-100 border border-transparent" title="No activity" />
              <span className="w-2 h-2 rounded-[1px] bg-emerald-100 border border-emerald-200/25" title="Some activity" />
              <span className="w-2 h-2 rounded-[1px] bg-emerald-400 border border-emerald-500/25" title="Productive day" />
              <span className="w-2 h-2 rounded-[1px] bg-emerald-700 border border-emerald-800/25" title="Highly productive day" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GuardianImpactCardProps {
  goals: Goal[];
  blockers: BlockerRecord[];
}

export const GuardianImpactCard: React.FC<GuardianImpactCardProps> = ({
  goals,
  blockers
}) => {
  // Goals Completed count
  const goalsCompleted = goals.filter(g => g.status === 'completed').length;

  // Deadlines Saved: Completed goals that had at least one logged blocker
  const deadlinesSaved = goals.filter(g => 
    g.status === 'completed' && blockers.some(b => b.goalId === g.id)
  ).length;

  // Total At-Risk Goals: goals currently at-risk + recovered goals
  const currentlyAtRisk = goals.filter(g => g.status === 'at-risk').length;
  const totalAtRisk = currentlyAtRisk + deadlinesSaved;

  // Recovery Success Rate
  const recoverySuccessRate = totalAtRisk > 0 
    ? Math.round((deadlinesSaved / totalAtRisk) * 100) 
    : null;

  const hasHistory = goalsCompleted > 0 || totalAtRisk > 0;

  return (
    <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
          <h4 className="text-sm font-bold text-neutral-800 tracking-tight">Guardian Impact</h4>
        </div>
        {recoverySuccessRate !== null && (
          <span className="px-2 py-0.5 bg-indigo-50 text-[10px] font-mono font-bold text-indigo-600 rounded-full">
            {recoverySuccessRate}% Recovery Rate
          </span>
        )}
      </div>

      {!hasHistory ? (
        <div className="py-8 px-4 text-center space-y-2 border border-dashed border-neutral-100 rounded-xl bg-neutral-50/50">
          <p className="text-xs text-neutral-500 font-medium leading-relaxed max-w-[210px] mx-auto">
            Not enough recovery history yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Saved Deadlines */}
          <div className="flex items-center justify-between p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-neutral-700">Deadlines Rescued</span>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-700">{deadlinesSaved}</span>
          </div>

          {/* Success Rate */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-neutral-700">Recovery Rate</span>
            </div>
            <span className="text-sm font-bold font-mono text-indigo-700">
              {recoverySuccessRate !== null ? `${recoverySuccessRate}%` : '—'}
            </span>
          </div>

          {/* Goals Completed */}
          <div className="flex items-center justify-between p-3 bg-neutral-50/60 border border-neutral-200/50 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-neutral-600" />
              <span className="text-xs font-semibold text-neutral-700">Goals Completed</span>
            </div>
            <span className="text-sm font-bold font-mono text-neutral-700">{goalsCompleted}</span>
          </div>

          <div className="flex items-start gap-1.5 text-[9px] text-neutral-400 pt-1 leading-normal">
            <Info className="w-3 h-3 text-neutral-300 shrink-0 mt-0.5" />
            <p>
              Recovery rate is calculated by comparing rescued goals against total goals that encountered high pacing load levels.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
