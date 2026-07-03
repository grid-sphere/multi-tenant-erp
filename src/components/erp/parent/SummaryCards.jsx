// src/components/erp/parent/SummaryCards.jsx

import React, { useMemo } from "react";
import { useParent } from "../../../context/ParentProvider";

const getGradeLetter = (pct) => {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  return "C";
};

// ---------------------------------------------------------------------------
// Status pill helpers
// ---------------------------------------------------------------------------
const attendancePill = (status) => {
  if (status === "Good") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
  if (status === "Needs Attention") {
    return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
  }
  return "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400";
};

// ---------------------------------------------------------------------------
// Circular progress ring — used by the Attendance card. Compact, centered.
// ---------------------------------------------------------------------------
const RadialProgress = ({ percentage, size = 52, strokeWidth = 6 }) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const color = "#059669"; // emerald-600
  const trackColor = "#d1fae5"; // emerald-100

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-body text-3xs sm:text-2xs font-extrabold" style={{ color }}>
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Semi-circle gauge — used by the Avg Grade card.
// (Trophy badge removed — arc now sits directly above the 0%/100% labels.)
// ---------------------------------------------------------------------------
const GaugeArc = ({ percentage, size = 68, strokeWidth = 7 }) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = r + strokeWidth / 2;
  const circumference = Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const arcHeight = r + strokeWidth;

  const labelGap = 4; // breathing room between arc and labels
  const labelRowHeight = 12;
  const labelTop = arcHeight + labelGap;
  const totalHeight = labelTop + labelRowHeight;

  const color = "#9333ea"; // purple-600
  const trackColor = "#ede9fe"; // purple-100

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: totalHeight }}>
      <svg width={size} height={arcHeight} viewBox={`0 0 ${size} ${arcHeight}`}>
        <path d={pathD} fill="none" stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>

      <div
        className="font-body absolute inset-x-0 flex justify-between px-0.5 text-3xs text-on-surface-variant dark:text-slate-400 font-medium"
        style={{ top: labelTop }}
      >
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Per-card visual theme
// ---------------------------------------------------------------------------
const THEME = {
  attendance: {
    gradient: "from-blue-50 via-blue-50/40 to-white dark:from-blue-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    ring: "hover:border-blue-300 dark:hover:border-blue-700",
    watermarkIcon: null,
  },
  grade: {
    gradient: "from-purple-50 via-purple-50/40 to-white dark:from-purple-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    ring: "hover:border-purple-300 dark:hover:border-purple-700",
    watermarkIcon: null,
  },
  assignments: {
    gradient: "from-orange-50 via-orange-50/40 to-white dark:from-orange-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    ring: "hover:border-orange-300 dark:hover:border-orange-700",
    watermarkIcon: "content_paste",
  },
  exams: {
    gradient: "from-emerald-50 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ring: "hover:border-emerald-300 dark:hover:border-emerald-700",
    watermarkIcon: "calendar_month",
  },
};

const SummaryCards = () => {
  const { dashboard, attendanceSummary, loading } = useParent();

  const { attendanceCard, gradeCard, assignmentsCard, examsCard } = useMemo(() => {
    if (!dashboard) return {};

    const att = attendanceSummary || dashboard.attendance || {};
    const overallPct = dashboard.overall_percentage ?? 0;
    const upcomingExams = dashboard.upcoming_exams || [];
    const stats = dashboard.stats || {};

    const totalAssignments = stats.total_assignments ?? 0;
    const pendingCount = stats.pending_assignments ?? 0;
    const attendancePct = att.attendance_percentage ?? 0;

    return {
      attendanceCard: {
        percentage: attendancePct,
        status: att.status,
      },
      gradeCard: {
        percentage: overallPct,
        letter: getGradeLetter(overallPct),
      },
      assignmentsCard: { totalAssignments, pendingCount },
      examsCard: { upcomingExams },
    };
  }, [dashboard, attendanceSummary]);

  if (loading || !dashboard) {
    return (
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-2.5 sm:p-3 lg:p-4 rounded-lg border border-outline-variant/10 animate-pulse">
            <div className="flex justify-between items-start mb-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-surface-container-low rounded-md" />
              <div className="w-8 sm:w-10 h-2.5 bg-surface-container-low rounded" />
            </div>
            <div className="w-14 sm:w-16 h-2.5 bg-surface-container-low rounded mb-1.5" />
            <div className="w-10 sm:w-12 h-5 sm:h-6 bg-surface-container-low rounded" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="font-body grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {/* ---------------------------- ATTENDANCE ---------------------------- */}
      <div
        className={`relative bg-gradient-to-br ${THEME.attendance.gradient} p-2.5 sm:p-3 lg:p-4 rounded-lg
                    border border-outline-variant/10 dark:border-slate-700/40 ${THEME.attendance.ring}
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                    min-w-0 overflow-hidden`}
      >
        <div className="flex justify-between items-start mb-1.5 sm:mb-2 gap-1">
          <div className={`p-1 sm:p-1.5 rounded-md flex-shrink-0 ${THEME.attendance.iconBg}`}>
            <span className={`material-symbols-outlined ${THEME.attendance.iconColor} text-sm sm:text-base`}>
              calendar_check
            </span>
          </div>
          <span className={`px-1.5 py-0.5 rounded-full font-bold text-3xs sm:text-2xs uppercase tracking-wide whitespace-nowrap ${attendancePill(attendanceCard.status)}`}>
            {attendanceCard.status || "—"}
          </span>
        </div>

        <p className="text-on-surface-variant dark:text-slate-400 text-3xs sm:text-2xs font-medium leading-tight truncate">
          Attendance
        </p>
        <h3 className="font-headline text-base sm:text-lg lg:text-xl font-extrabold text-on-surface dark:text-white mt-0.5 leading-none truncate">
          {attendanceCard.percentage}%
        </h3>

        <div className="flex justify-center mt-1.5 sm:mt-2">
          <RadialProgress percentage={attendanceCard.percentage} />
        </div>
      </div>

      {/* ------------------------------ AVG GRADE ---------------------------- */}
      <div
        className={`relative bg-gradient-to-br ${THEME.grade.gradient} p-2.5 sm:p-3 lg:p-4 rounded-lg
                    border border-outline-variant/10 dark:border-slate-700/40 ${THEME.grade.ring}
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                    min-w-0 overflow-hidden`}
      >
        <div className="flex justify-between items-start mb-1.5 sm:mb-2 gap-1">
          <div className={`p-1 sm:p-1.5 rounded-md flex-shrink-0 ${THEME.grade.iconBg}`}>
            <span className={`material-symbols-outlined ${THEME.grade.iconColor} text-sm sm:text-base`}>
              star_rate
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-3xs sm:text-2xs uppercase tracking-wide whitespace-nowrap">
            {gradeCard.percentage}%
          </span>
        </div>

        <p className="text-on-surface-variant dark:text-slate-400 text-3xs sm:text-2xs font-medium leading-tight truncate">
          Avg Grade
        </p>
        <h3 className="font-headline text-base sm:text-lg lg:text-xl font-extrabold text-on-surface dark:text-white mt-0.5 leading-none truncate">
          {gradeCard.letter}
        </h3>

        <div className="flex justify-center mt-1.5 sm:mt-2">
          <GaugeArc percentage={gradeCard.percentage} />
        </div>
      </div>

      {/* ---------------------------- ASSIGNMENTS ---------------------------- */}
      <div
        className={`relative bg-gradient-to-br ${THEME.assignments.gradient} p-2.5 sm:p-3 lg:p-4 rounded-lg group cursor-default
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                    border border-outline-variant/10 dark:border-slate-700/40 ${THEME.assignments.ring}
                    min-w-0 overflow-hidden`}
      >
        <span
          className={`material-symbols-outlined absolute -bottom-2 -right-2 text-5xl sm:text-6xl opacity-[0.07] dark:opacity-[0.08] pointer-events-none select-none ${THEME.assignments.iconColor}`}
          aria-hidden="true"
        >
          {THEME.assignments.watermarkIcon}
        </span>

        <div className="relative flex justify-between items-start mb-1.5 sm:mb-2 gap-1">
          <div className={`p-1 sm:p-1.5 rounded-md transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 ${THEME.assignments.iconBg}`}>
            <span className={`material-symbols-outlined ${THEME.assignments.iconColor} text-sm sm:text-base`}>
              pending_actions
            </span>
          </div>
        </div>

        <p className="relative text-on-surface-variant dark:text-slate-400 text-3xs sm:text-2xs font-medium leading-tight truncate">
          Assignments
        </p>
        <h3 className="font-headline relative text-base sm:text-lg lg:text-xl font-extrabold text-on-surface dark:text-white mt-0.5 leading-none truncate">
          {assignmentsCard.totalAssignments}
        </h3>

        <div className="relative mt-1.5 sm:mt-2">
          {assignmentsCard.pendingCount > 0 ? (
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-3xs sm:text-2xs flex items-center gap-1">
              <span className="material-symbols-outlined text-xs leading-none">schedule</span>
              {assignmentsCard.pendingCount} pending
            </span>
          ) : (
            <span className="text-on-surface-variant dark:text-slate-400 font-medium text-3xs sm:text-2xs">
              All caught up
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------- EXAMS ------------------------------- */}
      <div
        className={`relative bg-gradient-to-br ${THEME.exams.gradient} p-2.5 sm:p-3 lg:p-4 rounded-lg group cursor-default
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                    border border-outline-variant/10 dark:border-slate-700/40 ${THEME.exams.ring}
                    min-w-0 overflow-hidden`}
      >
        <span
          className={`material-symbols-outlined absolute -bottom-2 -right-2 text-5xl sm:text-6xl opacity-[0.07] dark:opacity-[0.08] pointer-events-none select-none ${THEME.exams.iconColor}`}
          aria-hidden="true"
        >
          {THEME.exams.watermarkIcon}
        </span>

        <div className="relative flex justify-between items-start mb-1.5 sm:mb-2 gap-1">
          <div className={`p-1 sm:p-1.5 rounded-md transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 ${THEME.exams.iconBg}`}>
            <span className={`material-symbols-outlined ${THEME.exams.iconColor} text-sm sm:text-base`}>
              event_note
            </span>
          </div>
        </div>

        <p className="relative text-on-surface-variant dark:text-slate-400 text-3xs sm:text-2xs font-medium leading-tight truncate">
          Upcoming Exams
        </p>
        <h3 className="font-headline relative text-base sm:text-lg lg:text-xl font-extrabold text-on-surface dark:text-white mt-0.5 leading-none truncate">
          {examsCard.upcomingExams.length}
        </h3>

        <div className="relative mt-1.5 sm:mt-2">
          {examsCard.upcomingExams.length > 0 ? (
            <span className="text-on-surface-variant dark:text-slate-400 font-medium text-3xs sm:text-2xs truncate block">
              Next: {examsCard.upcomingExams[0].name || examsCard.upcomingExams[0].exam_name || ""}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-3xs sm:text-2xs">
              No exams scheduled
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default SummaryCards;