import React from "react";

/**
 * Per-question mark entry with a running total.
 *
 * A blank field means "not marked yet" and is deliberately distinct from 0 —
 * the hook filters blanks out of the payload so an untouched question is never
 * silently awarded zero.
 */
export default function MarkSchemePanel({
  questions,
  marks,
  comments,
  feedback,
  totalAwarded,
  totalAvailable,
  onMarkChange,
  onCommentChange,
  onFeedbackChange,
  onCreateScheme,
  disabled,
}) {
  if (!questions.length) {
    return (
      <div className="p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-outline">
          rule
        </span>
        <p className="mt-2 text-sm font-semibold text-on-surface">
          No mark scheme yet
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          This assignment needs a mark scheme before it can be marked.
        </p>
        {onCreateScheme && (
          <button
            onClick={onCreateScheme}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
          >
            Create mark scheme
          </button>
        )}
      </div>
    );
  }

  const pct = totalAvailable > 0 ? (totalAwarded / totalAvailable) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Running total */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-baseline justify-between">
          <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
            Total
          </span>
          <span className="text-xs text-on-surface-variant">
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-on-surface tabular-nums">
            {Number.isInteger(totalAwarded) ? totalAwarded : totalAwarded.toFixed(1)}
          </span>
          <span className="text-lg text-on-surface-variant">
            / {totalAvailable}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
        {questions.map((q) => {
          const value = marks[q.id] ?? "";
          const numeric = parseFloat(value);
          const over = Number.isFinite(numeric) && numeric > parseFloat(q.max_marks);
          const unmarked = value === "";

          return (
            <div key={q.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-on-surface shrink-0">
                    {q.label}
                  </span>
                  {unmarked && (
                    <span className="text-2xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant shrink-0">
                      unmarked
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    max={q.max_marks}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onMarkChange(q.id, e.target.value)}
                    aria-label={`Marks for question ${q.label}`}
                    className={`w-16 px-2 py-1 text-right text-sm font-semibold rounded-md bg-surface-container-lowest border tabular-nums
                      ${over ? "border-error text-error" : "border-outline-variant text-on-surface"}
                      focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50`}
                  />
                  <span className="text-sm text-on-surface-variant tabular-nums">
                    / {q.max_marks}
                  </span>
                </div>
              </div>

              {over && (
                <p className="mt-1 text-xs text-error">
                  Above the {q.max_marks} available for this question.
                </p>
              )}

              {q.guidance && (
                <p className="mt-2 text-xs text-on-surface-variant whitespace-pre-line">
                  {q.guidance}
                </p>
              )}

              <input
                type="text"
                placeholder="Comment (optional)"
                value={comments[q.id] ?? ""}
                disabled={disabled}
                onChange={(e) => onCommentChange(q.id, e.target.value)}
                aria-label={`Comment for question ${q.label}`}
                className="mt-2 w-full px-2 py-1.5 text-xs rounded-md bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              />
            </div>
          );
        })}
      </div>

      {/* Overall feedback */}
      <div className="p-4 border-t border-outline-variant">
        <label
          htmlFor="general-feedback"
          className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant"
        >
          Overall feedback
        </label>
        <textarea
          id="general-feedback"
          rows={3}
          value={feedback}
          disabled={disabled}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="Feedback for the student…"
          className="mt-2 w-full px-3 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
