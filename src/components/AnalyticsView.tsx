import { useMemo } from 'react';
import { isAssignmentDueSoon, isAssignmentOverdue } from '../lib/dates';
import type { Assignment } from '../types/assignment';
import { DashboardCharts } from './DashboardCharts';

interface AnalyticsViewProps {
  assignments: Assignment[];
}

export function AnalyticsView({ assignments }: AnalyticsViewProps) {
  const summary = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === 'Completed').length;
    const overdue = assignments.filter((a) => isAssignmentOverdue(a.dueDate, a.status)).length;
    const dueSoon = assignments.filter((a) => isAssignmentDueSoon(a.dueDate, a.status)).length;
    const highPriorityOpen = assignments.filter(
      (a) => a.priority === 'High' && a.status !== 'Completed'
    ).length;

    const subjectRows = new Map<
      string,
      { subject: string; total: number; completed: number; overdue: number }
    >();
    for (const item of assignments) {
      const key = item.subject || 'General';
      const current = subjectRows.get(key) || {
        subject: key,
        total: 0,
        completed: 0,
        overdue: 0,
      };
      current.total += 1;
      if (item.status === 'Completed') current.completed += 1;
      if (isAssignmentOverdue(item.dueDate, item.status)) current.overdue += 1;
      subjectRows.set(key, current);
    }

    return {
      total,
      completed,
      overdue,
      dueSoon,
      highPriorityOpen,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      subjects: Array.from(subjectRows.values()).sort((a, b) => b.total - a.total),
    };
  }, [assignments]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Semester Completion Rate</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
            {summary.completionRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.completed} of {summary.total} assignments finished
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Due Within 3 Days</p>
          <p className="font-mono text-2xl font-semibold text-amber-700 mt-1 tabular-nums">
            {summary.dueSoon}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.overdue} currently overdue
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">High Priority Open</p>
          <p className="font-mono text-2xl font-semibold text-blue-700 mt-1 tabular-nums">
            {summary.highPriorityOpen}
          </p>
          <p className="text-xs text-slate-500 mt-1">Requires immediate focus</p>
        </div>
      </div>

      <DashboardCharts assignments={assignments} />

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Course-by-Course Progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed completion and overdue breakdown per subject
          </p>
        </div>

        {summary.subjects.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Add assignments across your subjects to view course analytics.
          </p>
        ) : (
          <div className="divide-y divide-slate-200">
            {summary.subjects.map((row) => {
              const pct = Math.round((row.completed / row.total) * 100);
              return (
                <div
                  key={row.subject}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-[180px]">
                    <p className="text-sm font-semibold text-slate-900">{row.subject}</p>
                    <p className="text-xs text-slate-500">
                      {row.completed} completed <span aria-hidden="true">·</span> {row.total} total
                      {row.overdue > 0 ? (
                        <>
                          {' '}
                          <span aria-hidden="true">·</span>{' '}
                          <span className="text-red-700 font-medium">{row.overdue} overdue</span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-medium text-slate-700 w-10 text-right tabular-nums">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
