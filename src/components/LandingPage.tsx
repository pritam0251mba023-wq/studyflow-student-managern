import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  authError: string | null;
  isSigningIn: boolean;
  isFirebaseConfigured: boolean;
}

export function LandingPage({
  onSignIn,
  authError,
  isSigningIn,
  isFirebaseConfigured,
}: LandingPageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [libraryImgFailed, setLibraryImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zones — Wordmark | 4 Nav Links | 1 Primary Action */}
      <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            STUDYFLOW
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#overview"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#capabilities"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <a
              href="#security"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Cloud Sync
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => void onSignIn()}
              disabled={isSigningIn || !isFirebaseConfigured}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {isSigningIn ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : null}
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section id="overview" className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-sm font-medium text-blue-700">
                Student Productivity Manager
              </p>

              <h1
                className="font-display font-bold tracking-tight text-slate-900 leading-[1.1] max-w-xl"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Keep every assignment, deadline, and course on schedule.
              </h1>

              <p className="text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl">
                STUDYFLOW replaces scattered syllabi and sticky notes with a structured student
                workspace. Track coursework from Pending to Completed, catch overdue work early,
                and review upcoming deadlines on an interactive calendar.
              </p>

              {authError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 max-w-xl"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              ) : null}

              {!isFirebaseConfigured ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 max-w-xl"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
                  <span>
                    Firebase environment variables are not configured. Set{' '}
                    <code className="font-mono text-xs">VITE_FIREBASE_*</code> in your environment
                    to enable Google sign-in.
                  </span>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => void onSignIn()}
                  disabled={isSigningIn || !isFirebaseConfigured}
                  className="inline-flex items-center gap-3 px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                      />
                    </svg>
                  )}
                  <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <a
                  href="#workflow"
                  className="px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-2">
                <span>Private per-student database</span>
                <span aria-hidden="true">·</span>
                <span>Real-time Cloud Firestore sync</span>
                <span aria-hidden="true">·</span>
                <span>Zero setup required</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] lg:min-h-[440px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_studyflow_desk_1795087168559.jpg"
                    alt="Minimalist sunlit student study desk with planner notebook and laptop"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-blue-50">
                    <ClipboardList className="w-10 h-10 text-blue-700 mb-3" aria-hidden="true" />
                    <p className="font-display font-semibold text-slate-900">STUDYFLOW Workspace</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Structured assignments, analytics, and calendar deadlines.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Capability Strip below hero split */}
          <div
            id="capabilities"
            className="mt-12 pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-blue-700">
                <ClipboardList className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Assignment Ledger
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Store titles, subjects, descriptions, priorities, and due dates in one clean view.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-blue-700">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Three-Stage Status
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Move coursework smoothly across Pending, In Progress, and Completed in one click.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-blue-700">
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Deadline Calendar
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Inspect monthly due dates, spot heavy weeks early, and add tasks straight to a day.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-blue-700">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Isolated Cloud Sync
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Authenticated with Google and isolated per account via Cloud Firestore security rules.
              </p>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="border-t border-slate-200 bg-white">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-5">
                <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  {!libraryImgFailed ? (
                    <img
                      src="/src/assets/images/studyflow_library_focus_1795087168559.jpg"
                      alt="Sunlit university library reading lounge and study desks"
                      referrerPolicy="no-referrer"
                      onError={() => setLibraryImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 bg-slate-100 text-slate-500 text-sm">
                      Academic Study Hall
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
                <div className="space-y-3 max-w-2xl">
                  <p className="text-sm font-medium text-blue-700">Academic Workflow</p>
                  <h2
                    className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900"
                    style={{ textWrap: 'balance' }}
                  >
                    Built for how students actually manage a semester.
                  </h2>
                </div>

                <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                  <div className="py-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                    <span className="font-mono text-sm font-medium text-blue-700 shrink-0 tabular-nums">
                      01.
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        Capture every syllabus deliverable once
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Log problem sets, lab reports, essays, and exam prep with subject tags,
                        detailed notes, priority level, and exact due dates.
                      </p>
                    </div>
                  </div>

                  <div className="py-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                    <span className="font-mono text-sm font-medium text-blue-700 shrink-0 tabular-nums">
                      02.
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        Spot overdue risks and weekly crunch points
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Your dashboard surfaces total, pending, completed, and overdue counts alongside
                        a 7-day deadline forecast and subject workload chart.
                      </p>
                    </div>
                  </div>

                  <div className="py-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                    <span className="font-mono text-sm font-medium text-blue-700 shrink-0 tabular-nums">
                      03.
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        Access from desktop or phone without losing state
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Every status update and deadline edit syncs in real time to Cloud Firestore
                        so your mobile check-ins and laptop study sessions stay aligned.
                      </p>
                    </div>
                  </div>
                </div>

                <div id="security" className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-sm text-slate-600">
                    Sign in with your Google account to open your personal workspace.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    disabled={isSigningIn || !isFirebaseConfigured}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Open STUDYFLOW</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-slate-800">STUDYFLOW</span>
            <span aria-hidden="true">·</span>
            <span>Student Productivity Manager</span>
          </div>
          <p>Firebase Authentication &amp; Cloud Firestore Workspace</p>
        </div>
      </footer>
    </div>
  );
}
