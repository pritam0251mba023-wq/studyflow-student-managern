import { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
} from 'lucide-react';
import {
  formatDeadlineLabel,
  formatDisplayDate,
  getTodayIsoDate,
  isAssignmentDueSoon,
  isAssignmentOverdue,
} from '../lib/dates';
import type { Assignment, AssignmentStatus } from '../types/assignment';
import type { StatusFilter } from './AssignmentsView';
import { DashboardCharts } from './DashboardCharts';

interface DashboardOverviewProps {
  assignments: Assignment[];
  isLoading: boolean;
  onOpenFilter: (filter: StatusFilter) => void;
  onOpenCalendar: () => void;
  onCreateNew: () => void;
  onEdit: (assignment: Assignment) => void;
  onStatusChange: (id: string, status: AssignmentStatus) => Promise<void>;
}

export function DashboardOverview({
  assignments,
  isLoading,
  onOpenFilter,
  onOpenCalendar,
  onCreateNew,
  onEdit,
  onStatusChange,
}: DashboardOverviewProps) {
  const stats = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((a) => a.status === 'Pending').length;
    const inProgress = assignments.filter((a) => a.status === 'In Progress').length;
    const completed = assignments.filter((a) => a.status === 'Completed').length;
    const overdue = assignments.filter((a) => isAssignmentOverdue(a.dueDate, a.status)).length;
    const dueSoon = assignments.filter((a) => isAssignmentDueSoon(a.dueDate, a.status)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, inProgress, completed, overdue, dueSoon, completionRate };
  }, [assignments]);

  const upcomingDeadlines = useMemo(() => {
    const todayIso = getTodayIsoDate();
    return assignments
      .filter((a) => a.status !== 'Completed')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .filter((a) => a.dueDate >= todayIso || isAssignmentOverdue(a.dueDate, a.status))
      .slice(0, 5);
  }, [assignments]);

  const recentItems = useMemo(() => {
    return [...assignments]
      .sort((a, b) => {
        const aTime = a.updatedAt?.getTime() ?? 0;
        const bTime = b.updatedAt?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="bg-white border border-slate-200 rounded-xl p-5 h-28 animate-pulse space-y-3"
            >
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-7 w-14 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onOpenFilter('All')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Assignments</span>
            <ClipboardList className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="font-mono text-3xl font-semibold text-slate-900 mt-2 tabular-nums">
            {stats.total}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {stats.inProgress} currently in progress
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenFilter('Pending')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Pending Assignments</span>
            <Clock className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <div className="font-mono text-3xl font-semibold text-slate-900 mt-2 tabular-nums">
            {stats.pending}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Waiting to be started
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenFilter('Completed')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Completed Assignments</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="font-mono text-3xl font-semibold text-emerald-700 mt-2 tabular-nums">
            {stats.completed}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {stats.completionRate}% overall completion rate
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenFilter('Overdue')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Overdue Assignments</span>
            <AlertTriangle
              className={`w-4 h-4 ${stats.overdue > 0 ? 'text-red-600' : 'text-slate-400'}`}
              aria-hidden="true"
            />
          </div>
          <div
            className={`font-mono text-3xl font-semibold mt-2 tabular-nums ${
              stats.overdue > 0 ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {stats.overdue}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
            {stats.dueSoon} due within next 3 days
          </p>
        </button>
      </div>

      {/* Charts Row */}
      <DashboardCharts assignments={assignments} />

      {/* Upcoming Deadlines + Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-slate-900">
                Upcoming &amp; Priority Deadlines
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="py-8 text-center space-y-3 border border-dashed border-slate-200 rounded-lg">
              <p className="text-sm text-slate-500">No active deadlines on your radar.</p>
              <button
                type="button"
                onClick={onCreateNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Assignment</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.map((item) => {
                const overdue = isAssignmentOverdue(item.dueDate, item.status);
                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="text-sm font-medium text-slate-900 hover:text-blue-700 truncate block text-left"
                      >
                        {item.title}
                      </button>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.subject} <span aria-hidden="true">·</span> {item.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-mono text-xs tabular-nums ${
                          overdue ? 'text-red-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {formatDeadlineLabel(item.dueDate, item.status)}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {formatDisplayDate(item.dueDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Quick Status Updates
            </h2>
            <button
              type="button"
              onClick={() => onOpenFilter('All')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
              Your recently added coursework will appear here for quick status toggles.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-sm font-medium text-slate-900 hover:text-blue-700 truncate block text-left"
                    >
                      {item.title}
                    </button>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.subject} <span aria-hidden="true">·</span> {item.priority} priority
                    </p>
                  </div>

                  <select
                    aria-label={`Quick status update for ${item.title}`}
                    value={item.status}
                    onChange={(e) =>
                      void onStatusChange(item.id, e.target.value as AssignmentStatus)
                    }
                    className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
