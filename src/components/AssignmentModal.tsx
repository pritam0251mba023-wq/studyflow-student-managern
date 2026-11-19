import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { getTodayIsoDate } from '../lib/dates';
import {
  ASSIGNMENT_CONSTRAINTS,
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_STATUSES,
  validateAssignmentForm,
  type Assignment,
  type AssignmentFormValues,
  type AssignmentPriority,
  type AssignmentStatus,
  type AssignmentValidationErrors,
} from '../types/assignment';

interface AssignmentModalProps {
  isOpen: boolean;
  editingAssignment: Assignment | null;
  initialDueDate?: string;
  existingSubjects: string[];
  onClose: () => void;
  onSubmit: (values: AssignmentFormValues) => Promise<void>;
}

export function AssignmentModal({
  isOpen,
  editingAssignment,
  initialDueDate,
  existingSubjects,
  onClose,
  onSubmit,
}: AssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(getTodayIsoDate());
  const [status, setStatus] = useState<AssignmentStatus>('Pending');
  const [priority, setPriority] = useState<AssignmentPriority>('Medium');
  const [fieldErrors, setFieldErrors] = useState<AssignmentValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAssignment) {
      setTitle(editingAssignment.title);
      setSubject(editingAssignment.subject);
      setDescription(editingAssignment.description);
      setDueDate(editingAssignment.dueDate);
      setStatus(editingAssignment.status);
      setPriority(editingAssignment.priority);
    } else {
      setTitle('');
      setSubject('');
      setDescription('');
      setDueDate(initialDueDate || getTodayIsoDate());
      setStatus('Pending');
      setPriority('Medium');
    }
    setFieldErrors({});
    setSubmitError(null);
    setIsSaving(false);
  }, [isOpen, editingAssignment, initialDueDate]);

  if (!isOpen) return null;

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const values: AssignmentFormValues = {
      title,
      subject,
      description,
      dueDate,
      status,
      priority,
    };

    const validation = validateAssignmentForm(values);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSaving(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to save assignment. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="assignment-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={(e) => void handleFormSubmit(e)} className="p-6 space-y-4">
          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="assignment-title" className="text-sm font-medium text-slate-800">
                Title
              </label>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {title.trim().length}/{ASSIGNMENT_CONSTRAINTS.TITLE_MAX_LENGTH}
              </span>
            </div>
            <input
              id="assignment-title"
              type="text"
              value={title}
              maxLength={ASSIGNMENT_CONSTRAINTS.TITLE_MAX_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Operating Systems Lab 3"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            {fieldErrors.title ? (
              <p className="text-xs text-red-700">{fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="assignment-subject" className="text-sm font-medium text-slate-800">
                Subject / Course
              </label>
              <input
                id="assignment-subject"
                type="text"
                list="studyflow-subjects"
                value={subject}
                maxLength={ASSIGNMENT_CONSTRAINTS.SUBJECT_MAX_LENGTH}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., CS 320"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
              <datalist id="studyflow-subjects">
                {existingSubjects.map((subj) => (
                  <option key={subj} value={subj} />
                ))}
              </datalist>
              {fieldErrors.subject ? (
                <p className="text-xs text-red-700">{fieldErrors.subject}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="assignment-due-date" className="text-sm font-medium text-slate-800">
                Due Date
              </label>
              <input
                id="assignment-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
              {fieldErrors.dueDate ? (
                <p className="text-xs text-red-700">{fieldErrors.dueDate}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="assignment-status" className="text-sm font-medium text-slate-800">
                Status
              </label>
              <select
                id="assignment-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {ASSIGNMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="assignment-priority" className="text-sm font-medium text-slate-800">
                Priority
              </label>
              <select
                id="assignment-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {ASSIGNMENT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="assignment-desc" className="text-sm font-medium text-slate-800">
                Description
              </label>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {description.trim().length}/{ASSIGNMENT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="assignment-desc"
              rows={3}
              value={description}
              maxLength={ASSIGNMENT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Submission instructions, chapter readings, or rubric notes..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-y"
            />
            {fieldErrors.description ? (
              <p className="text-xs text-red-700">{fieldErrors.description}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
              <span>{editingAssignment ? 'Save Changes' : 'Create Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
