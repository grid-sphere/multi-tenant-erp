// src/components/erp/parent/AIInsights.jsx

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useParent } from "../../../context/ParentProvider";

// Visual theme per recommendation type — purely presentational
const REC_THEME = {
  improve: { icon: "trending_up", bg: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400" },
  maintain: { icon: "verified", bg: "bg-emerald-50 dark:bg-emerald-900/20", iconBg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400" },
  practice: { icon: "task_alt", bg: "bg-purple-50 dark:bg-purple-900/20", iconBg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400" },
};

const AIInsights = () => {
  const { activeChild, dashboard, gradesFlat } = useParent();
  const navigate = useNavigate();

  const { topSubject, topPct, weakestSubject, checklist, recommendations } = useMemo(() => {
    const grades = Array.isArray(gradesFlat) ? gradesFlat : [];
    const withScores = grades.filter((g) => g.marks_obtained != null && g.max_marks != null && g.subject_name);
    if (!withScores.length) {
      return { topSubject: null, topPct: null, weakestSubject: null, checklist: [], recommendations: [] };
    }

    // Average per subject so recommendations reflect overall standing, not one exam
    const bySubject = {};
    withScores.forEach((g) => {
      const key = g.subject_name;
      if (!bySubject[key]) bySubject[key] = { obtained: 0, max: 0 };
      bySubject[key].obtained += parseFloat(g.marks_obtained || 0);
      bySubject[key].max += parseFloat(g.max_marks || 0);
    });
    const subjectAverages = Object.entries(bySubject)
      .map(([name, v]) => ({ name, pct: v.max > 0 ? Math.round((v.obtained / v.max) * 100) : 0 }))
      .sort((a, b) => b.pct - a.pct);

    const top = subjectAverages[0];
    const bottom = subjectAverages[subjectAverages.length - 1];
    const weakest = bottom.name !== top.name ? bottom : null;
    const middleSubject =
      subjectAverages.length > 2 ? subjectAverages[Math.floor(subjectAverages.length / 2)] : null;

    const items = [];
    if (dashboard?.attendance?.status) {
      items.push(`Attendance status: ${dashboard.attendance.status}`);
    }
    items.push(`${withScores.length} grade${withScores.length > 1 ? "s" : ""} recorded so far`);

    const recs = [];
    if (weakest) {
      recs.push({
        type: "improve",
        title: `Improve ${weakest.name} score`,
        desc: "Focus on grammar and writing skills",
      });
    }
    recs.push({
      type: "maintain",
      title: `Maintain ${top.name} performance`,
      desc: "Keep up the excellent work!",
    });
    if (middleSubject && middleSubject.name !== top.name && middleSubject.name !== weakest?.name) {
      recs.push({
        type: "practice",
        title: `Practice ${middleSubject.name} weekly`,
        desc: "Increase problem solving practice",
      });
    }

    return {
      topSubject: top.name,
      topPct: top.pct,
      weakestSubject: weakest?.name || null,
      checklist: items,
      recommendations: recs,
    };
  }, [gradesFlat, dashboard]);

  const name = activeChild?.name?.split(" ")[0] || "Your child";

  return (
    <div className="font-body ai-insight-card h-full min-h-[220px] sm:min-h-[260px] bg-surface-container-lowest dark:bg-slate-800/60 rounded-lg border-2 border-primary/5 dark:border-slate-700/40 relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <style>{`
        .ai-insight-card {
          container-type: inline-size;
          container-name: aicard;
          padding: 0.625rem;
          gap: 0.375rem;
        }
        .ai-insight-card .ai-bg-icon { padding: 0.375rem; animation: aiFloat 4s ease-in-out infinite; }
        .ai-insight-card .ai-bg-icon .material-symbols-outlined { font-size: 1.5rem; }
        .ai-insight-card .ai-header { gap: 0.375rem; }
        .ai-insight-card .ai-header-icon-wrap { padding: 0.25rem; transition: transform 0.2s ease; }
        .ai-insight-card:hover .ai-header-icon-wrap { transform: scale(1.1) rotate(-4deg); }
        .ai-insight-card .ai-header-icon-wrap .material-symbols-outlined { font-size: 0.875rem; }
        .ai-insight-card .ai-title { font-size: 0.8125rem; }
        .ai-insight-card .ai-quote { padding: 0.375rem; transition: background-color 0.2s ease; }
        .ai-insight-card .ai-quote p { font-size: 0.6875rem; }
        .ai-insight-card .ai-checklist { font-size: 0.6875rem; }
        .ai-insight-card .ai-checklist li { gap: 0.3125rem; }
        .ai-insight-card .ai-checklist li + li { margin-top: 0.3125rem; }
        .ai-insight-card .ai-checklist .material-symbols-outlined { font-size: 0.75rem; }
        .ai-insight-card .ai-rec-title { font-size: 0.625rem; }
        .ai-insight-card .ai-rec-desc { font-size: 0.5625rem; }
        .ai-insight-card .ai-rec-card { padding: 0.375rem; gap: 0.375rem; }
        .ai-insight-card .ai-rec-icon { padding: 0.25rem; }
        .ai-insight-card .ai-rec-icon .material-symbols-outlined { font-size: 0.75rem; }
        .ai-insight-card .ai-button { font-size: 0.625rem; padding: 0.375rem 0.5rem; }

        @keyframes aiFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .ai-rec-card { transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: default; }
        .ai-rec-card:hover { transform: translateX(2px); box-shadow: 0 4px 10px rgba(0,0,0,0.06); }

        @container aicard (min-width: 250px) {
          .ai-insight-card { padding: 0.75rem; gap: 0.5rem; }
          .ai-insight-card .ai-bg-icon { padding: 0.5rem; }
          .ai-insight-card .ai-bg-icon .material-symbols-outlined { font-size: 2.25rem; }
          .ai-insight-card .ai-header { gap: 0.5rem; }
          .ai-insight-card .ai-header-icon-wrap { padding: 0.375rem; }
          .ai-insight-card .ai-header-icon-wrap .material-symbols-outlined { font-size: 1rem; }
          .ai-insight-card .ai-title { font-size: 0.875rem; }
          .ai-insight-card .ai-quote { padding: 0.5rem; }
          .ai-insight-card .ai-quote p { font-size: 0.75rem; }
          .ai-insight-card .ai-checklist { font-size: 0.75rem; }
          .ai-insight-card .ai-checklist li { gap: 0.375rem; }
          .ai-insight-card .ai-checklist li + li { margin-top: 0.375rem; }
          .ai-insight-card .ai-checklist .material-symbols-outlined { font-size: 0.875rem; }
          .ai-insight-card .ai-rec-title { font-size: 0.6875rem; }
          .ai-insight-card .ai-rec-desc { font-size: 0.625rem; }
          .ai-insight-card .ai-rec-card { padding: 0.5rem; gap: 0.5rem; }
          .ai-insight-card .ai-rec-icon { padding: 0.3125rem; }
          .ai-insight-card .ai-rec-icon .material-symbols-outlined { font-size: 0.875rem; }
          .ai-insight-card .ai-button { font-size: 0.6875rem; padding: 0.5rem 0.5rem; }
        }

        @container aicard (min-width: 320px) {
          .ai-insight-card { padding: 0.875rem; gap: 0.625rem; }
          .ai-insight-card .ai-bg-icon .material-symbols-outlined { font-size: 2.75rem; }
          .ai-insight-card .ai-title { font-size: 0.9375rem; }
          .ai-insight-card .ai-button { font-size: 0.75rem; }
        }
      `}</style>

      <div className="ai-bg-icon absolute top-0 right-0 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          psychology
        </span>
      </div>

      <div className="ai-header flex items-center justify-between flex-shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="ai-header-icon-wrap bg-tertiary-fixed dark:bg-purple-900/30 rounded-md flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary dark:text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <h3 className="font-headline ai-title font-bold text-on-surface dark:text-white leading-tight min-w-0 truncate">
            AI Insight Alert
          </h3>
        </div>
        <button
          onClick={() => navigate("/parent/ai-insights")}
          className="flex-shrink-0 p-1 rounded-full text-on-surface-variant dark:text-slate-400
                     hover:bg-surface-container-low dark:hover:bg-slate-700 hover:text-primary
                     transition-colors"
          title="Insight settings"
        >
          <span className="material-symbols-outlined text-sm">settings</span>
        </button>
      </div>

      <div className="ai-quote bg-tertiary/5 dark:bg-purple-900/20 hover:bg-tertiary/10 dark:hover:bg-purple-900/30 rounded-lg border-l-4 border-tertiary dark:border-purple-500 flex-shrink-0">
        <p className="text-on-surface dark:text-slate-200 font-medium leading-relaxed">
          {topSubject ? (
            <>
              "{name} is performing strongly in{" "}
              <span className="text-tertiary dark:text-purple-300 font-bold">{topSubject}</span>
              , currently at {topPct}%.
              {weakestSubject ? ` Extra focus on ${weakestSubject} could help bring up the overall average.` : ""}"
            </>
          ) : (
            `"Not enough grade data yet for ${name} to generate an insight."`
          )}
        </p>
      </div>

      {recommendations.length > 0 && (
        <div className="flex-shrink-0">
          <p className="text-3xs sm:text-2xs font-semibold text-on-surface-variant dark:text-slate-400 mb-1">
            Smart Recommendations
          </p>
          <div className="flex flex-col gap-1">
            {recommendations.map((rec, i) => {
              const theme = REC_THEME[rec.type];
              return (
                <div key={i} className={`ai-rec-card flex items-start rounded-md ${theme.bg}`}>
                  <div className={`ai-rec-icon rounded flex-shrink-0 ${theme.iconBg}`}>
                    <span className={`material-symbols-outlined ${theme.text}`}>{theme.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="ai-rec-title font-semibold text-on-surface dark:text-slate-200 leading-tight">
                      {rec.title}
                    </p>
                    <p className="ai-rec-desc text-on-surface-variant dark:text-slate-400 leading-tight mt-0.5">
                      {rec.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ul className="ai-checklist flex-1 flex flex-col text-on-surface-variant dark:text-slate-400 min-h-0">
        {checklist.length ? (
          checklist.map((item, i) => (
            <li key={i} className="flex items-start">
              <span className="material-symbols-outlined text-tertiary dark:text-purple-400 mt-0.5 flex-shrink-0">
                check_circle
              </span>
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="flex items-start">
            <span className="material-symbols-outlined text-tertiary dark:text-purple-400 mt-0.5 flex-shrink-0">info</span>
            <span>Check back after more data is recorded.</span>
          </li>
        )}
      </ul>

      <button
        onClick={() => navigate("/parent/ai-insights")}
        className="ai-button w-full rounded-lg font-bold flex-shrink-0 leading-snug
                   bg-surface-container-high dark:bg-slate-700
                   text-primary dark:text-blue-300
                   hover:bg-primary hover:text-white hover:shadow-md
                   dark:hover:bg-blue-600 dark:hover:text-white
                   active:scale-95
                   transition-all"
      >
        View Detailed Insights
      </button>
    </div>
  );
};

export default AIInsights;