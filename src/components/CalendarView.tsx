import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from 'lucide-react';
import {
  formatDeadlineLabel,
  formatDisplayDate,
  getMonthCalendarCells,
  getTodayIsoDate,
  isAssignmentOverdue,
} from '../lib/dates';
import type { Assignment, AssignmentStatus } from '../types/assignment';

interface CalendarViewProps {
  assignments: Assignment[];
  onCreateForDate: (isoDate: string) => void;
  onEdit: (assignment: Assignment) => void;
  onStatusChange: (id: string, status: AssignmentStatus) => Promise<void>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({
  assignments,
  onCreateForDate,
  onEdit,
  onStatusChange,
}: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedIso, setSelectedIso] = useState(getTodayIsoDate());

  const cells = useMemo(
    () => getMonthCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const item of assignments) {
      const list = map.get(item.dueDate) || [];
      list.push(item);
      map.set(item.dueDate, list);
    }
    return map;
  }, [assignments]);

  const selectedDayAssignments = useMemo(
    () => assignmentsByDate.get(selectedIso) || [],
    [assignmentsByDate, selectedIso]
  );

  const upcomingAssignments = useMemo(() => {
    const todayIso = getTodayIsoDate();
    return assignments
      .filter((a) => a.status !== 'Completed' && a.dueDate >= todayIso)
      .slice(0, 6);
  }, [assignments]);

  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedIso(getTodayIsoDate());
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Month Calendar Grid */}
      <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-xs font-medium text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {cells.map((cell) => {
            const dayItems = assignmentsByDate.get(cell.isoDate) || [];
            const isSelected = selectedIso === cell.isoDate;

            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => setSelectedIso(cell.isoDate)}
                className={`min-h-[78px] sm:min-h-[98px] p-1.5 sm:p-2 text-left flex flex-col gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'bg-blue-50/70 ring-1 ring-inset ring-blue-600'
                    : cell.inCurrentMonth
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-slate-50/50 text-slate-400 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono text-xs tabular-nums inline-flex items-center justify-center w-6 h-6 rounded-md ${
                      cell.isToday
                        ? 'bg-blue-700 text-white font-semibold'
                        : cell.inCurrentMonth
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {dayItems.length > 0 ? (
                    <span className="font-mono text-[10px] text-slate-500 tabular-nums sm:hidden">
                      {dayItems.length}
                    </span>
                  ) : null}
                </div>

                <div className="hidden sm:flex flex-col gap-1 w-full">
                  {dayItems.slice(0, 2).map((item) => {
                    const overdue = isAssignmentOverdue(item.dueDate, item.status);
                    return (
                      <div
                        key={item.id}
                        className={`text-[11px] px-1.5 py-0.5 rounded truncate font-medium ${
                          overdue
                            ? 'bg-red-50 text-red-800'
                            : item.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 line-through'
                              : item.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                  {dayItems.length > 2 ? (
                    <span className="text-[10px] font-mono text-slate-500 px-1 tabular-nums">
                      +{dayItems.length - 2} more
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day & Upcoming Deadlines Panel */}
      <aside className="xl:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                {formatDisplayDate(selectedIso)}
              </h3>
              <p className="font-mono text-xs text-slate-500 tabular-nums mt-0.5">
                {selectedDayAssignments.length}{' '}
                {selectedDayAssignments.length === 1 ? 'assignment' : 'assignments'} due
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateForDate(selectedIso)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Here</span>
            </button>
          </div>

          {selectedDayAssignments.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 border-t border-slate-100">
              No coursework due on this date.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {selectedDayAssignments.map((item) => {
                const overdue = isAssignmentOverdue(item.dueDate, item.status);
                return (
                  <div key={item.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="text-left font-medium text-sm text-slate-900 hover:text-blue-700 transition-colors"
                      >
                        {item.title}
                      </button>
                      {overdue ? (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                      ) : item.status === 'Completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{item.subject}</span>
                      <button
                        type="button"
                        onClick={() =>
                          void onStatusChange(
                            item.id,
                            item.status === 'Completed' ? 'Pending' : 'Completed'
                          )
                        }
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {item.status === 'Completed' ? 'Reopen' : 'Mark Completed'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Upcoming Deadlines
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Next active coursework due dates</p>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">All upcoming deadlines are cleared.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingAssignments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedIso(item.dueDate);
                    const [y, m] = item.dueDate.split('-').map(Number);
                    if (y && m) {
                      setViewYear(y);
                      setViewMonth(m - 1);
                    }
                  }}
                  className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 rounded-md px-1 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.subject} <span aria-hidden="true">·</span> {item.status}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-700 whitespace-nowrap shrink-0 tabular-nums">
                    {formatDeadlineLabel(item.dueDate, item.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
