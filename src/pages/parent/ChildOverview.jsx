import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { useParent } from "../../context/ParentProvider";

/* ─── Subject Icon ──────────────────────────────────────────────────────── */
const SubjectIcon = ({ name = "" }) => {
  const n = name.toLowerCase();

  if (n.includes("science") || n.includes("biology") || n.includes("physics") || n.includes("chemistry")) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
        </svg>
      </div>
    );
  }
  if (n.includes("hindi") || n.includes("sanskrit") || n.includes("urdu")) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
        </svg>
      </div>
    );
  }
  if (n.includes("math") || n.includes("algebra") || n.includes("geometry") || n.includes("calculus")) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M12 3v18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>
        </svg>
      </div>
    );
  }
  if (n.includes("social") || n.includes("sst") || n.includes("history") || n.includes("geography") || n.includes("civics")) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
        </svg>
      </div>
    );
  }
  if (n.includes("english") || n.includes("literature") || n.includes("writing")) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
        </svg>
      </div>
    );
  }
  if (n.includes("computer") || n.includes("it") || n.includes("technology") || n.includes("coding")) {
    return (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */
const ChildOverview = () => {
  const navigate = useNavigate();

  const {
    activeChild,
    enrollment,
    attendanceRecords,
    attendanceSummary,
    gradesFlat,
    loading,
    childDataLoading,
    error,
  } = useParent();

  const childData = useMemo(() => {
    if (!activeChild) return null;

    const name = activeChild.name || "Student";
    const rollNumber = enrollment?.roll_number || activeChild.enrollment_number || "N/A";
    const grade = enrollment
      ? `${enrollment.class_level_name}${enrollment.section_name ? ` - ${enrollment.section_name}` : ""}`
      : "Not Enrolled";
    const profilePicUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;

    const attendancePct =
      attendanceSummary?.attendance_percentage ??
      activeChild.dashboard?.attendance?.attendance_percentage ??
      0;
    const attendancePercentage = attendancePct.toFixed(2);

    const numericScores = gradesFlat
      .map((g) => {
        const obtained = parseFloat(g.marks_obtained);
        const max      = parseFloat(g.max_marks) || 100;
        return (obtained / max) * 100;
      })
      .filter((n) => !isNaN(n));

    const avgScoreNum =
      numericScores.length > 0
        ? (numericScores.reduce((a, b) => a + b, 0) / numericScores.length).toFixed(2)
        : "0.00";

    const avgGradeLetter =
      numericScores.length === 0 ? "N/A"
        : avgScoreNum >= 90 ? "A+"
        : avgScoreNum >= 80 ? "A"
        : avgScoreNum >= 70 ? "B+"
        : avgScoreNum >= 60 ? "B"
        : "C";

    const subjectMap = new Map();
    gradesFlat.forEach((g) => {
      const key      = g.subject_name || "Unknown Subject";
      const obtained = parseFloat(g.marks_obtained) || 0;
      const max      = parseFloat(g.max_marks) || 100;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, { totalObtained: 0, totalMax: 0, id: g.subject || key });
      }
      const entry = subjectMap.get(key);
      entry.totalObtained += obtained;
      entry.totalMax      += max;
    });

    const subjects = Array.from(subjectMap.entries()).map(([subjName, entry]) => {
      const scoreNum = entry.totalMax > 0 ? ((entry.totalObtained / entry.totalMax) * 100).toFixed(2) : "0.00";
      const trend    = scoreNum >= 80 ? "up" : scoreNum < 70 ? "down" : "flat";
      return {
        id:   entry.id,
        name: subjName,
        score: scoreNum,
        level: scoreNum >= 80 ? "Excellent" : scoreNum >= 70 ? "Good" : "Needs Improvement",
        levelColor:
          scoreNum >= 80
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : scoreNum >= 70
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-red-50 text-red-500 border border-red-200",
        trend,
      };
    });

    return {
      name,
      rollNumber,
      grade,
      profilePicUrl,
      stats: {
        totalSubjects: subjects.length,
        avgGrade:      avgGradeLetter,
        attendance:    attendancePercentage,
      },
      subjects,
    };
  }, [activeChild, enrollment, attendanceRecords, attendanceSummary, gradesFlat]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !childData) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-700 rounded-xl p-4 text-xs">
            Could not load child overview. {error?.message || "Please try again later."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="font-body p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* ── Header ── */}
        <div>
          <h1 className="font-headline text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
            Child Overview
          </h1>
          <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tracking {childData.name}&apos;s academic progress
            {childDataLoading && (
              <span className="ml-2 inline-block w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin align-middle" />
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4">

          {/* Student profile card */}
          <div className="xl:col-span-4 bg-gradient-to-b from-blue-50/60 to-white dark:from-slate-800 dark:to-slate-800 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center border border-blue-100 dark:border-slate-700 shadow-sm">
            <img
              alt={childData.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover ring-4 ring-slate-50 dark:ring-slate-700 bg-slate-100"
              src={childData.profilePicUrl}
              onError={(e) => {
                const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(childData.name)}&background=0D8ABC&color=fff`;
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
            />
            <span className="mt-2.5 inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-1 rounded-md text-3xs font-semibold shadow-sm">
              {childData.grade}
            </span>
            <h2 className="mt-2.5 sm:mt-3 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {childData.name}
            </h2>
            <p className="text-2xs sm:text-xs text-slate-400 dark:text-slate-400 font-medium">
              Roll #{childData.rollNumber}
            </p>
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row flex-wrap justify-center gap-2 w-full">
              <button
                onClick={() => navigate("/parent/grades")}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-2xs sm:text-xs font-semibold flex items-center justify-center gap-1.5 hover:shadow-md transition"
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                Report Card
              </button>
              <button
                onClick={() => navigate("/parent/attendance")}
                className="flex-1 px-3 py-2 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-2xs sm:text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition"
              >
                <span className="material-symbols-outlined text-sm">event_available</span>
                Attendance
              </button>
            </div>
          </div>

          {/* Academic summary */}
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

            {/* Total subjects */}
            <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-xl p-3 sm:p-4 border border-blue-100 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 sm:mb-3">
                <span className="material-symbols-outlined text-base sm:text-lg">menu_book</span>
              </div>
              <p className="text-2xs sm:text-xs font-medium text-slate-500 dark:text-slate-400">Total Subjects</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {childData.stats.totalSubjects}
              </h3>
              <p className="text-3xs text-blue-500 dark:text-blue-400 mt-1.5 font-medium">Graded so far</p>
            </div>

            {/* Average grade */}
            <div className="bg-gradient-to-br from-violet-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-xl p-3 sm:p-4 border border-violet-100 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2 sm:mb-3">
                <span className="material-symbols-outlined text-base sm:text-lg">auto_awesome</span>
              </div>
              <p className="text-2xs sm:text-xs font-medium text-slate-500 dark:text-slate-400">Avg Grade</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {childData.stats.avgGrade}
              </h3>
              <p className="text-3xs text-violet-500 dark:text-violet-400 mt-1.5 font-medium">
                Across all graded subjects
              </p>
            </div>

            {/* Attendance */}
            <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-xl p-3 sm:p-4 border border-emerald-100 dark:border-slate-700 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 sm:mb-3">
                <span className="material-symbols-outlined text-base sm:text-lg">check_circle</span>
              </div>
              <p className="text-2xs sm:text-xs font-medium text-slate-500 dark:text-slate-400">Attendance</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {childData.stats.attendance}%
              </h3>
              <p className={`text-3xs font-semibold mt-1.5 flex items-center gap-1 ${
                childData.stats.attendance >= 75
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}>
                <span className="material-symbols-outlined text-xs">
                  {childData.stats.attendance >= 75 ? "verified" : "warning"}
                </span>
                {childData.stats.attendance >= 75 ? "Meets requirement" : "Below requirement"}
              </p>
            </div>

            {/* AI insight banner */}
            <div className="sm:col-span-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute right-4 sm:right-8 bottom-0 opacity-10">
                <span className="material-symbols-outlined text-5xl sm:text-6xl text-white">psychology</span>
              </div>
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                <span className="text-3xs font-bold uppercase tracking-[0.2em] text-blue-100">
                  AI Insight
                </span>
              </div>
              <p className="relative z-10 text-white text-xs sm:text-sm font-semibold leading-relaxed max-w-2xl">
                {childData.stats.attendance >= 75
                  ? `${childData.name} is maintaining solid attendance and a ${childData.stats.avgGrade} average — keep up the consistent support at home.`
                  : `${childData.name}'s attendance is currently below the school's requirement. Consider checking in to understand what's affecting day-to-day presence.`}
              </p>
            </div>
          </div>
        </div>

        {/* Subject-wise performance table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex justify-between items-center bg-gradient-to-r from-blue-50/80 to-violet-50/50 dark:from-slate-700/50 dark:to-slate-700/30 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-base">leaderboard</span>
              <span className="hidden xs:inline">Subject-wise Performance</span>
              <span className="xs:hidden">Performance</span>
            </h3>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {childData.subjects.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No graded subjects yet.
              </div>
            ) : (
              childData.subjects.map((subject) => (
                <div key={subject.id} className="px-4 py-3 flex items-center gap-2.5">
                  <SubjectIcon name={subject.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
                      {subject.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-2xs">
                        {subject.score}%
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-semibold ${subject.levelColor}`}>
                        {subject.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {subject.trend === "up" && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                      </svg>
                    )}
                    {subject.trend === "down" && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
                      </svg>
                    )}
                    {subject.trend === "flat" && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
                      </svg>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-t border-slate-100 dark:border-slate-700">
                  {["Subject", "Average Score", "Performance Level", "Trend"].map((h) => (
                    <th
                      key={h}
                      className="px-4 sm:px-5 py-2.5 text-3xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {childData.subjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      No graded subjects yet.
                    </td>
                  </tr>
                ) : (
                  childData.subjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                        <div className="flex items-center gap-2.5">
                          <SubjectIcon name={subject.name} />
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                            {subject.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {subject.score}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold ${subject.levelColor}`}>
                          {subject.level}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                        {subject.trend === "up" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                          </svg>
                        )}
                        {subject.trend === "down" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
                          </svg>
                        )}
                        {subject.trend === "flat" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
                          </svg>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="h-2 sm:h-4" />
      </div>
    </DashboardLayout>
  );
};

export default ChildOverview;