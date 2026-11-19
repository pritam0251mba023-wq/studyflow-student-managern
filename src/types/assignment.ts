export type AssignmentStatus = 'Pending' | 'In Progress' | 'Completed';
export type AssignmentPriority = 'Low' | 'Medium' | 'High';

export const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['Pending', 'In Progress', 'Completed'];
export const ASSIGNMENT_PRIORITIES: AssignmentPriority[] = ['Low', 'Medium', 'High'];

// Synchronized verbatim with firebase-blueprint.json & firestore.rules
export const ASSIGNMENT_CONSTRAINTS = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 140,
  SUBJECT_MIN_LENGTH: 1,
  SUBJECT_MAX_LENGTH: 80,
  DESCRIPTION_MAX_LENGTH: 2000,
  DUE_DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
} as const;

export interface Assignment {
  id: string;
  ownerId: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: AssignmentStatus;
  priority: AssignmentPriority;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AssignmentFormValues {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
}

export interface AssignmentValidationErrors {
  title?: string;
  subject?: string;
  description?: string;
  dueDate?: string;
}

export function validateAssignmentForm(values: AssignmentFormValues): AssignmentValidationErrors {
  const errors: AssignmentValidationErrors = {};
  const trimmedTitle = values.title.trim();
  const trimmedSubject = values.subject.trim();
  const trimmedDesc = values.description.trim();

  if (trimmedTitle.length < ASSIGNMENT_CONSTRAINTS.TITLE_MIN_LENGTH) {
    errors.title = 'Please enter an assignment title.';
  } else if (trimmedTitle.length > ASSIGNMENT_CONSTRAINTS.TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${ASSIGNMENT_CONSTRAINTS.TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (trimmedSubject.length < ASSIGNMENT_CONSTRAINTS.SUBJECT_MIN_LENGTH) {
    errors.subject = 'Please enter a subject or course code.';
  } else if (trimmedSubject.length > ASSIGNMENT_CONSTRAINTS.SUBJECT_MAX_LENGTH) {
    errors.subject = `Subject must be ${ASSIGNMENT_CONSTRAINTS.SUBJECT_MAX_LENGTH} characters or fewer.`;
  }

  if (trimmedDesc.length > ASSIGNMENT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${ASSIGNMENT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  if (!ASSIGNMENT_CONSTRAINTS.DUE_DATE_PATTERN.test(values.dueDate)) {
    errors.dueDate = 'Please select a valid due date.';
  }

  return errors;
}

export type WorkspaceView = 'dashboard' | 'assignments' | 'calendar' | 'analytics';
