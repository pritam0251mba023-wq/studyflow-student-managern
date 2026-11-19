import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { AssignmentModal } from './components/AssignmentModal';
import { AssignmentsView, type StatusFilter } from './components/AssignmentsView';
import { CalendarView } from './components/CalendarView';
import { DashboardOverview } from './components/DashboardOverview';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { isAssignmentOverdue } from './lib/dates';
import { auth, googleProvider, isFirebaseConfigured } from './lib/firebase';
import {
  createAssignment,
  deleteAssignment,
  seedSampleAssignments,
  subscribeToAssignments,
  syncUserProfile,
  updateAssignment,
  updateAssignmentStatus,
} from './services/assignments';
import type {
  Assignment,
  AssignmentFormValues,
  AssignmentStatus,
  WorkspaceView,
} from './types/assignment';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'error';
}

function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was closed before completion. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error while connecting to Google Auth. Check your connection and retry.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Authentication settings.';
  }
  return err instanceof Error ? err.message : 'Unable to sign in with Google.';
}

function StudyflowWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(text: string, tone: 'success' | 'error' = 'success') {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3500);
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      setIsLoadingData(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setAssignments([]);
        setIsLoadingData(false);
      } else {
        void syncUserProfile(firebaseUser).catch((err) => {
          console.error('Failed to sync user profile:', err);
        });
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    setIsLoadingData(true);
    setDataError(null);

    const unsub = subscribeToAssignments(
      user.uid,
      (items) => {
        setAssignments(items);
        setIsLoadingData(false);
        setDataError(null);
      },
      (err) => {
        setIsLoadingData(false);
        let friendly = err.message;
        try {
          const parsed = JSON.parse(err.message) as { error?: string };
          if (parsed?.error) friendly = parsed.error;
        } catch {
          // Keep message
        }
        setDataError(friendly);
      }
    );

    return () => unsub();
  }, [authReady, user]);

  async function handleGoogleSignIn() {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      setActiveView('dashboard');
      setSearchQuery('');
      setStatusFilter('All');
      setSubjectFilter('All');
      setMobileMenuOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to sign out.', 'error');
    }
  }

  const subjects = useMemo(() => {
    return Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [assignments]);

  const overdueCount = useMemo(
    () => assignments.filter((a) => isAssignmentOverdue(a.dueDate, a.status)).length,
    [assignments]
  );

  function openNewAssignmentModal(preselectedDate?: string) {
    setEditingAssignment(null);
    setModalInitialDate(preselectedDate);
    setModalOpen(true);
  }

  function openEditModal(assignment: Assignment) {
    setEditingAssignment(assignment);
    setModalInitialDate(undefined);
    setModalOpen(true);
  }

  async function handleModalSubmit(values: AssignmentFormValues) {
    if (!user) return;
    if (editingAssignment) {
      await updateAssignment(editingAssignment.id, values);
      showToast('Assignment updated.');
    } else {
      await createAssignment(user.uid, values);
      showToast('Assignment added.');
    }
  }

  async function handleStatusChange(id: string, nextStatus: AssignmentStatus) {
    try {
      await updateAssignmentStatus(id, nextStatus);
      showToast(`Marked as ${nextStatus}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAssignment(id);
      showToast('Assignment deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete assignment.', 'error');
    }
  }

  async function handleSeedSamples() {
    if (!user) return;
    try {
      await seedSampleAssignments(user.uid);
      showToast('Sample coursework added.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to add sample items.', 'error');
    }
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading STUDYFLOW workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LandingPage
        onSignIn={handleGoogleSignIn}
        authError={authError}
        isSigningIn={isSigningIn}
        isFirebaseConfigured={isFirebaseConfigured}
      />
    );
  }

  const navItems: { id: WorkspaceView; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList, count: assignments.length },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const viewTitles: Record<WorkspaceView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of assignment volume, progress, and upcoming deadlines',
    },
    assignments: {
      title: 'Assignments',
      subtitle: 'Create, filter, update status, and organize coursework deliverables',
    },
    calendar: {
      title: 'Deadline Calendar',
      subtitle: 'Monthly schedule of submission dates and active reminders',
    },
    analytics: {
      title: 'Study Analytics',
      subtitle: 'Subject workload balance, completion rates, and overdue risk',
    },
  };

  const userInitials = (user.displayName || user.email || 'S').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            STUDYFLOW
          </span>
        </div>

        <nav aria-label="Workspace Navigation" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {typeof item.count === 'number' ? (
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {subjects.length > 0 ? (
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="px-3 flex items-center justify-between text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Subjects</span>
                </span>
                {subjectFilter !== 'All' ? (
                  <button
                    type="button"
                    onClick={() => setSubjectFilter('All')}
                    className="text-blue-700 hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="space-y-0.5">
                {subjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(subj);
                      setActiveView('assignments');
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md truncate transition-colors ${
                      activeView === 'assignments' && subjectFilter === subj
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </nav>

        {/* Account Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Student avatar'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-display font-semibold text-sm flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.displayName || 'Student'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                STUDYFLOW
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-3 text-sm font-medium rounded-lg ${
                      isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.count === 'number' ? (
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 space-y-3">
              <div className="text-xs text-slate-600 truncate">{user.email}</div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="hidden sm:inline text-slate-400">Workspace</span>
                <span className="hidden sm:inline text-slate-300">/</span>
                <span className="font-display font-semibold text-slate-900 truncate">
                  {viewTitles[activeView].title}
                </span>
                {overdueCount > 0 ? (
                  <span className="hidden md:inline text-xs text-red-700 font-medium whitespace-nowrap">
                    · {overdueCount} overdue
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative hidden sm:block">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value && activeView === 'dashboard') {
                      setActiveView('assignments');
                    }
                  }}
                  placeholder="Search assignments..."
                  aria-label="Search assignments"
                  className="w-52 lg:w-64 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => openNewAssignmentModal()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>New Assignment</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Mobile Search Input */}
          <div className="sm:hidden relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && activeView === 'dashboard') {
                  setActiveView('assignments');
                }
              }}
              placeholder="Search assignments..."
              aria-label="Search assignments"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {viewTitles[activeView].title}
            </h1>
            <p className="text-sm text-slate-500">{viewTitles[activeView].subtitle}</p>
          </div>

          {dataError ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Unable to sync assignments from Firestore</p>
                <p className="text-xs mt-0.5">{dataError}</p>
              </div>
            </div>
          ) : null}

          {activeView === 'dashboard' ? (
            <DashboardOverview
              assignments={assignments}
              isLoading={isLoadingData}
              onOpenFilter={(filter) => {
                setStatusFilter(filter);
                setActiveView('assignments');
              }}
              onOpenCalendar={() => setActiveView('calendar')}
              onCreateNew={() => openNewAssignmentModal()}
              onEdit={openEditModal}
              onStatusChange={handleStatusChange}
            />
          ) : activeView === 'assignments' ? (
            <AssignmentsView
              assignments={assignments}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              subjectFilter={subjectFilter}
              onStatusFilterChange={setStatusFilter}
              onSubjectFilterChange={setSubjectFilter}
              onCreateNew={() => openNewAssignmentModal()}
              onEdit={openEditModal}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onSeedSamples={handleSeedSamples}
              isLoading={isLoadingData}
            />
          ) : activeView === 'calendar' ? (
            <CalendarView
              assignments={assignments}
              onCreateForDate={(iso) => openNewAssignmentModal(iso)}
              onEdit={openEditModal}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <AnalyticsView assignments={assignments} />
          )}
        </main>
      </div>

      {/* Add / Edit Modal */}
      <AssignmentModal
        isOpen={modalOpen}
        editingAssignment={editingAssignment}
        initialDueDate={modalInitialDate}
        existingSubjects={subjects}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Non-blocking Toast */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-md ${
            toast.tone === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StudyflowWorkspace />
    </ErrorBoundary>
  );
}
