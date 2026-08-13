import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import MainLayout from "../../components/erp/teacher/MainLayout";
import useMarkSchemeEditor from "../../hooks/useMarkSchemeEditor";

/**
 * Mark scheme editor.
 *
 * The scheme total is pinned to the assignment's own maximum by the server, so
 * rather than letting a teacher type a total that can never save, this screen
 * treats the assignment maximum as the target and offers to change it when the
 * questions deliberately add up to something else.
 */
export default function MarkSchemeEditorPage() {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();

  const {
    assignment,
    assignmentMax,
    rows,
    sum,
    issues,
    canSave,
    loading,
    saving,
    error,
    hasExistingScheme,
    addRow,
    updateRow,
    removeRow,
    moveRow,
    distributeEvenly,
    generateFromAI,
    save,
    setAssignmentMax,
    reload,
    clearError,
  } = useMarkSchemeEditor(assignmentId);

  const [adjusting, setAdjusting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const chapter = window.prompt(
      "Which chapter is this assignment based on?\n\n" +
        "The rubric is drawn from ingested course content, so the name has to " +
        "match a chapter that has been ingested."
    );
    if (chapter === null || chapter.trim() === "") return;

    setGenerating(true);
    const progress = toast.loading("Drafting a mark scheme…");
    try {
      const count = await generateFromAI({ chapterName: chapter.trim() });
      toast.success(`Drafted ${count} criteria — review before saving`, {
        id: progress,
      });
    } catch (e) {
      toast.error(e.message, { id: progress });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      await save();
      toast.success("Mark scheme saved");
    } catch {
      /* error surfaced in the banner */
    }
  };

  const handleAdoptSum = async () => {
    setAdjusting(true);
    try {
      await setAssignmentMax(sum.toFixed(2));
      toast.success(`Assignment is now out of ${sum}`);
    } catch (e) {
      toast.error(
        e?.response?.data?.max_marks?.[0] ||
          "Could not change the assignment total."
      );
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Mark Scheme">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!assignment) {
    return (
      <MainLayout title="Mark Scheme">
        <div className="max-w-md mx-auto mt-12 text-center">
          <span className="material-symbols-outlined text-5xl text-error">
            error
          </span>
          <p className="mt-3 text-sm font-semibold text-on-surface">
            {error || "Assignment not found."}
          </p>
          <button
            onClick={reload}
            className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </MainLayout>
    );
  }

  const mismatch = issues.find((i) => i.mismatch);
  const blocking = issues.filter((i) => i.level === "error");

  return (
    <MainLayout title="Mark Scheme">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => navigate(`/teacher/assignments/${assignmentId}`)}
              className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Back to assignment
            </button>
            <h2 className="mt-1 text-xl font-bold text-on-surface truncate">
              {hasExistingScheme ? "Edit mark scheme" : "Create mark scheme"}
            </h2>
            <p className="text-xs text-on-surface-variant truncate">
              {assignment.title}
              {assignment.subject_name ? ` · ${assignment.subject_name}` : ""}
              {assignment.section_name ? ` · ${assignment.section_name}` : ""}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {saving ? "Saving…" : "Save mark scheme"}
          </button>
        </div>

        {/* Server error */}
        {error && (
          <div className="rounded-lg border border-error bg-error/10 p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">
              error
            </span>
            <p className="flex-1 text-xs text-on-surface">{error}</p>
            <button
              onClick={clearError}
              aria-label="Dismiss"
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Running total */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
                Questions total
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    mismatch ? "text-error" : "text-success"
                  }`}
                >
                  {Number.isInteger(sum) ? sum : sum.toFixed(2)}
                </span>
                <span className="text-sm text-on-surface-variant">
                  / {assignmentMax} available
                </span>
                {!mismatch && rows.length > 0 && (
                  <span className="material-symbols-outlined text-success text-[18px]">
                    check_circle
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                title="Draft criteria from ingested course content"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-fixed text-on-primary-fixed hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  auto_awesome
                </span>
                {generating ? "Drafting…" : "Draft with AI"}
              </button>
              <button
                onClick={distributeEvenly}
                disabled={!rows.length}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50"
              >
                Distribute evenly
              </button>
            </div>
          </div>

          {mismatch && (
            <div className="mt-3 pt-3 border-t border-outline-variant">
              <p className="text-xs text-on-surface-variant">
                {mismatch.text} The scheme has to match the assignment total
                before it can be saved.
              </p>
              <button
                onClick={handleAdoptSum}
                disabled={adjusting || sum <= 0}
                className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {adjusting
                  ? "Updating…"
                  : `Change the assignment to be out of ${
                      Number.isInteger(sum) ? sum : sum.toFixed(2)
                    }`}
              </button>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
              Questions
            </span>
            <span className="text-xs text-on-surface-variant">
              {rows.length} {rows.length === 1 ? "question" : "questions"}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-outline">
                playlist_add
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                No questions yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {rows.map((row, index) => {
                const marks = parseFloat(row.max_marks);
                const badMarks = row.max_marks !== "" && !(marks > 0);
                const duplicate =
                  row.label.trim() &&
                  rows.filter(
                    (r) => r.label.trim() === row.label.trim()
                  ).length > 1;

                return (
                  <li key={row.key} className="p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                        <button
                          onClick={() => moveRow(row.key, -1)}
                          disabled={index === 0}
                          aria-label={`Move question ${row.label || index + 1} up`}
                          className="p-0.5 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            keyboard_arrow_up
                          </span>
                        </button>
                        <button
                          onClick={() => moveRow(row.key, 1)}
                          disabled={index === rows.length - 1}
                          aria-label={`Move question ${row.label || index + 1} down`}
                          className="p-0.5 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            keyboard_arrow_down
                          </span>
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor={`label-${row.key}`}
                              className="text-2xs font-semibold uppercase tracking-wide text-on-surface-variant"
                            >
                              Label
                            </label>
                            <input
                              id={`label-${row.key}`}
                              type="text"
                              value={row.label}
                              placeholder="1a"
                              onChange={(e) =>
                                updateRow(row.key, { label: e.target.value })
                              }
                              className={`w-20 px-2 py-1 text-sm font-semibold rounded-md bg-surface-container-low border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40
                                ${duplicate ? "border-error" : "border-outline-variant"}`}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label
                              htmlFor={`marks-${row.key}`}
                              className="text-2xs font-semibold uppercase tracking-wide text-on-surface-variant"
                            >
                              Marks
                            </label>
                            <input
                              id={`marks-${row.key}`}
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              value={row.max_marks}
                              placeholder="10"
                              onChange={(e) =>
                                updateRow(row.key, { max_marks: e.target.value })
                              }
                              className={`w-20 px-2 py-1 text-sm text-right font-semibold rounded-md bg-surface-container-low border text-on-surface tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40
                                ${badMarks ? "border-error" : "border-outline-variant"}`}
                            />
                          </div>

                          <button
                            onClick={() => removeRow(row.key)}
                            aria-label={`Remove question ${row.label || index + 1}`}
                            className="ml-auto p-1.5 rounded-md text-on-surface-variant hover:bg-error/10 hover:text-error"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>

                        {duplicate && (
                          <p className="text-xs text-error">
                            Another question already uses this label.
                          </p>
                        )}

                        <textarea
                          rows={2}
                          value={row.guidance}
                          placeholder="Marking guidance (optional) — shown to the marker while marking"
                          onChange={(e) =>
                            updateRow(row.key, { guidance: e.target.value })
                          }
                          aria-label={`Guidance for question ${row.label || index + 1}`}
                          className="w-full px-2 py-1.5 text-xs rounded-md bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="p-3 border-t border-outline-variant">
            <button
              onClick={addRow}
              className="w-full py-2 text-xs font-semibold rounded-lg border border-dashed border-outline text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add question
            </button>
          </div>
        </div>

        {/* Blocking issues */}
        {blocking.length > 0 && (
          <ul className="space-y-1">
            {blocking.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[15px] text-error shrink-0">
                  info
                </span>
                {issue.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
