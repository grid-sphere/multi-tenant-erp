import React from "react";

const CONFIDENCE_STYLE = {
  high: "bg-success/15 text-success",
  medium: "bg-warning/15 text-warning",
  low: "bg-error/15 text-error",
};

/**
 * Reports what the model proposed, and how much to trust it.
 *
 * Deliberately loud about uncertainty: low confidence, unreadable pages and
 * questions the model skipped are the cases where a teacher must look
 * properly, and they are easy to miss if the marks simply appear in the boxes.
 */
export default function AiSuggestionBar({
  result,
  applying,
  totalAvailable = 0,
  currentTotal = null,
  onApply,
  onDismiss,
}) {
  if (!result) return null;

  const { suggestions = [], legibility, unreadable_pages: unreadable = [] } = result;
  const lowConfidence = suggestions.filter((s) => s.confidence === "low");
  const clamped = suggestions.filter((s) => s.was_clamped);
  const missing = result.missing_questions || [];

  // What the model would award in total, and how much of the paper that
  // actually covers — a total of 12/20 means something quite different if
  // three questions were skipped entirely.
  const suggestedTotal = suggestions.reduce(
    (sum, s) => sum + (Number(s.marks_awarded) || 0),
    0
  );
  const coveredMax = suggestions.reduce(
    (sum, s) => sum + (Number(s.max_marks) || 0),
    0
  );
  const percent = totalAvailable > 0 ? (suggestedTotal / totalAvailable) * 100 : 0;
  const partial = missing.length > 0;

  const showsDelta =
    currentTotal !== null && Number(currentTotal) !== suggestedTotal;
  const delta = suggestedTotal - Number(currentTotal || 0);

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">
              auto_awesome
            </span>
            {suggestions.length} suggested mark
            {suggestions.length === 1 ? "" : "s"} from {result.model}
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Read {result.pages_read} page{result.pages_read === 1 ? "" : "s"}.
            Nothing is saved until you review and complete.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            Discard
          </button>
          <button
            onClick={onApply}
            disabled={applying || suggestions.length === 0}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {applying ? "Filling…" : "Fill the marks"}
          </button>
        </div>
      </div>

      {/* Headline total — the number a teacher wants first */}
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
              AI would award
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-on-surface tabular-nums">
                {Number.isInteger(suggestedTotal)
                  ? suggestedTotal
                  : suggestedTotal.toFixed(1)}
              </span>
              <span className="text-lg text-on-surface-variant">
                / {totalAvailable}
              </span>
              <span className="text-xs text-on-surface-variant ml-1">
                {percent.toFixed(0)}%
              </span>
            </div>
          </div>

          {showsDelta && (
            <span className="text-xs text-on-surface-variant">
              You currently have{" "}
              <strong className="text-on-surface tabular-nums">
                {currentTotal}
              </strong>
              {" · "}
              <span
                className={delta > 0 ? "text-success" : "text-error"}
              >
                {delta > 0 ? "+" : ""}
                {Number.isInteger(delta) ? delta : delta.toFixed(1)}
              </span>
            </span>
          )}
        </div>

        <div className="mt-2 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>

        {partial && (
          <p className="mt-2 text-xs text-warning">
            Covers {coveredMax} of {totalAvailable} marks — {missing.length}{" "}
            question{missing.length === 1 ? "" : "s"} not marked by the AI, so
            this total is incomplete.
          </p>
        )}
      </div>

      {/* Anything that warrants a closer look */}
      {(legibility === "poor" ||
        legibility === "mixed" ||
        unreadable.length > 0 ||
        lowConfidence.length > 0 ||
        clamped.length > 0 ||
        missing.length > 0) && (
        <ul className="space-y-1 text-xs text-on-surface-variant">
          {legibility && legibility !== "good" && legibility !== "unknown" && (
            <li className="flex gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-warning shrink-0">
                warning
              </span>
              Handwriting reported as <strong>{legibility}</strong> — check these
              marks carefully.
            </li>
          )}
          {unreadable.length > 0 && (
            <li className="flex gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-warning shrink-0">
                visibility_off
              </span>
              Could not read page{unreadable.length === 1 ? "" : "s"}{" "}
              {unreadable.join(", ")}.
            </li>
          )}
          {lowConfidence.length > 0 && (
            <li className="flex gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-error shrink-0">
                priority_high
              </span>
              Low confidence on{" "}
              {lowConfidence.map((s) => s.label).join(", ")}.
            </li>
          )}
          {clamped.length > 0 && (
            <li className="flex gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-warning shrink-0">
                content_cut
              </span>
              Proposed more than the maximum on{" "}
              {clamped.map((s) => s.label).join(", ")} — capped.
            </li>
          )}
          {missing.length > 0 && (
            <li className="flex gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-warning shrink-0">
                help
              </span>
              No suggestion for {missing.join(", ")} — mark these yourself.
            </li>
          )}
        </ul>
      )}

      {/* Per-question detail */}
      <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface-container-lowest">
        {suggestions.map((s) => (
          <li key={s.question} className="px-3 py-2 flex items-start gap-3">
            <span className="text-xs font-bold text-on-surface w-8 shrink-0">
              {s.label}
            </span>
            <span className="text-xs tabular-nums text-on-surface w-14 shrink-0">
              {s.marks_awarded} / {s.max_marks}
            </span>
            <span
              className={`text-2xs font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                CONFIDENCE_STYLE[s.confidence] || CONFIDENCE_STYLE.medium
              }`}
            >
              {s.confidence}
            </span>
            <span className="text-xs text-on-surface-variant min-w-0">
              {s.comment}
            </span>
          </li>
        ))}
      </ul>

      {result.overall_comment && (
        <p className="text-xs text-on-surface-variant italic">
          {result.overall_comment}
        </p>
      )}
    </div>
  );
}
