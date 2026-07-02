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
// Tiny inline sparkline (no chart library needed)
// ---------------------------------------------------------------------------
const Sparkline = ({ data, stroke }) => {
  if (!Array.isArray(data) || data.length < 2) return null;

  const w = 64;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastY = h - ((data[data.length - 1] - min) / range) * h;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible flex-shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r="2.5" fill={stroke} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Trend row (arrow + "x% vs last month" + sparkline)
// Renders nothing if the backend hasn't supplied trend data yet.
// ---------------------------------------------------------------------------
const TrendRow = ({ direction, value, series, stroke }) => {
  if (direction == null || value == null) return null;

  const isUp = direction === "up";
  const arrowIcon = isUp ? "trending_up" : "trending_down";
  const colorClass = isUp
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-error";

  return (
    <div className="flex items-center justify-between mt-2 sm:mt-3">
      <span className={`flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold ${colorClass}`}>
        <span className="material-symbols-outlined text-sm leading-none">{arrowIcon}</span>
        {value}% vs last month
      </span>
      <Sparkline data={series} stroke={stroke} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Per-card visual theme — soft gradients matching the target design
// ---------------------------------------------------------------------------
const THEME = {
  attendance: {
    gradient: "from-blue-50 via-blue-50/40 to-white dark:from-blue-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    ring: "hover:border-blue-300 dark:hover:border-blue-700",
    sparkStroke: "#2563eb",
    watermarkIcon: null,
  },
  grade: {
    gradient: "from-purple-50 via-purple-50/40 to-white dark:from-purple-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    ring: "hover:border-purple-300 dark:hover:border-purple-700",
    sparkStroke: "#9333ea",
    watermarkIcon: null,
  },
  assignments: {
    gradient: "from-orange-50 via-orange-50/40 to-white dark:from-orange-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    ring: "hover:border-orange-300 dark:hover:border-orange-700",
    sparkStroke: "#ea580c",
    watermarkIcon: "content_paste",
  },
  exams: {
    gradient: "from-emerald-50 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-slate-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ring: "hover:border-emerald-300 dark:hover:border-emerald-700",
    sparkStroke: "#059669",
    watermarkIcon: "calendar_month",
  },
};

const SummaryCards = () => {
  const { dashboard, attendanceSummary, loading } = useParent();

  const cards = useMemo(() => {
    if (!dashboard) return [];

    const att = attendanceSummary || dashboard.attendance || {};
    const overallPct = dashboard.overall_percentage ?? 0;
    const upcomingExams = dashboard.upcoming_exams || [];
    const stats = dashboard.stats || {};

    // FIX: no more hardcoded fallback (was defaulting to 2 whenever
    // total_assignments existed). Now this is 100% backend-driven:
    // - if the backend sends `pending_assignments`, use it as-is (0 included)
    // - if it doesn't send that field at all, we fall back to 0, not a fake number
    const totalAssignments = stats.total_assignments ?? 0;
    const pendingCount = stats.pending_assignments ?? 0;

    return [
      {
        key: "attendance",
        icon: "calendar_check",
        label: "Attendance",
        value: `${att.attendance_percentage ?? 0}%`,
        pill: (
          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap ${attendancePill(att.status)}`}>
            {att.status || "—"}
          </span>
        ),
        // Fallback demo trend — replace with real att.trend_direction /
        // trend_percentage / trend_series from your API when available.
        trend: {
          direction: att.trend_direction ?? "down",
          value: att.trend_percentage ?? 4.3,
          series: att.trend_series ?? [74, 71, 73, 70, 67, att.attendance_percentage ?? 69.23],
        },
      },
      {
        key: "grade",
        icon: "star_rate",
        label: "Avg Grade",
        value: getGradeLetter(overallPct),
        pill: (
          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap">
            {overallPct}%
          </span>
        ),
        // Fallback demo trend — replace with real dashboard.grade_trend_direction /
        // grade_trend_percentage / grade_trend_series from your API when available.
        trend: {
          direction: dashboard.grade_trend_direction ?? "up",
          value: dashboard.grade_trend_percentage ?? 8.6,
          series: dashboard.grade_trend_series ?? [58, 64, 61, 68, 72, overallPct],
        },
      },
      {
        key: "assignments",
        icon: "pending_actions",
        label: "Assignments",
        value: totalAssignments,
        pill: null,
        // FIX: purely derived from backend `pendingCount` now.
        // pendingCount === 0 -> "All caught up"
        // pendingCount > 0   -> "{n} pending"
        secondaryText: pendingCount > 0 ? (
          <span className="text-orange-600 dark:text-orange-400 font-semibold text-[11px] sm:text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-sm leading-none">schedule</span>
            {pendingCount} pending
          </span>
        ) : (
          <span className="text-on-surface-variant dark:text-slate-400 font-medium text-[11px] sm:text-xs">
            All caught up
          </span>
        ),
      },
      {
        key: "exams",
        icon: "event_note",
        label: "Upcoming Exams",
        value: upcomingExams.length,
        pill: null,
        secondaryText:
          upcomingExams.length > 0 ? (
            <span className="text-on-surface-variant dark:text-slate-400 font-medium text-[11px] sm:text-xs truncate block">
              Next: {upcomingExams[0].name || upcomingExams[0].exam_name || ""}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] sm:text-xs">
              No exams scheduled
            </span>
          ),
      },
    ];
  }, [dashboard, attendanceSummary]);

  if (loading || !dashboard) {
    return (
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-3 sm:p-4 lg:p-6 rounded-xl border border-outline-variant/10 animate-pulse">
            <div className="flex justify-between items-start mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-container-low rounded-lg" />
              <div className="w-10 sm:w-12 h-3 bg-surface-container-low rounded" />
            </div>
            <div className="w-16 sm:w-20 h-3 bg-surface-container-low rounded mb-2" />
            <div className="w-12 sm:w-14 h-6 sm:h-7 bg-surface-container-low rounded" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {cards.map(({ key, icon, label, value, pill, secondaryText, trend }) => {
        const theme = THEME[key];
        return (
          <div
            key={key}
            className={`relative bg-gradient-to-br ${theme.gradient}
                        p-3 sm:p-4 lg:p-6 rounded-xl group cursor-default
                        transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
                        border border-outline-variant/10 dark:border-slate-700/40
                        ${theme.ring}
                        min-w-0 overflow-hidden`}
          >
            {/* Faint watermark icon (assignments / exams) */}
            {theme.watermarkIcon && (
              <span
                className={`material-symbols-outlined absolute -bottom-3 -right-3 text-7xl sm:text-8xl opacity-[0.07] dark:opacity-[0.08] pointer-events-none select-none ${theme.iconColor}`}
                aria-hidden="true"
              >
                {theme.watermarkIcon}
              </span>
            )}

            <div className="relative flex justify-between items-start mb-2.5 sm:mb-3 lg:mb-4 gap-1">
              <div className={`p-1.5 sm:p-2 rounded-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0 ${theme.iconBg}`}>
                <span className={`material-symbols-outlined ${theme.iconColor} text-base sm:text-lg lg:text-xl`}>
                  {icon}
                </span>
              </div>
              <div className="min-w-0 text-right">{pill}</div>
            </div>

            <p className="relative text-on-surface-variant dark:text-slate-400 text-[11px] sm:text-xs lg:text-sm font-medium leading-tight truncate">
              {label}
            </p>
            <h3 className="relative text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface dark:text-white mt-1 leading-none truncate">
              {value}
            </h3>

            {/* Attendance / Grade: trend row with sparkline */}
            {trend && (
              <div className="relative">
                <TrendRow
                  direction={trend.direction}
                  value={trend.value}
                  series={trend.series}
                  stroke={theme.sparkStroke}
                />
              </div>
            )}

            {/* Assignments / Exams: secondary status line */}
            {secondaryText && <div className="relative mt-2 sm:mt-3">{secondaryText}</div>}
          </div>
        );
      })}
    </section>
  );
};

export default SummaryCards;