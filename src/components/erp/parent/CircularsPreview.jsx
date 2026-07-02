// src/components/erp/parent/CircularsPreview.jsx

import { Link } from "react-router-dom";
import { useParent } from "../../../context/ParentProvider";

// Same audience set as Circulars.jsx, just icon+color instead of a plain dot
const AUDIENCE_META = {
  Student: { icon: "school", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  Parent:  { icon: "family_restroom", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  Teacher: { icon: "person", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
  All:     { icon: "campaign", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
};

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

const CircularsPreview = () => {
  const { circulars = [], loading, childDataLoading } = useParent();
  const items = circulars.slice(0, 3);

  const isLoading = loading || childDataLoading;
  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className="relative overflow-hidden h-full min-h-[280px] sm:min-h-[320px] bg-surface-container-lowest dark:bg-slate-800/60 rounded-xl border border-outline-variant/5 dark:border-slate-700/40 flex flex-col p-4 sm:p-5 transition-shadow hover:shadow-md">
      <style>{`
        @keyframes circFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes circTwinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        .circ-illustration { animation: circFloat 4s ease-in-out infinite; }
        .circ-sparkle-1 { animation: circTwinkle 2.4s ease-in-out infinite; }
        .circ-sparkle-2 { animation: circTwinkle 2.4s ease-in-out 0.6s infinite; }
        .circ-sparkle-3 { animation: circTwinkle 2.4s ease-in-out 1.2s infinite; }
        .circ-arrow-btn { transition: transform 0.15s ease, background-color 0.15s ease; }
        .circ-arrow-btn:hover { transform: translateX(2px); }
      `}</style>

      {/* Decorative background — purely visual, matches header treatment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute left-4 bottom-16 opacity-30 dark:opacity-10" width="70" height="55" viewBox="0 0 70 55" fill="none">
          {Array.from({ length: 4 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 15 + 4} cy={row * 14 + 4} r="1.8" className="fill-indigo-300 dark:fill-slate-600" />
            )),
          )}
        </svg>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border border-indigo-100 dark:border-slate-700" />
        <div className="absolute -right-2 -bottom-2 w-24 h-24 rounded-full border border-indigo-100 dark:border-slate-700" />
      </div>

      {/* Header */}
      <div className="relative flex items-start gap-2.5 mb-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary dark:text-blue-400 text-lg">campaign</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold font-headline text-on-surface dark:text-white mb-0.5 truncate">
            Circulars
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-400 truncate">
            Official announcements and updates
          </p>
        </div>
        {!isLoading && items.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
              {items.length} new
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-3/4 bg-surface-container-low dark:bg-slate-700 rounded" />
                <div className="h-2.5 w-1/2 bg-surface-container-low dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-1">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-700/40 dark:to-slate-700/10" />
              <span
                className="circ-illustration material-symbols-outlined relative text-primary dark:text-blue-400 text-5xl sm:text-6xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                campaign
              </span>
              <span className="circ-sparkle-1 absolute -top-1 right-2 material-symbols-outlined text-purple-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="circ-sparkle-2 absolute bottom-3 -left-3 material-symbols-outlined text-purple-300 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="circ-sparkle-3 absolute top-2 -left-4 w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-slate-500" />
              <span className="circ-sparkle-2 absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-slate-500" />
            </div>
            <p className="text-sm font-semibold text-on-surface dark:text-slate-200">
              No circulars yet
            </p>
            <p className="text-xs text-on-surface-variant/70 dark:text-slate-500">
              Check back later for updates
            </p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {items.map((c) => {
              const meta = AUDIENCE_META[c.target_audience_display] || AUDIENCE_META.All;
              return (
                <div
                  key={c.id}
                  className="flex items-start gap-2.5 group hover:bg-surface-container-low dark:hover:bg-slate-700/30 hover:translate-x-0.5 -mx-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg} group-hover:scale-105 transition-transform`}>
                    <span className={`material-symbols-outlined text-sm ${meta.text}`}>{meta.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-on-surface dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-primary dark:group-hover:text-primary-400 transition-colors">
                      {c.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-2xs sm:text-xs text-on-surface-variant/60 dark:text-slate-500">
                        {daysAgo(c.created_at)}
                      </p>
                      {c.target_audience_display && (
                        <span className="text-2xs px-1.5 py-0.5 rounded-full bg-surface-container-low dark:bg-slate-700 text-on-surface-variant/70 dark:text-slate-400">
                          {c.target_audience_display}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative flex justify-between items-center mt-4 pt-3 border-t border-outline-variant/10 dark:border-slate-700/40 flex-shrink-0">
        <Link
          to="/parent/circulars"
          className="text-xs sm:text-sm font-semibold text-primary dark:text-primary-400 hover:text-primary/80 dark:hover:text-primary-300 hover:underline transition-colors inline-flex items-center gap-1"
        >
          View All Circulars
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>

        {!isLoading && items.length > 0 ? (
          <span className="text-2xs sm:text-xs text-on-surface-variant/50 dark:text-slate-500">
            {items.length} of {circulars.length}
          </span>
        ) : (
          <Link
            to="/parent/circulars"
            className="circ-arrow-btn w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center flex-shrink-0"
            aria-label="View all circulars"
          >
            <span className="material-symbols-outlined text-primary dark:text-blue-400 text-lg">chevron_right</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default CircularsPreview;