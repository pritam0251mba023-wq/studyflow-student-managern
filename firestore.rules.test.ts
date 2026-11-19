/**
 * STUDYFLOW Security Rules Verification Matrix (Phase 0 TDD)
 * Run with Firebase Emulator Suite (`@firebase/rules-unit-testing`) when testing locally.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated create on assignments',
    operation: 'create',
    path: 'assignments/a1',
    auth: null,
    payload: { ownerId: 'anon', title: 'Test' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified email user creates assignment',
    operation: 'create',
    path: 'assignments/a2',
    auth: { uid: 'userA', email_verified: false },
    payload: {
      ownerId: 'userA',
      title: 'Unverified Essay',
      subject: 'English',
      description: '',
      dueDate: '2026-12-01',
      status: 'Pending',
      priority: 'Medium',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-tenant ownerId spoof on create',
    operation: 'create',
    path: 'assignments/a3',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      ownerId: 'userB',
      title: 'Spoofed Assignment',
      subject: 'CS101',
      description: '',
      dueDate: '2026-12-01',
      status: 'Pending',
      priority: 'High',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unscoped list query on assignments without ownerId filter',
    operation: 'list',
    path: 'assignments',
    auth: { uid: 'userA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow field injection (isAdmin)',
    operation: 'create',
    path: 'assignments/a5',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      ownerId: 'userA',
      title: 'Valid Title',
      subject: 'Math',
      description: '',
      dueDate: '2026-12-01',
      status: 'Pending',
      priority: 'Low',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Owner reassignment attempt on update',
    operation: 'update',
    path: 'assignments/existingA',
    auth: { uid: 'userA', email_verified: true },
    payload: { ownerId: 'userB' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable createdAt mutation attempt on update',
    operation: 'update',
    path: 'assignments/existingA',
    auth: { uid: 'userA', email_verified: true },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Invalid status enum value',
    operation: 'create',
    path: 'assignments/a8',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      ownerId: 'userA',
      title: 'Lab Report',
      subject: 'Physics',
      description: '',
      dueDate: '2026-12-01',
      status: 'Archived',
      priority: 'Medium',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Malformed dueDate string',
    operation: 'create',
    path: 'assignments/a9',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      ownerId: 'userA',
      title: 'Lab Report',
      subject: 'Physics',
      description: '',
      dueDate: 'next-friday',
      status: 'Pending',
      priority: 'Medium',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Oversized title payload (>140 chars)',
    operation: 'create',
    path: 'assignments/a10',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      ownerId: 'userA',
      title: 'X'.repeat(141),
      subject: 'History',
      description: '',
      dueDate: '2026-12-01',
      status: 'Pending',
      priority: 'Low',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Users collection enumeration via list',
    operation: 'list',
    path: 'users',
    auth: { uid: 'userA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Cross-user profile get',
    operation: 'get',
    path: 'users/userB',
    auth: { uid: 'userA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];
