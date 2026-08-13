import { useCallback, useEffect, useMemo, useState } from "react";
import markingApi from "../services/markingApi";

/**
 * The batch a marker is working through.
 *
 * Order comes from the server and is stable (by student name), so "next" means
 * the same thing every time a teacher returns to a batch. Deriving it on the
 * client from marking state would reshuffle the list as scripts got marked and
 * lose the marker's place mid-batch.
 */
export function useMarkingQueue(assignmentId, currentSubmissionId) {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const data = await markingApi.getQueue(assignmentId);
      setQueue(data);
    } catch {
      // The queue is a convenience; marking one script must still work
      // without it, so a failure here stays silent.
      setQueue(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = queue?.submissions || [];

  const index = useMemo(
    () => rows.findIndex((r) => r.submission_id === currentSubmissionId),
    [rows, currentSubmissionId]
  );

  const previous = index > 0 ? rows[index - 1] : null;
  const next = index >= 0 && index < rows.length - 1 ? rows[index + 1] : null;

  /**
   * The next script still needing marks, searching forward from the current
   * position and wrapping once. Wrapping matters: a marker who jumps into the
   * middle of a batch should still be walked through the earlier gaps rather
   * than being told they are finished.
   */
  const nextPending = useMemo(() => {
    if (!rows.length) return null;
    const start = index >= 0 ? index : -1;
    for (let i = start + 1; i < rows.length; i += 1) {
      if (!rows[i].is_done) return rows[i];
    }
    for (let i = 0; i <= start; i += 1) {
      if (!rows[i].is_done && rows[i].submission_id !== currentSubmissionId) {
        return rows[i];
      }
    }
    return null;
  }, [rows, index, currentSubmissionId]);

  return {
    queue,
    rows,
    counts: queue?.counts || null,
    assignment: queue?.assignment || null,
    loading,
    index,
    position: index >= 0 ? index + 1 : null,
    total: rows.length,
    previous,
    next,
    nextPending,
    reload: load,
  };
}

export default useMarkingQueue;
