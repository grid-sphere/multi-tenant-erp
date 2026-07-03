import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { useParent } from "../../context/ParentProvider";
import { getChildAssignments } from "../../services/parentAPIs";

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md ${className}`} />;
}

function AssignmentsSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-4 p-1">
        <div className="space-y-1.5">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-52 h-3" />
        </div>
        <Skeleton className="w-full h-16 rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700 space-y-2.5">
              <Skeleton className="w-16 h-2.5" />
              <Skeleton className="w-10 h-6" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="xl:col-span-2 space-y-2.5">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-full h-16 rounded-xl" />)}
          </div>
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const SUBJECT_META = {
  physics:            { icon: "science",     bg: "bg-blue-100",    color: "text-blue-600"    },
  mathematics:        { icon: "calculate",   bg: "bg-purple-100",  color: "text-purple-600"  },
  math:               { icon: "calculate",   bg: "bg-purple-100",  color: "text-purple-600"  },
  english:            { icon: "menu_book",   bg: "bg-orange-100",  color: "text-orange-600"  },
  literature:         { icon: "menu_book",   bg: "bg-orange-100",  color: "text-orange-600"  },
  chemistry:          { icon: "experiment",  bg: "bg-green-100",   color: "text-green-600"   },
  biology:            { icon: "biotech",     bg: "bg-emerald-100", color: "text-emerald-600" },
  "computer science": { icon: "code",        bg: "bg-indigo-100",  color: "text-indigo-600"  },
  history:            { icon: "history_edu", bg: "bg-amber-100",   color: "text-amber-600"   },
  hindi:              { icon: "translate",   bg: "bg-red-100",     color: "text-red-600"     },
  science:            { icon: "science",     bg: "bg-sky-100",     color: "text-sky-600"     },
  "social studies":   { icon: "public",      bg: "bg-teal-100",    color: "text-teal-600"    },
};

function subjectMeta(name) {
  return (
    SUBJECT_META[(name || "").toLowerCase()] ||
    { icon: "assignment", bg: "bg-slate-100", color: "text-slate-600" }
  );
}

const STATUS_STYLES = {
  Pending:   { badge: "bg-amber-100 text-amber-800",   dot: "bg-amber-500"  },
  Submitted: { badge: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
  Graded:    { badge: "bg-blue-100 text-blue-800",     dot: "bg-blue-500"   },
};

function dueLabel(dueDateStr) {
  if (!dueDateStr) return { text: "No deadline", urgent: false };
  const due  = new Date(dueDateStr);
  const now  = new Date();
  const diff = Math.ceil((due - now) / 864e5);
  const time = due.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const date = due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (diff < 0)   return { text: `Overdue · ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, urgent: true };
  if (diff === 0) return { text: `Today, ${time}`, urgent: true };
  if (diff === 1) return { text: `Tomorrow, ${time}`, urgent: true };
  return { text: date, urgent: false };
}

function UnauthorizedState({ childName }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-amber-500 text-2xl">lock</span>
      </div>
      <div>
        <p className="font-bold text-slate-800 dark:text-white text-sm">
          Academic access not enabled for {childName}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Contact the school to enable academic data access for this child.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Assignment Detail Modal
───────────────────────────────────────────── */
function AssignmentDetailModal({ assignment, onClose }) {
  if (!assignment) return null;

  const meta = subjectMeta(assignment.subject_name);
  const due  = dueLabel(assignment.due_date);
  const st   = STATUS_STYLES[assignment.submission_status] || { badge: "bg-slate-100 text-slate-700" };

  return (
    <div
      className="font-body fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`${meta.bg} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${meta.color} text-lg`}>{meta.icon}</span>
            </div>
            <div>
              <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">
                {assignment.subject_name || "—"}
                {assignment.section_name ? ` · ${assignment.section_name}` : ""}
              </p>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
                {assignment.title || "Untitled Assignment"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
            <p className="text-3xs text-slate-400 uppercase tracking-wider mb-1">Status</p>
            <span className={`text-2xs px-2 py-0.5 rounded-full font-bold ${st.badge}`}>
              {assignment.submission_status}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
            <p className="text-3xs text-slate-400 uppercase tracking-wider mb-1">Deadline</p>
            <p className={`text-xs font-bold ${due.urgent ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
              {due.text}
            </p>
          </div>

          {assignment.teacher_name && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5">
              <p className="text-3xs text-slate-400 uppercase tracking-wider mb-1">Teacher</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{assignment.teacher_name}</p>
            </div>
          )}

          {assignment.submission_status === "Graded" && assignment.grade != null && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2.5">
              <p className="text-3xs text-blue-400 uppercase tracking-wider mb-1">Grade</p>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{assignment.grade}%</p>
            </div>
          )}

          {assignment.submission_status === "Submitted" && assignment.submitted_at && (
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2.5">
              <p className="text-3xs text-purple-400 uppercase tracking-wider mb-1">Submitted On</p>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                {new Date(assignment.submitted_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {assignment.description && (
          <div>
            <p className="text-3xs text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {assignment.description}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg
                     transition-colors text-xs"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main
───────────────────────────────────────────── */
export default function AssignmentsOverview() {
  const { activeChild, loading: ctxLoading, error: ctxError } = useParent();

  const [assignments,  setAssignments]  = useState([]);
  const [childInfo,    setChildInfo]    = useState(null);
  const [fetching,     setFetching]     = useState(true);
  const [fetchError,   setFetchError]   = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [statusFilter,  setStatusFilter]  = useState("All Status");

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (!activeChild?.id) { setFetching(false); return; }
    let cancelled = false;

    setSubjectFilter("All Subjects");
    setStatusFilter("All Status");

    (async () => {
      setFetching(true);
      setFetchError(null);
      setUnauthorized(false);
      setAssignments([]);
      setChildInfo(null);
      try {
        const data = await getChildAssignments(activeChild.id);
        if (cancelled) return;
        if (data.unauthorized) {
          setUnauthorized(true);
        } else {
          setAssignments(data.results || []);
          setChildInfo(data.child   || null);
        }
      } catch (e) {
        if (!cancelled) setFetchError(e);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeChild?.id]);

  /* ── Derived values ── */

  const subjectOptions = useMemo(
    () => [
      "All Subjects",
      ...Array.from(new Set(assignments.map(a => a.subject_name).filter(Boolean))).sort(),
    ],
    [assignments]
  );

  const total          = assignments.length;
  const submittedCount = assignments.filter(a => ["Submitted", "Graded"].includes(a.submission_status)).length;
  const pendingCount   = assignments.filter(a => a.submission_status === "Pending").length;
  const submissionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const gradedList = assignments.filter(a => a.submission_status === "Graded" && a.grade != null);
  const avgGrade   = gradedList.length > 0
    ? Math.round(gradedList.reduce((s, a) => s + parseFloat(a.grade), 0) / gradedList.length)
    : null;

  const nextPending = [...assignments]
    .filter(a => a.submission_status === "Pending")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  const filtered = assignments
    .filter(a =>
      subjectFilter === "All Subjects" ||
      (a.subject_name || "").toLowerCase() === subjectFilter.toLowerCase()
    )
    .filter(a =>
      statusFilter === "All Status" || a.submission_status === statusFilter
    )
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const studentName      = childInfo?.name || activeChild?.name || "Student";
  const studentFirstName = studentName.split(" ")[0];

  /* ── Early returns ── */

  if (ctxLoading || fetching) return <AssignmentsSkeleton />;

  if (ctxError || fetchError) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800
                        text-red-700 dark:text-red-300 rounded-xl p-4 text-xs">
          Could not load assignments. {(ctxError || fetchError)?.message || "Please try again later."}
        </div>
      </DashboardLayout>
    );
  }

  if (!activeChild?.id) {
    return (
      <DashboardLayout>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-700
                        rounded-xl p-4 text-xs">
          No active child selected.
        </div>
      </DashboardLayout>
    );
  }

  /* ── Render ── */

  return (
    <DashboardLayout>
      <AssignmentDetailModal
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
      />

      <div className="font-body space-y-4 sm:space-y-5">

        {/* HEADER */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Assignments</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Track, review, and manage {studentFirstName}&apos;s coursework.
          </p>
        </div>

        {unauthorized ? (
          <UnauthorizedState childName={studentName} />
        ) : (
          <>
            {/* INSIGHT BANNER */}
            {nextPending ? (
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-3 sm:p-4
                              flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="bg-white/20 p-2 rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-white text-base">psychology</span>
                  </div>
                  <div>
                    <p className="text-3xs text-blue-100 uppercase tracking-widest font-bold mb-0.5">
                      AI Intelligence Insight
                    </p>
                    <p className="text-white font-semibold text-xs sm:text-sm leading-snug">
                      <span className="font-bold">{nextPending.title}</span>
                      {" "}({nextPending.subject_name}) is due{" "}
                      {dueLabel(nextPending.due_date).text.toLowerCase()}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssignment(nextPending)}
                  className="self-start sm:self-auto shrink-0 bg-white text-blue-700 px-3 py-1.5
                             rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
                >
                  Review Now
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-xl p-3 sm:p-4
                              flex items-center gap-2.5 shadow-lg">
                <div className="bg-white/20 p-2 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-white text-base">check_circle</span>
                </div>
                <p className="text-white font-semibold text-xs sm:text-sm">
                  All caught up — no pending assignments right now!
                </p>
              </div>
            )}

            {/* METRIC CARDS */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4
                              border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-2xs font-medium text-slate-500 dark:text-slate-400">Total</p>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-sm">analytics</span>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{total}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4
                              border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-2xs font-medium text-slate-500 dark:text-slate-400">Submitted</p>
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-sm">check_circle</span>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400">{submittedCount}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4
                              border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-2xs font-medium text-slate-500 dark:text-slate-400">Pending</p>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-sm">pending_actions</span>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</p>
              </div>
            </div>

            {/* ROADMAP + SIDEBAR */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">

              {/* Left: list */}
              <div className="xl:col-span-2 space-y-2.5">

                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                    Assignment Roadmap
                  </h3>
                  <div className="flex gap-2 w-full xs:w-auto">
                    <select
                      value={subjectFilter}
                      onChange={e => setSubjectFilter(e.target.value)}
                      className="flex-1 xs:flex-none border border-slate-200 dark:border-slate-600
                                 rounded-lg px-2.5 py-1.5 text-2xs sm:text-xs
                                 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {subjectOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="flex-1 xs:flex-none border border-slate-200 dark:border-slate-600
                                 rounded-lg px-2.5 py-1.5 text-2xs sm:text-xs
                                 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {["All Status", "Pending", "Submitted", "Graded"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results count hint */}
                {(subjectFilter !== "All Subjects" || statusFilter !== "All Status") && (
                  <p className="text-2xs text-slate-400 dark:text-slate-500">
                    Showing {filtered.length} of {total} assignment{total !== 1 ? "s" : ""}
                    {subjectFilter !== "All Subjects" ? ` in ${subjectFilter}` : ""}
                    {statusFilter  !== "All Status"   ? ` · ${statusFilter}`   : ""}
                    {" "}
                    <button
                      onClick={() => { setSubjectFilter("All Subjects"); setStatusFilter("All Status"); }}
                      className="text-blue-500 hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  </p>
                )}

                {/* Empty */}
                {filtered.length === 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200
                                  dark:border-slate-700 p-8 text-center">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">
                      assignment
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-2.5">
                      No assignments match the selected filters.
                    </p>
                    <button
                      onClick={() => { setSubjectFilter("All Subjects"); setStatusFilter("All Status"); }}
                      className="mt-2.5 text-xs text-blue-500 hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                )}

                {/* Cards */}
                {filtered.map(a => {
                  const meta   = subjectMeta(a.subject_name);
                  const due    = dueLabel(a.due_date);
                  const st     = STATUS_STYLES[a.submission_status] || { badge: "bg-slate-100 text-slate-700" };
                  const graded = a.submission_status === "Graded";
                  const subm   = a.submission_status === "Submitted";

                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssignment(a)}
                      className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200
                                 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300
                                 dark:hover:border-blue-600 transition-all p-3 sm:p-4 flex items-center
                                 gap-2.5 sm:gap-3 group"
                    >
                      {/* Icon */}
                      <div className={`${meta.bg} w-9 h-9 sm:w-10 sm:h-10 rounded-lg
                                       flex items-center justify-center shrink-0`}>
                        <span className={`material-symbols-outlined ${meta.color} text-base sm:text-lg`}>
                          {meta.icon}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-3xs font-semibold text-slate-400
                                      dark:text-slate-500 uppercase tracking-wider truncate mb-0.5">
                          {a.subject_name || "—"}{a.section_name ? ` · ${a.section_name}` : ""}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white
                                      leading-snug line-clamp-2">
                          {a.title || "Untitled Assignment"}
                        </p>
                        {a.teacher_name && (
                          <p className="text-3xs text-slate-400 dark:text-slate-500 mt-0.5">
                            By {a.teacher_name}
                          </p>
                        )}
                      </div>

                      {/* Due/grade desktop */}
                      <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[90px]">
                        {graded ? (
                          <>
                            <p className="text-3xs text-slate-400 dark:text-slate-500">Grade</p>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {a.grade != null ? `${a.grade}%` : "—"}
                            </p>
                          </>
                        ) : subm ? (
                          <>
                            <p className="text-3xs text-slate-400 dark:text-slate-500">Submitted</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {a.submitted_at
                                ? new Date(a.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                : "—"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-3xs text-slate-400 dark:text-slate-500">Deadline</p>
                            <p className={`text-xs font-bold ${due.urgent ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                              {due.text}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Badge */}
                      <span className={`text-3xs px-2 py-1 rounded-full font-bold
                                        shrink-0 whitespace-nowrap ${st.badge}`}>
                        {a.submission_status}
                      </span>

                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600
                                       group-hover:text-blue-400 text-base shrink-0 hidden sm:block transition-colors">
                        chevron_right
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: stats */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200
                              dark:border-slate-700 shadow-sm p-3 sm:p-4 h-fit space-y-4">

                <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">
                  Quick Statistics
                </h4>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400">Submission Rate</span>
                    <span className="text-2xs sm:text-xs font-bold text-blue-600 dark:text-blue-400">{submissionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${submissionRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400">Avg. Grade</span>
                  <span className="text-2xs sm:text-xs font-bold text-purple-600 dark:text-purple-400">
                    {avgGrade != null ? `${avgGrade}%` : "No grades yet"}
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="text-3xs font-bold text-slate-400 dark:text-slate-500
                                uppercase tracking-wider mb-2.5">Upcoming Pending</p>
                  {pendingCount === 0 ? (
                    <div className="flex items-center gap-2 text-2xs sm:text-xs text-slate-400 dark:text-slate-500">
                      <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                      Nothing pending right now.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {assignments
                        .filter(a => a.submission_status === "Pending")
                        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                        .slice(0, 4)
                        .map(a => {
                          const due = dueLabel(a.due_date);
                          return (
                            <button
                              key={a.id}
                              onClick={() => setSelectedAssignment(a)}
                              className="flex gap-2 items-start w-full text-left
                                         hover:bg-slate-50 dark:hover:bg-slate-700/50
                                         rounded-lg p-1 -mx-1 transition-colors group"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-2xs sm:text-xs font-semibold text-slate-700
                                              dark:text-slate-200 truncate leading-tight
                                              group-hover:text-blue-600 dark:group-hover:text-blue-400
                                              transition-colors">
                                  {a.title || "Untitled"}
                                </p>
                                <p className="text-3xs text-slate-400 dark:text-slate-500 mt-0.5">
                                  {a.subject_name} · {due.text}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}