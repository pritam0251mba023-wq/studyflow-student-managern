import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { addDaysIso, getTodayIsoDate } from '../lib/dates';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ASSIGNMENT_CONSTRAINTS,
  type Assignment,
  type AssignmentFormValues,
  type AssignmentPriority,
  type AssignmentStatus,
} from '../types/assignment';

function sanitizeAssignmentPayload(values: AssignmentFormValues) {
  const title = values.title.trim().slice(0, ASSIGNMENT_CONSTRAINTS.TITLE_MAX_LENGTH);
  const subject = values.subject.trim().slice(0, ASSIGNMENT_CONSTRAINTS.SUBJECT_MAX_LENGTH);
  const description = values.description.trim().slice(0, ASSIGNMENT_CONSTRAINTS.DESCRIPTION_MAX_LENGTH);
  const dueDate = ASSIGNMENT_CONSTRAINTS.DUE_DATE_PATTERN.test(values.dueDate)
    ? values.dueDate
    : getTodayIsoDate();

  return {
    title,
    subject,
    description,
    dueDate,
    status: values.status,
    priority: values.priority,
  };
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export async function syncUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const displayName = (user.displayName || user.email?.split('@')[0] || 'Student')
    .trim()
    .slice(0, 120);
  const photoURL = (user.photoURL || '').slice(0, 500);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeToAssignments(
  uid: string,
  onData: (assignments: Assignment[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const collectionPath = 'assignments';
  const q = query(collection(db, collectionPath), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Assignment[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ownerId: String(data.ownerId || ''),
          title: String(data.title || ''),
          subject: String(data.subject || ''),
          description: String(data.description || ''),
          dueDate: String(data.dueDate || ''),
          status: (data.status as AssignmentStatus) || 'Pending',
          priority: (data.priority as AssignmentPriority) || 'Medium',
          createdAt: toDateOrNull(data.createdAt),
          updatedAt: toDateOrNull(data.updatedAt),
        };
      });

      items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createAssignment(uid: string, values: AssignmentFormValues): Promise<string> {
  const path = 'assignments';
  const sanitized = sanitizeAssignmentPayload(values);
  try {
    const docRef = await addDoc(collection(db, path), {
      ownerId: uid,
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAssignment(
  assignmentId: string,
  values: AssignmentFormValues
): Promise<void> {
  const path = `assignments/${assignmentId}`;
  const sanitized = sanitizeAssignmentPayload(values);
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus
): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedSampleAssignments(uid: string): Promise<void> {
  const today = getTodayIsoDate();
  const samples: AssignmentFormValues[] = [
    {
      title: 'Distributed Systems Consensus Lab',
      subject: 'CS 410 · Systems',
      description: 'Implement Raft leader election and log replication unit tests.',
      dueDate: addDaysIso(today, 2),
      status: 'In Progress',
      priority: 'High',
    },
    {
      title: 'Macroeconomics Policy Brief',
      subject: 'ECON 204',
      description: '1,500-word memo analyzing central bank rate transmission effects.',
      dueDate: addDaysIso(today, 5),
      status: 'Pending',
      priority: 'Medium',
    },
    {
      title: 'Linear Algebra Eigenvalue Problem Set',
      subject: 'MATH 221',
      description: 'Complete exercises 4.1 through 4.18 and attach MATLAB verification.',
      dueDate: addDaysIso(today, -2),
      status: 'Pending',
      priority: 'High',
    },
    {
      title: 'Organic Chemistry Spectroscopy Quiz Prep',
      subject: 'CHEM 212',
      description: 'Review IR and 1H-NMR peak splitting worksheets from weeks 6–8.',
      dueDate: addDaysIso(today, -1),
      status: 'Completed',
      priority: 'Low',
    },
  ];

  await Promise.all(samples.map((sample) => createAssignment(uid, sample)));
}
