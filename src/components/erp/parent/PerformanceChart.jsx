// src/components/erp/parent/PerformanceChart.jsx

import React, { useMemo, useRef, useState } from "react";
import { useParent } from "../../../context/ParentProvider";

const MONTH_LABELS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTH_LABELS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const MONTHS_TO_SHOW = 6;

// Rotating palette for the "Subjects view" badges
const SUBJECT_COLORS = [
  { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400", dot: "bg-pink-500" },
  { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
];

const buildMonthBuckets = (exams) => {
  const monthBuckets = {};
  exams.forEach((exam) => {
    const date = new Date(exam.exam_date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthBuckets[key]) {
      monthBuckets[key] = { totalObtained: 0, totalMax: 0, year: date.getFullYear(), month: date.getMonth() };
    }
    (exam.subjects || []).forEach((s) => {
      monthBuckets[key].totalObtained += parseFloat(s.marks_obtained || 0);
      monthBuckets[key].totalMax += parseFloat(s.max_marks || 0);
    });
  });
  return monthBuckets;
};

const PerformanceChart = () => {
  const { gradesExams, gradesFlat, loading, childDataLoading } = useParent();
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgWrapRef = useRef(null);

  const exams = useMemo(
    () => (gradesExams || []).filter((e) => e.is_published !== false && e.exam_date),
    [gradesExams],
  );

  const monthBuckets = useMemo(() => buildMonthBuckets(exams), [exams]);

  const sortedKeys = useMemo(
    () =>
      Object.keys(monthBuckets).sort((a, b) => {
        const [ay, am] = a.split("-").map(Number);
        const [by, bm] = b.split("-").map(Number);
        return ay !== by ? ay - by : am - bm;
      }),
    [monthBuckets],
  );

  const { points, monthLabels, hasData } = useMemo(() => {
    if (!sortedKeys.length) return { points: [], monthLabels: [], hasData: false };

    const recentKeys = sortedKeys.slice(-MONTHS_TO_SHOW);
    const pts = recentKeys.map((key) => {
      const b = monthBuckets[key];
      return { pct: b.totalMax > 0 ? Math.round((b.totalObtained / b.totalMax) * 100) : 0, month: b.month, year: b.year };
    });
    const labels = pts.map((p) => MONTH_LABELS[p.month]);
    return { points: pts, monthLabels: labels, hasData: pts.length > 0 };
  }, [sortedKeys, monthBuckets]);

  // Stat pills
  const stats = useMemo(() => {
    if (!points.length) return null;
    const pcts = points.map((p) => p.pct);
    const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    const improvement =
      pcts.length > 1 ? pcts[pcts.length - 1] - pcts[pcts.length - 2] : 0;
    return { avg, improvement };
  }, [points]);

  // Per-subject averages for the "Subjects view" row
  const subjectStats = useMemo(() => {
    const flat = Array.isArray(gradesFlat) ? gradesFlat : [];
    const withScores = flat.filter((g) => g.marks_obtained != null && g.max_marks != null && g.subject_name);
    if (!withScores.length) return [];

    const bySubject = {};
    withScores.forEach((g) => {
      const key = g.subject_name;
      if (!bySubject[key]) bySubject[key] = { obtained: 0, max: 0 };
      bySubject[key].obtained += parseFloat(g.marks_obtained || 0);
      bySubject[key].max += parseFloat(g.max_marks || 0);
    });

    return Object.entries(bySubject)
      .map(([name, v]) => ({
        name,
        pct: v.max > 0 ? Math.round((v.obtained / v.max) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [gradesFlat]);

  const W = 1000;
  const H = 300;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 30;

  const toCoords = (pts) => {
    const usableH = H - PAD_TOP - PAD_BOTTOM;
    const n = pts.length;
    const stepX = n > 1 ? W / (n - 1) : 0;
    return pts.map((p, i) => {
      const x = n > 1 ? i * stepX : W / 2;
      const y = PAD_TOP + (1 - Math.max(0, Math.min(100, p.pct)) / 100) * usableH;
      return { x, y, pct: p.pct };
    });
  };

  const buildPaths = (coords) => {
    if (!coords.length) return { linePath: "", areaPath: "" };
    let line = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1], curr = coords[i];
      line += ` Q${(prev.x + curr.x) / 2},${prev.y} ${curr.x},${curr.y}`;
    }
    const area = `${line} L${coords[coords.length - 1].x},${H} L0,${H} Z`;
    return { linePath: line, areaPath: area };
  };

  const dotPositions = useMemo(() => toCoords(points), [points]);
  const { linePath, areaPath } = useMemo(() => buildPaths(dotPositions), [dotPositions]);

  const handleMouseMove = (e) => {
    if (!dotPositions.length || !svgWrapRef.current) return;
    const rect = svgWrapRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let nearestDist = Infinity;
    dotPositions.forEach((d, i) => {
      const dist = Math.abs(d.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  };

  if (loading || childDataLoading) {
    return (
      <div className="perf-chart-card h-full bg-surface-container-lowest dark:bg-slate-800/60 rounded-xl border border-outline-variant/5 dark:border-slate-700/40 animate-pulse flex flex-col gap-3 p-4 sm:p-5">
        <div className="h-5 w-40 sm:w-48 bg-surface-container-low dark:bg-slate-700 rounded" />
        <div className="h-4 w-52 sm:w-64 bg-surface-container-low dark:bg-slate-700 rounded" />
        <div className="flex-1 min-h-[180px] bg-surface-container-low dark:bg-slate-700 rounded" />
      </div>
    );
  }

  const hoverPoint = hoverIdx != null ? dotPositions[hoverIdx] : null;
  const hoverLabel = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="perf-chart-card h-full min-h-[280px] sm:min-h-[320px] bg-surface-container-lowest dark:bg-slate-800/60 rounded-xl border border-outline-variant/5 dark:border-slate-700/40 flex flex-col transition-shadow hover:shadow-md">
      <style>{`
        .perf-chart-card {
          container-type: inline-size;
          container-name: perfcard;
          padding: 0.75rem;
        }
        .perf-chart-card .pc-title { font-size: 0.875rem; }
        .perf-chart-card .pc-subtitle { font-size: 0.6875rem; }
        .perf-chart-card .pc-month-label { font-size: 0.5625rem; }

        @container perfcard (min-width: 250px) {
          .perf-chart-card { padding: 1rem; }
          .perf-chart-card .pc-title { font-size: 1rem; }
          .perf-chart-card .pc-subtitle { font-size: 0.75rem; }
          .perf-chart-card .pc-month-label { font-size: 0.625rem; }
        }

        @container perfcard (min-width: 320px) {
          .perf-chart-card { padding: 1.25rem; }
          .perf-chart-card .pc-title { font-size: 1.125rem; }
          .perf-chart-card .pc-month-label { font-size: 0.75rem; }
        }

        .perf-line-path {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: pcDraw 1.1s ease-out forwards;
        }
        @keyframes pcDraw { to { stroke-dashoffset: 0; } }
        .perf-area-path { opacity: 0; animation: pcFade 0.8s ease-out 0.4s forwards; }
        @keyframes pcFade { to { opacity: 1; } }
        .perf-dot { transition: r 0.15s ease, filter 0.15s ease; cursor: pointer; }
        .perf-dot:hover, .perf-dot.is-active { r: 9; filter: drop-shadow(0 2px 4px rgba(0,88,190,0.4)); }
        .pc-stat-pill { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .pc-stat-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
        .pc-subject-pill { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .pc-subject-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-3 flex-shrink-0 gap-2 flex-wrap">
        <div className="min-w-0">
          <h3 className="pc-title font-bold font-headline text-on-surface dark:text-white mb-0.5 truncate">
            Performance Trend
          </h3>
          <p className="pc-subtitle text-on-surface-variant dark:text-slate-400 truncate">Average score across all subjects</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant dark:text-slate-400 text-center px-4">
          Not enough exam data yet to show a trend.
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          {/* Stat pills */}
          {stats && (
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <div className="pc-stat-pill flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] sm:text-xs text-on-surface-variant dark:text-slate-400">Average Score</span>
                <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">{stats.avg}%</span>
              </div>
              <div className="pc-stat-pill flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <span className="material-symbols-outlined text-purple-500 text-xs">
                  {stats.improvement >= 0 ? "trending_up" : "trending_down"}
                </span>
                <span className="text-[10px] sm:text-xs text-on-surface-variant dark:text-slate-400">Improvement</span>
                <span className={`text-[10px] sm:text-xs font-bold ${stats.improvement >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-error"}`}>
                  {stats.improvement >= 0 ? "+" : ""}{stats.improvement}%
                </span>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 w-full min-h-[160px] sm:min-h-[200px] relative" ref={svgWrapRef}>
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {/* Y-axis gridlines with % labels */}
              {[0, 25, 50, 75, 100].map((pctMark) => {
                const y = PAD_TOP + (1 - pctMark / 100) * (H - PAD_TOP - PAD_BOTTOM);
                return (
                  <g key={pctMark}>
                    <line stroke="#eff4ff" strokeWidth="1" x1="0" x2={W} y1={y} y2={y} />
                    <text x="4" y={y - 4} fontSize="11" fill="#94a3b8">{pctMark}%</text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"   stopColor="#2170e4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2170e4" stopOpacity="0"    />
                </linearGradient>
              </defs>

              <path className="perf-area-path" d={areaPath} fill="url(#chartGradient)" />
              <path className="perf-line-path" d={linePath} fill="none" stroke="#0058be" strokeLinecap="round" strokeWidth="4" />

              {/* Hover crosshair */}
              {hoverPoint && (
                <line x1={hoverPoint.x} x2={hoverPoint.x} y1={PAD_TOP} y2={H - PAD_BOTTOM} stroke="#0058be" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              )}

              {dotPositions.map((d, i) => (
                <circle
                  key={i}
                  className={`perf-dot ${hoverIdx === i ? "is-active" : ""}`}
                  cx={d.x}
                  cy={d.y}
                  fill="#0058be"
                  r="6"
                  stroke="white"
                  strokeWidth="2"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              ))}
            </svg>

            {/* Floating tooltip */}
            {hoverPoint && hoverLabel && (
              <div
                className="absolute pointer-events-none bg-on-surface dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap -translate-x-1/2"
                style={{
                  left: `${(hoverPoint.x / W) * 100}%`,
                  top: `${Math.max(0, (hoverPoint.y / H) * 100 - 18)}%`,
                }}
              >
                {MONTH_LABELS_FULL[hoverLabel.month]} {hoverLabel.year}
                <span className="block text-sm">{hoverLabel.pct}%</span>
              </div>
            )}
          </div>

          {/* X-axis month labels */}
          <div className="flex justify-between px-1 flex-shrink-0 overflow-x-auto">
            {monthLabels.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className={`pc-month-label font-semibold whitespace-nowrap cursor-pointer
                  ${i === hoverIdx || (hoverIdx == null && i === monthLabels.length - 1)
                    ? "text-primary font-bold underline underline-offset-4"
                    : "text-on-surface-variant dark:text-slate-400"
                  }`}
                onMouseEnter={() => setHoverIdx(i)}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Subjects view */}
          {subjectStats.length > 0 && (
            <div className="pt-2 border-t border-outline-variant/10 dark:border-slate-700/40 flex-shrink-0">
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant dark:text-slate-400 mb-1.5">
                Subjects view
              </p>
              <div className="flex flex-wrap gap-1.5">
                {subjectStats.map((s, i) => {
                  const c = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                  return (
                    <div key={s.name} className={`pc-subject-pill flex items-center gap-1.5 px-2 py-1 rounded-lg ${c.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      <span className="text-[10px] sm:text-xs text-on-surface-variant dark:text-slate-400 truncate max-w-[70px]">{s.name}</span>
                      <span className={`text-[10px] sm:text-xs font-bold ${c.text}`}>{s.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;