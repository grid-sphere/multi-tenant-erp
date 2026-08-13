import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MainLayout from "../../components/erp/teacher/MainLayout";
import markingApi from "../../services/markingApi";

/**
 * Marking progress across assignments.
 *
 * The server decides scope: staff see the whole school, a teacher sees their
 * own work. The same page serves both, so there is one place to look rather
 * than a teacher view and an admin view that drift apart.
 */
export default function MarkingProgressPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlyPending, setOnlyPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    markingApi
      .getProgress()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e?.response?.data?.detail || "Could not load marking progress."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <MainLayout title="Marking Progress">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Marking Progress">
        <div className="max-w-md mx-auto mt-12 text-center">
          <span className="material-symbols-outlined text-5xl text-error">
            error
          </span>
          <p className="mt-3 text-sm font-semibold text-on-surface">{error}</p>
        </div>
      </MainLayout>
    );
  }

  const totals = data?.totals || {};
  const rows = (data?.assignments || []).filter((a) =>
    onlyPending ? a.pending > 0 : true
  );

  return (
    <MainLayout title="Marking Progress">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-on-surface">
              Marking progress
            </h2>
            <p className="text-xs text-on-surface-variant">
              {data?.scope === "school"
                ? "All assignments in the school"
                : "Your assignments"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
                className="accent-primary"
              />
              Only show outstanding
            </label>
            {/* This page is the marking entry point now, so it needs a route
                straight to the work rather than only reporting on it. */}
            <button
              onClick={() => navigate("/teacher/submissions/pending")}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[16px]">
                rate_review
              </span>
              Start marking
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Submitted" value={totals.submitted ?? 0} />
          <Stat label="Marked" value={totals.marked ?? 0} tone="success" />
          <Stat label="Outstanding" value={totals.pending ?? 0} tone="warning" />
          <Stat
            label="No mark scheme"
            value={totals.blocked_no_scheme ?? 0}
            tone={totals.blocked_no_scheme ? "error" : undefined}
            // Distinct from "behind": these cannot be marked at all yet.
            hint="Has submissions but no mark scheme"
          />
        </div>

        {/* Assignments */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline">
                task_alt
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                {onlyPending ? "Nothing outstanding." : "No assignments yet."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {rows.map((a) => {
                const blocked = a.submitted > 0 && !a.has_mark_scheme;
                return (
                  <li key={a.assignment_id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">
                          {a.title}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {a.subject} · {a.section}
                          {data?.scope === "school" ? ` · ${a.teacher}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {blocked ? (
                          <button
                            onClick={() =>
                              navigate(
                                `/teacher/assignments/${a.assignment_id}/mark-scheme`
                              )
                            }
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-error/10 text-error hover:bg-error/20"
                          >
                            Add mark scheme
                          </button>
                        ) : (
                          <span className="text-xs tabular-nums text-on-surface-variant">
                            {a.marked} / {a.submitted}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/teacher/assignments/${a.assignment_id}`)
                          }
                          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container"
                          aria-label={`Open ${a.title}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </div>

                    {a.submitted > 0 && !blocked && (
                      <div className="mt-2 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            a.percent === 100 ? "bg-success" : "bg-primary"
                          }`}
                          style={{ width: `${a.percent ?? 0}%` }}
                        />
                      </div>
                    )}

                    {a.submitted === 0 && (
                      <p className="mt-1 text-xs text-outline">
                        No submissions yet.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function Stat({ label, value, tone, hint }) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "error"
          ? "text-error"
          : "text-on-surface";
  return (
    <div
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
      title={hint}
    >
      <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <p className={`mt-0.5 text-2xl font-bold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
