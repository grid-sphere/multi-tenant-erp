import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import MainLayout from "../../components/erp/teacher/MainLayout";
import MarkSchemePanel from "../../components/erp/teacher/marking/MarkSchemePanel";
import AnnotatableDocument from "../../components/erp/teacher/marking/AnnotatableDocument";
import AiSuggestionBar from "../../components/erp/teacher/marking/AiSuggestionBar";
import useMarkingSession from "../../hooks/useMarkingSession";
import useAnnotations from "../../hooks/useAnnotations";
import useMarkingQueue from "../../hooks/useMarkingQueue";
import markingApi from "../../services/markingApi";
import flattenAnnotations from "../../services/flattenAnnotations";

/**
 * On-screen marking.
 *
 * Annotatable document on the left, mark scheme on the right. No save button:
 * both marks and annotations autosave after a short idle, because marking
 * sessions run long and losing one means re-marking the whole script.
 */
export default function MarkSubmissionPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [returning, setReturning] = useState(false);

  const {
    session,
    questions,
    marks,
    comments,
    feedback,
    loading,
    error,
    saveState,
    conflict,
    totalAwarded,
    totalAvailable,
    unmarked,
    setMark,
    setComment,
    setGeneralFeedback,
    complete,
    reopen,
    reload,
    resolveConflictByReloading,
    syncVersion,
    saveDocumentMeta,
    version,
  } = useMarkingSession(submissionId);

  const isComplete = session?.marking?.status === "complete";
  const isReturned = session?.marking?.status === "returned";
  const locked = isComplete || isReturned || Boolean(conflict);

  const assignmentId = session?.submission?.assignment?.id;
  const queue = useMarkingQueue(assignmentId, submissionId);

  const goTo = useCallback(
    (row) => {
      if (!row) return;
      navigate(`/teacher/submissions/${row.submission_id}/mark`);
    },
    [navigate]
  );

  const annotationsApi = useAnnotations({
    submissionId,
    initial: session?.marking?.annotations || [],
    version,
    onVersion: syncVersion,
    // The server refuses annotations on a completed session, so don't let the
    // client queue writes it knows will bounce.
    enabled: !locked,
  });

  // Re-seed the annotation store whenever the session itself is reloaded.
  useEffect(() => {
    if (session?.marking) {
      annotationsApi.resetFrom(
        session.marking.annotations || [],
        session.marking.version
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.marking?.id, session?.submission?.id]);

  const handleDocumentMeta = useCallback(
    (meta) => saveDocumentMeta(meta),
    [saveDocumentMeta]
  );

  // ── AI mark suggestions ────────────────────────────────────────────────
  const pagesRendererRef = useRef(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    markingApi
      .getAiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus({ configured: false }));
  }, []);

  const capturePagesRenderer = useCallback((fn) => {
    pagesRendererRef.current = fn;
  }, []);

  /** Non-PDF submissions have no pdf.js renderer; inline the image instead. */
  const imageAsDataUrl = useCallback(async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const requestSuggestions = async () => {
    setAiBusy(true);
    const progress = toast.loading("Reading the script…");
    try {
      const render = pagesRendererRef.current;
      const images = render
        ? await render({ maxPages: aiStatus?.max_pages || 10 })
        : [await imageAsDataUrl(session.view_url)];

      if (!images.length) throw new Error("Nothing to read.");

      toast.loading("Marking…", { id: progress });
      const result = await markingApi.suggestMarks(submissionId, images);
      setAiResult(result);
      toast.success(
        `${result.suggestions.length} suggestion${result.suggestions.length === 1 ? "" : "s"} ready for review`,
        { id: progress }
      );
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ||
          Object.values(e?.response?.data || {})[0] ||
          e?.message ||
          "Could not get suggestions.",
        { id: progress }
      );
    } finally {
      setAiBusy(false);
    }
  };

  /**
   * Copy suggestions into the mark fields as an ordinary edit, so they flow
   * through the same autosave and validation as anything the teacher types.
   * They are still only a draft until Complete is pressed.
   */
  const applySuggestions = () => {
    (aiResult?.suggestions || []).forEach((s) => {
      setMark(s.question, String(s.marks_awarded));
      if (s.comment) setComment(s.question, s.comment);
    });
    if (aiResult?.overall_comment && !feedback) {
      setGeneralFeedback(aiResult.overall_comment);
    }
    setAiResult(null);
    toast.success("Filled in — review before completing");
  };

  const handleClearPage = useCallback(
    (page) => {
      const count = annotationsApi.annotations.filter((a) => a.page === page).length;
      if (!count) return;
      if (
        window.confirm(
          `Remove ${count} annotation${count === 1 ? "" : "s"} from page ${page + 1}?`
        )
      ) {
        annotationsApi.clearPage(page);
      }
    },
    [annotationsApi]
  );

  const handleReturn = async () => {
    setReturning(true);
    const progress = toast.loading("Preparing the marked script…");
    try {
      // Flush any queued annotations first, or the flattened PDF would be
      // built from a stale set and the student would receive a script missing
      // the last few marks.
      await annotationsApi.flush();

      const blob = await flattenAnnotations(
        session.view_url,
        session.submission.file_path,
        annotationsApi.annotations
      );

      toast.loading("Uploading…", { id: progress });
      const signed = await markingApi.getAnnotatedUploadUrl(submissionId);
      const put = await fetch(signed.upload_url, {
        method: "PUT",
        headers: { "Content-Type": signed.content_type },
        body: blob,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await markingApi.confirmAnnotatedUpload(submissionId, signed.file_path);
      await reload();
      toast.success("Returned to the student", { id: progress });
    } catch (e) {
      toast.error(
        e?.response?.data?.detail || e?.message || "Could not return the script.",
        { id: progress }
      );
    } finally {
      setReturning(false);
    }
  };

  const handleReopen = async () => {
    setReopening(true);
    try {
      await reopen();
      toast.success("Reopened for marking");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not reopen.");
    } finally {
      setReopening(false);
    }
  };

  const handleComplete = async () => {
    let allowPartial = false;

    if (unmarked.length > 0) {
      const labels = unmarked.map((q) => q.label).join(", ");
      const ok = window.confirm(
        `${unmarked.length} question${unmarked.length === 1 ? "" : "s"} ` +
          `not yet marked (${labels}).\n\n` +
          `Continue and treat ${unmarked.length === 1 ? "it" : "them"} as zero?`
      );
      if (!ok) return;
      allowPartial = true;
    }

    setCompleting(true);
    try {
      const data = await complete({ allowPartial });
      await queue.reload();

      // Continuous marking: land on the next script that still needs marks
      // rather than making the teacher go back to the list each time.
      const target = queue.nextPending;
      if (target) {
        toast.success(
          `${data.marking.total_awarded} / ${totalAvailable} · next: ${target.student.name}`
        );
        goTo(target);
      } else {
        toast.success(
          `Marked: ${data.marking.total_awarded} / ${totalAvailable} · batch complete`
        );
      }
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ||
          Object.values(e?.response?.data || {})[0] ||
          "Could not complete marking."
      );
    } finally {
      setCompleting(false);
    }
  };

  // Batch navigation shortcuts. Alt-arrows rather than bare arrows so they
  // never fight the annotation tools or a focused input.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!e.altKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(queue.next);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(queue.previous);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, queue.next, queue.previous]);

  if (loading) {
    return (
      <MainLayout title="Marking">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Marking">
        <div className="max-w-md mx-auto mt-12 text-center">
          <span className="material-symbols-outlined text-5xl text-error">
            error
          </span>
          <p className="mt-3 text-sm font-semibold text-on-surface">{error}</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={reload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
            >
              Try again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              Go back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const student = session?.submission?.student;
  const assignment = session?.submission?.assignment;

  return (
    <MainLayout title="Marking">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Back
            </button>
            <h2 className="mt-1 text-xl font-bold text-on-surface truncate">
              {student?.name}
            </h2>
            <p className="text-xs text-on-surface-variant truncate">
              {assignment?.title} · {assignment?.subject} ·{" "}
              {assignment?.section}
              {student?.enrollment_number ? ` · ${student.enrollment_number}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {queue.total > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goTo(queue.previous)}
                  disabled={!queue.previous}
                  title="Previous student (Alt+←)"
                  aria-label="Previous student"
                  className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span className="text-xs tabular-nums text-on-surface-variant">
                  {queue.position ?? "–"} / {queue.total}
                </span>
                <button
                  onClick={() => goTo(queue.next)}
                  disabled={!queue.next}
                  title="Next student (Alt+→)"
                  aria-label="Next student"
                  className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            )}

            <SaveIndicator state={saveState} />
            {isComplete || isReturned ? (
              <>
                <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success/15 text-success">
                  {isReturned ? "Returned" : "Marked"} · {totalAwarded} /{" "}
                  {totalAvailable}
                </span>
                <button
                  onClick={handleReturn}
                  disabled={returning}
                  title="Burn the annotations into a PDF and release it to the student"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
                >
                  {returning
                    ? "Working…"
                    : isReturned
                      ? "Re-send to student"
                      : "Return to student"}
                </button>
                <button
                  onClick={handleReopen}
                  disabled={reopening || returning}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                  {reopening ? "Reopening…" : "Reopen"}
                </button>
              </>
            ) : (
              <>
                {aiStatus?.configured && questions.length > 0 && (
                  <button
                    onClick={requestSuggestions}
                    disabled={aiBusy || locked}
                    title="A vision model reads the script and proposes marks for you to review"
                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-primary-fixed text-on-primary-fixed hover:opacity-90 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      auto_awesome
                    </span>
                    {aiBusy ? "Reading…" : "Suggest marks"}
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={completing || !questions.length || Boolean(conflict)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completing ? "Saving…" : "Complete marking"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI suggestions awaiting review — never applied automatically */}
        <AiSuggestionBar
          result={aiResult}
          applying={false}
          totalAvailable={totalAvailable}
          currentTotal={totalAwarded}
          onApply={applySuggestions}
          onDismiss={() => setAiResult(null)}
        />

        {/* Batch progress */}
        {queue.counts && queue.counts.total > 1 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${
                    queue.counts.total
                      ? (queue.counts.completed / queue.counts.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-xs text-on-surface-variant tabular-nums shrink-0">
              {queue.counts.completed} of {queue.counts.total} marked
            </span>
          </div>
        )}

        {/* Conflict banner — another marker touched this submission */}
        {(conflict || annotationsApi.conflict) && (
          <div className="rounded-lg border border-warning bg-warning/10 p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-warning text-[20px]">
                sync_problem
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface">
                  Someone else edited this submission
                </p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Your recent changes were not saved, so nothing of theirs was
                  overwritten. Reload to pick up their version and re-enter your
                  marks.
                </p>
                <button
                  onClick={resolveConflictByReloading}
                  className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-warning text-on-primary hover:opacity-90"
                >
                  Reload marking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden h-[calc(100vh-260px)] min-h-[420px]">
            <AnnotatableDocument
              viewUrl={session?.view_url}
              filePath={session?.submission?.file_path}
              annotations={annotationsApi.annotations}
              selectedId={annotationsApi.selectedId}
              onSelect={annotationsApi.setSelectedId}
              onAdd={annotationsApi.add}
              onUpdate={annotationsApi.update}
              onRemove={annotationsApi.remove}
              onUndo={annotationsApi.undo}
              onRedo={annotationsApi.redo}
              canUndo={annotationsApi.canUndo}
              canRedo={annotationsApi.canRedo}
              onClearPage={handleClearPage}
              onDocumentMeta={handleDocumentMeta}
              onPagesRenderer={capturePagesRenderer}
              syncState={annotationsApi.syncState}
              disabled={locked}
              onReload={reload}
            />
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden lg:h-[calc(100vh-260px)] lg:min-h-[420px]">
            <MarkSchemePanel
              questions={questions}
              marks={marks}
              comments={comments}
              feedback={feedback}
              totalAwarded={totalAwarded}
              totalAvailable={totalAvailable}
              onMarkChange={setMark}
              onCommentChange={setComment}
              onFeedbackChange={setGeneralFeedback}
              onCreateScheme={
                assignment?.id
                  ? () =>
                      navigate(`/teacher/assignments/${assignment.id}/mark-scheme`)
                  : undefined
              }
              disabled={locked}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function SaveIndicator({ state }) {
  const map = {
    idle: { icon: "cloud_done", text: "", cls: "text-on-surface-variant" },
    saving: { icon: "cloud_sync", text: "Saving…", cls: "text-on-surface-variant" },
    saved: { icon: "cloud_done", text: "Saved", cls: "text-success" },
    offline: { icon: "cloud_off", text: "Offline — will retry", cls: "text-warning" },
    error: { icon: "cloud_alert", text: "Not saved", cls: "text-error" },
  };
  const s = map[state] || map.idle;
  if (!s.text) return null;

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${s.cls}`}>
      <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
      {s.text}
    </span>
  );
}
