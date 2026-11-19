import { useMemo, useState } from 'react';
import { addDaysIso, getTodayIsoDate } from '../lib/dates';
import type { Assignment } from '../types/assignment';

interface DashboardChartsProps {
  assignments: Assignment[];
}

export function DashboardCharts({ assignments }: DashboardChartsProps) {
  const [barMode, setBarMode] = useState<'subject' | 'upcoming'>('subject');

  const statusCounts = useMemo(() => {
    const completed = assignments.filter((a) => a.status === 'Completed').length;
    const inProgress = assignments.filter((a) => a.status === 'In Progress').length;
    const pending = assignments.filter((a) => a.status === 'Pending').length;
    const total = assignments.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, inProgress, pending, total, completionRate };
  }, [assignments]);

  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { subject: string; completed: number; active: number; total: number }>();
    for (const item of assignments) {
      const key = item.subject || 'General';
      const existing = map.get(key) || { subject: key, completed: 0, active: 0, total: 0 };
      if (item.status === 'Completed') {
        existing.completed += 1;
      } else {
        existing.active += 1;
      }
      existing.total += 1;
      map.set(key, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [assignments]);

  const nextSevenDays = useMemo(() => {
    const today = getTodayIsoDate();
    const days: { iso: string; label: string; count: number; isToday: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const iso = addDaysIso(today, i);
      const [y, m, d] = iso.split('-').map(Number);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      const label =
        i === 0
          ? 'Today'
          : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const count = assignments.filter(
        (a) => a.dueDate === iso && a.status !== 'Completed'
      ).length;
      days.push({ iso, label, count, isToday: i === 0 });
    }
    return days;
  }, [assignments]);

  // SVG Donut Geometry
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const total = statusCounts.total || 1;
  const completedLen = (statusCounts.completed / total) * circumference;
  const inProgressLen = (statusCounts.inProgress / total) * circumference;
  const pendingLen = (statusCounts.pending / total) * circumference;

  const maxSubjectTotal = Math.max(1, ...subjectBreakdown.map((s) => s.total));
  const maxDailyCount = Math.max(1, ...nextSevenDays.map((d) => d.count));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Status Distribution Donut Chart */}
      <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Completion Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution across assignment statuses
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {statusCounts.total} total
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 my-auto py-2">
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90" aria-label="Assignment status distribution chart">
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="16"
              />
              {statusCounts.total > 0 ? (
                <>
                  {statusCounts.completed > 0 && (
                    <circle
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="none"
                      stroke="#15803D"
                      strokeWidth="16"
                      strokeDasharray={`${completedLen} ${circumference}`}
                      strokeDashoffset={0}
                    />
                  )}
                  {statusCounts.inProgress > 0 && (
                    <circle
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="none"
                      stroke="#1D4ED8"
                      strokeWidth="16"
                      strokeDasharray={`${inProgressLen} ${circumference}`}
                      strokeDashoffset={-completedLen}
                    />
                  )}
                  {statusCounts.pending > 0 && (
                    <circle
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="16"
                      strokeDasharray={`${pendingLen} ${circumference}`}
                      strokeDashoffset={-(completedLen + inProgressLen)}
                    />
                  )}
                </>
              ) : null}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {statusCounts.completionRate}%
              </span>
              <span className="text-[11px] text-slate-500">Completed</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-700 shrink-0" aria-hidden="true" />
                Completed
              </span>
              <span className="font-mono text-slate-900 font-medium tabular-nums">
                {statusCounts.completed}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-700 shrink-0" aria-hidden="true" />
                In Progress
              </span>
              <span className="font-mono text-slate-900 font-medium tabular-nums">
                {statusCounts.inProgress}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 shrink-0" aria-hidden="true" />
                Pending
              </span>
              <span className="font-mono text-slate-900 font-medium tabular-nums">
                {statusCounts.pending}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Workload & Deadlines Bar Chart */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              {barMode === 'subject' ? 'Workload by Subject' : '7-Day Deadline Forecast'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {barMode === 'subject'
                ? 'Active vs completed coursework per course'
                : 'Open assignments due over the next 7 days'}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setBarMode('subject')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                barMode === 'subject'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Subject
            </button>
            <button
              type="button"
              onClick={() => setBarMode('upcoming')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                barMode === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 7 Days
            </button>
          </div>
        </div>

        {barMode === 'subject' ? (
          subjectBreakdown.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
              Add assignments to visualize subject workload.
            </div>
          ) : (
            <div className="space-y-3.5 my-auto">
              {subjectBreakdown.map((row) => {
                const completedPct = (row.completed / maxSubjectTotal) * 100;
                const activePct = (row.active / maxSubjectTotal) * 100;
                return (
                  <div key={row.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate max-w-[220px]">
                        {row.subject}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {row.completed}/{row.total} done
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      {row.completed > 0 && (
                        <div
                          className="h-full bg-emerald-600 transition-all"
                          style={{ width: `${completedPct}%` }}
                          title={`${row.completed} completed`}
                        />
                      )}
                      {row.active > 0 && (
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${activePct}%` }}
                          title={`${row.active} active`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-600" aria-hidden="true" />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-blue-600" aria-hidden="true" />
                  Active (Pending / In Progress)
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="pt-2 my-auto">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40">
              {nextSevenDays.map((day) => {
                const heightPct = day.count === 0 ? 6 : Math.max(18, (day.count / maxDailyCount) * 100);
                return (
                  <div key={day.iso} className="flex flex-col items-center justify-end h-full gap-2">
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      {day.count}
                    </span>
                    <div className="w-full max-w-[36px] flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          day.count === 0
                            ? 'bg-slate-200'
                            : day.isToday
                              ? 'bg-blue-700'
                              : 'bg-blue-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                        title={`${day.label} (${day.iso}): ${day.count} open`}
                      />
                    </div>
                    <span
                      className={`text-[11px] whitespace-nowrap ${
                        day.isToday ? 'font-semibold text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
