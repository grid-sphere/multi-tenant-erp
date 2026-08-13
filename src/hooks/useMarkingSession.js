import { useCallback, useEffect, useRef, useState } from "react";
import markingApi, { isVersionConflict } from "../services/markingApi";

const AUTOSAVE_DELAY_MS = 1500;

/**
 * Owns the marking session: loads it, holds the working copy, and autosaves.
 *
 * Marking a script takes a long time and losing a session means re-marking the
 * whole thing, so there is no save button — edits flush after a short idle and
 * `saveState` reports what is happening. A 409 from the server means another
 * marker touched the same submission; rather than guessing whose work to keep,
 * the hook surfaces `conflict` and lets the UI ask.
 */
export function useMarkingSession(submissionId) {
  const [session, setSession] = useState(null);
  const [marks, setMarks] = useState({});          // questionId -> "12.5"
  const [comments, setComments] = useState({});    // questionId -> string
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved|error|offline
  const [conflict, setConflict] = useState(null);

  const versionRef = useRef(0);
  const timerRef = useRef(null);
  const dirtyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const hydrate = useCallback((data) => {
    setSession(data);
    versionRef.current = data.marking.version;
    setFeedback(data.marking.general_feedback || "");

    const nextMarks = {};
    const nextComments = {};
    (data.marking.question_marks || []).forEach((qm) => {
      nextMarks[qm.question] = String(qm.marks_awarded ?? "");
      nextComments[qm.question] = qm.comment || "";
    });
    setMarks(nextMarks);
    setComments(nextComments);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await markingApi.getSession(submissionId);
      if (!mountedRef.current) return;
      hydrate(data);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(
        e?.response?.data?.detail ||
          e?.response?.data?.error ||
          "Could not load this submission for marking."
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [submissionId, hydrate]);

  useEffect(() => {
    if (submissionId) load();
  }, [submissionId, load]);

  const buildPayload = useCallback(
    () => ({
      version: versionRef.current,
      general_feedback: feedback,
      question_marks: Object.entries(marks)
        // Blank means "not marked yet" — sending 0 would silently award zero.
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([questionId, value]) => ({
          question: questionId,
          marks_awarded: value,
          comment: comments[questionId] || "",
        })),
    }),
    [feedback, marks, comments]
  );

  const flush = useCallback(async () => {
    if (!dirtyRef.current || !submissionId) return;
    setSaveState("saving");
    try {
      const data = await markingApi.updateSession(submissionId, buildPayload());
      if (!mountedRef.current) return;
      dirtyRef.current = false;
      versionRef.current = data.marking.version;
      setSession(data);
      setSaveState("saved");
    } catch (e) {
      if (!mountedRef.current) return;
      if (isVersionConflict(e)) {
        setConflict(e.response.data);
        setSaveState("error");
      } else if (!e.response) {
        // No response at all — treat as offline and keep the edits pending so
        // they flush on the next successful attempt rather than being lost.
        setSaveState("offline");
      } else {
        setSaveState("error");
        setError(
          e?.response?.data?.detail ||
            Object.values(e?.response?.data || {})[0] ||
            "Could not save."
        );
      }
    }
  }, [submissionId, buildPayload]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
  }, [flush]);

  const setMark = useCallback(
    (questionId, value) => {
      setMarks((prev) => ({ ...prev, [questionId]: value }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const setComment = useCallback(
    (questionId, value) => {
      setComments((prev) => ({ ...prev, [questionId]: value }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const setGeneralFeedback = useCallback(
    (value) => {
      setFeedback(value);
      scheduleSave();
    },
    [scheduleSave]
  );

  const complete = useCallback(
    async ({ allowPartial = false } = {}) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      await flush();
      const data = await markingApi.complete(submissionId, { allowPartial });
      if (mountedRef.current) {
        hydrate(data);
        setSaveState("saved");
      }
      return data;
    },
    [submissionId, flush, hydrate]
  );

  const resolveConflictByReloading = useCallback(async () => {
    setConflict(null);
    dirtyRef.current = false;
    await load();
  }, [load]);

  /**
   * Annotation syncing shares the same optimistic-lock version as the mark
   * fields, so whichever writes last has to tell the other what the version
   * became — otherwise the next write from the quiet side is stale by one.
   */
  const syncVersion = useCallback((next) => {
    versionRef.current = next;
    setSession((prev) =>
      prev ? { ...prev, marking: { ...prev.marking, version: next } } : prev
    );
  }, []);

  const reopen = useCallback(async () => {
    const data = await markingApi.reopen(submissionId);
    if (mountedRef.current) hydrate(data);
    return data;
  }, [submissionId, hydrate]);

  const saveDocumentMeta = useCallback(
    async (meta) => {
      // Fire-and-forget: page geometry is useful for Phase 3 flattening but
      // never worth interrupting marking over.
      try {
        const data = await markingApi.updateSession(submissionId, {
          version: versionRef.current,
          document_meta: meta,
        });
        if (mountedRef.current) {
          versionRef.current = data.marking.version;
          setSession(data);
        }
      } catch {
        /* ignored on purpose */
      }
    },
    [submissionId]
  );

  const questions = session?.mark_scheme?.questions || [];
  const totalAwarded = questions.reduce((sum, q) => {
    const v = parseFloat(marks[q.id]);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);
  const totalAvailable = parseFloat(session?.mark_scheme?.total_marks || 0);
  const unmarked = questions.filter(
    (q) => marks[q.id] === "" || marks[q.id] === undefined
  );

  return {
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
    reload: load,
    resolveConflictByReloading,
    syncVersion,
    saveDocumentMeta,
    version: session?.marking?.version ?? 0,
  };
}

export default useMarkingSession;
