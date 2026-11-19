import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  formatDeadlineLabel,
  formatDisplayDate,
  isAssignmentOverdue,
} from '../lib/dates';
import {
  ASSIGNMENT_STATUSES,
  type Assignment,
  type AssignmentStatus,
} from '../types/assignment';

export type StatusFilter = 'All' | AssignmentStatus | 'Overdue';
type SortOption = 'due-asc' | 'due-desc' | 'priority' | 'title';

interface AssignmentsViewProps {
  assignments: Assignment[];
  searchQuery: string;
  statusFilter: StatusFilter;
  subjectFilter: string;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onSubjectFilterChange: (subject: string) => void;
  onCreateNew: () => void;
  onEdit: (assignment: Assignment) => void;
  onStatusChange: (id: string, status: AssignmentStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSeedSamples?: () => Promise<void>;
  isLoading: boolean;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function StatusIndicator({ status, overdue }: { status: AssignmentStatus; overdue: boolean }) {
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Overdue</span>
      </span>
    );
  }
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Completed</span>
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>In Progress</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
      <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Pending</span>
    </span>
  );
}

export function AssignmentsView({
  assignments,
  searchQuery,
  statusFilter,
  subjectFilter,
  onStatusFilterChange,
  onSubjectFilterChange,
  onCreateNew,
  onEdit,
  onStatusChange,
  onDelete,
  onSeedSamples,
  isLoading,
}: AssignmentsViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>('due-asc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = assignments.filter((item) => {
      const overdue = isAssignmentOverdue(item.dueDate, item.status);
      if (statusFilter === 'Overdue' && !overdue) return false;
      if (
        statusFilter !== 'All' &&
        statusFilter !== 'Overdue' &&
        item.status !== statusFilter
      ) {
        return false;
      }

      if (subjectFilter !== 'All' && item.subject !== subjectFilter) {
        return false;
      }

      if (q) {
        const haystack = `${item.title} ${item.subject} ${item.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'due-asc') return a.dueDate.localeCompare(b.dueDate);
      if (sortBy === 'due-desc') return b.dueDate.localeCompare(a.dueDate);
      if (sortBy === 'priority') {
        const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        return diff !== 0 ? diff : a.dueDate.localeCompare(b.dueDate);
      }
      return a.title.localeCompare(b.title);
    });
  }, [assignments, searchQuery, statusFilter, subjectFilter, sortBy]);

  async function handleStatusSelect(id: string, nextStatus: AssignmentStatus) {
    setUpdatingId(id);
    try {
      await onStatusChange(id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteItem) return;
    setIsDeleting(true);
    try {
      await onDelete(confirmDeleteItem.id);
      setConfirmDeleteItem(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSeed() {
    if (!onSeedSamples) return;
    setIsSeeding(true);
    try {
      await onSeedSamples();
    } finally {
      setIsSeeding(false);
    }
  }

  const filterTabs: StatusFilter[] = ['All', 'Pending', 'In Progress', 'Completed', 'Overdue'];

  return (
    <div className="space-y-5">
      {/* Filter & Sort Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onStatusFilterChange(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="subject-filter" className="text-xs font-medium text-slate-500">
              Subject
            </label>
            <select
              id="subject-filter"
              value={subjectFilter}
              onChange={(e) => onSubjectFilterChange(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Subjects</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-assignments" className="text-xs font-medium text-slate-500">
              Sort
            </label>
            <select
              id="sort-assignments"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="due-asc">Due Date (Earliest)</option>
              <option value="due-desc">Due Date (Latest)</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-56 bg-slate-200 rounded" />
                <div className="h-3 w-40 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-28 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-display text-base font-semibold text-slate-900">
              {assignments.length === 0
                ? 'No assignments recorded yet'
                : 'No assignments match the active filters'}
            </h3>
            <p className="text-sm text-slate-500">
              {assignments.length === 0
                ? 'Add your first assignment to track deadlines, monitor status, and populate your dashboard charts.'
                : 'Try clearing your search query or switching back to All assignments.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {assignments.length === 0 ? (
              <>
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add First Assignment</span>
                </button>
                {onSeedSamples ? (
                  <button
                    type="button"
                    onClick={() => void handleSeed()}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-lg transition-colors"
                  >
                    {isSeeding ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-blue-700" aria-hidden="true" />
                    )}
                    <span>Load Sample Coursework</span>
                  </button>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange('All');
                  onSubjectFilterChange('All');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Structured Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Assignment</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Update Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredAssignments.map((item) => {
                  const overdue = isAssignmentOverdue(item.dueDate, item.status);
                  const isRowUpdating = updatingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      <td className="py-3.5 px-5 max-w-sm">
                        <div className="font-medium text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{item.priority} priority</span>
                          {item.description ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[260px]">{item.description}</span>
                            </>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {item.subject}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-slate-900 tabular-nums">
                          {formatDisplayDate(item.dueDate)}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            overdue
                              ? 'text-red-700 font-medium'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatDeadlineLabel(item.dueDate, item.status)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusIndicator status={item.status} overdue={overdue} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <select
                            aria-label={`Change status for ${item.title}`}
                            value={item.status}
                            disabled={isRowUpdating}
                            onChange={(e) =>
                              void handleStatusSelect(item.id, e.target.value as AssignmentStatus)
                            }
                            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
                          >
                            {ASSIGNMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {isRowUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" aria-hidden="true" />
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit ${item.title}`}
                            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteItem(item)}
                            aria-label={`Delete ${item.title}`}
                            className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden space-y-3">
            {filteredAssignments.map((item) => {
              const overdue = isAssignmentOverdue(item.dueDate, item.status);
              const isRowUpdating = updatingId === item.id;
              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-display text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.subject} <span aria-hidden="true">·</span> {item.priority} priority
                      </p>
                    </div>
                    <StatusIndicator status={item.status} overdue={overdue} />
                  </div>

                  {item.description ? (
                    <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  ) : null}

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-mono text-slate-700 tabular-nums">
                      {formatDisplayDate(item.dueDate)}
                    </span>
                    <span className={overdue ? 'text-red-700 font-medium' : 'text-slate-500'}>
                      {formatDeadlineLabel(item.dueDate, item.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      aria-label={`Change status for ${item.title}`}
                      value={item.status}
                      disabled={isRowUpdating}
                      onChange={(e) =>
                        void handleStatusSelect(item.id, e.target.value as AssignmentStatus)
                      }
                      className="flex-1 min-h-[40px] px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      {ASSIGNMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      aria-label={`Edit ${item.title}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-blue-700 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteItem(item)}
                      aria-label={`Delete ${item.title}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-red-700 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-lg">
            <h3 id="delete-dialog-title" className="font-display text-base font-semibold text-slate-900">
              Delete assignment?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This will permanently remove{' '}
              <span className="font-medium text-slate-900">{confirmDeleteItem.title}</span> from
              your coursework schedule.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
