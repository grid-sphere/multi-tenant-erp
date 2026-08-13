import React, { useEffect, useState } from "react";
import markingApi from "../../../services/markingApi";

/**
 * Read-only view of a returned, marked script.
 *
 * Shared by the student and parent portals — only the surrounding layout
 * differs, so the fetching, access handling and presentation live here once.
 *
 * The server withholds everything until the teacher has returned the work, so
 * `available: false` is a normal state rather than an error: a student seeing
 * a partial total mid-marking would be worse than seeing nothing.
 */
export default function MarkedScriptView({ submissionId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    markingApi
      .getMarkedScript(submissionId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e?.response?.status === 403
            ? "You do not have access to this work."
            : e?.response?.data?.detail || "Could not load this marked work."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Notice icon="lock" title={error}>
        {onBack && <BackButton onBack={onBack} />}
      </Notice>
    );
  }

  if (!data?.available) {
    return (
      <Notice
        icon="hourglass_top"
        title="Not marked yet"
        body={
          data?.assignment
            ? `"${data.assignment.title}" has been submitted but your teacher has not returned it yet.`
            : "This work has not been returned yet."
        }
      >
        {onBack && <BackButton onBack={onBack} />}
      </Notice>
    );
  }

  const pct =
    data.total_available > 0
      ? (data.total_awarded / data.total_available) * 100
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Back
            </button>
          )}
          <h2 className="mt-1 text-xl font-bold text-on-surface truncate">
            {data.assignment.title}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {data.assignment.subject}
            {data.marker_name ? ` · Marked by ${data.marker_name}` : ""}
            {data.returned_at
              ? ` · ${new Date(data.returned_at).toLocaleDateString()}`
              : ""}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-3xl font-bold text-on-surface tabular-nums">
              {data.total_awarded ?? "—"}
            </span>
            <span className="text-lg text-on-surface-variant">
              / {data.total_available}
            </span>
          </div>
          <span className="text-xs text-on-surface-variant">
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Teacher feedback */}
      {data.general_feedback && (
        <div className="rounded-xl border border-outline-variant bg-primary-fixed/40 p-4">
          <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
            Feedback
          </span>
          <p className="mt-1 text-sm text-on-surface whitespace-pre-line">
            {data.general_feedback}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
        {/* The marked script */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant bg-surface-container-low">
            <span className="text-xs font-semibold text-on-surface">
              Your marked work
            </span>
            {data.annotated_url && (
              <a
                href={data.annotated_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80"
              >
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>
                Download
              </a>
            )}
          </div>

          {data.annotated_url ? (
            <object
              data={data.annotated_url}
              type="application/pdf"
              className="w-full h-[70vh] min-h-[420px]"
              aria-label="Marked script"
            >
              <div className="p-8 text-center">
                <p className="text-sm text-on-surface-variant">
                  This browser cannot show PDFs inline.
                </p>
                <a
                  href={data.annotated_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
                >
                  Open the marked script
                </a>
              </div>
            </object>
          ) : (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-outline">
                draft
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                No annotated copy was attached.
              </p>
              {data.original_url && (
                <a
                  href={data.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
                >
                  View your original submission
                </a>
              )}
            </div>
          )}
        </div>

        {/* Per-question breakdown */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
            <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
              Breakdown
            </span>
          </div>

          {data.question_breakdown?.length ? (
            <ul className="divide-y divide-outline-variant">
              {data.question_breakdown.map((q) => {
                const share =
                  q.max_marks > 0 ? (q.marks_awarded / q.max_marks) * 100 : 0;
                return (
                  <li key={q.label} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-on-surface">
                        {q.label}
                      </span>
                      <span className="text-sm tabular-nums text-on-surface">
                        {q.marks_awarded}
                        <span className="text-on-surface-variant">
                          {" "}
                          / {q.max_marks}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-surface-container-highest overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          share >= 70
                            ? "bg-success"
                            : share >= 40
                              ? "bg-warning"
                              : "bg-error"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                      />
                    </div>
                    {q.comment && (
                      <p className="mt-1.5 text-xs text-on-surface-variant">
                        {q.comment}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-4 text-xs text-on-surface-variant">
              No question breakdown was recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Notice({ icon, title, body, children }) {
  return (
    <div className="max-w-md mx-auto mt-12 text-center">
      <span className="material-symbols-outlined text-5xl text-outline">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold text-on-surface">{title}</p>
      {body && (
        <p className="mt-1 text-xs text-on-surface-variant">{body}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
    >
      Go back
    </button>
  );
}
