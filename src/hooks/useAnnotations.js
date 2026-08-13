import { useCallback, useEffect, useRef, useState } from "react";
import markingApi, { isVersionConflict } from "../services/markingApi";

const SYNC_DELAY_MS = 1200;

let tmpSeq = 0;
const tempId = () => `tmp-${Date.now().toString(36)}-${++tmpSeq}`;

/**
 * Annotation state for a marking session.
 *
 * Edits apply locally first and sync in batches, because marking is a burst
 * activity — a teacher lands a dozen ticks in a few seconds and a request per
 * tick would be both slow and fragile. Pending creates carry a temporary id
 * until the server returns the real one via `id_map`.
 *
 * Undo/redo is a command stack rather than snapshots of the whole set; a
 * script can carry hundreds of annotations and snapshotting each keystroke
 * would balloon memory for no benefit.
 */
export function useAnnotations({ submissionId, initial = [], version, onVersion, enabled = true }) {
  const [annotations, setAnnotations] = useState(initial);
  const [syncState, setSyncState] = useState("idle"); // idle|syncing|synced|error|offline
  const [conflict, setConflict] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const versionRef = useRef(version ?? 0);
  const pendingUpsert = useRef(new Map()); // id -> annotation
  const pendingDelete = useRef(new Set());
  const timerRef = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const mounted = useRef(true);

  useEffect(() => {
    versionRef.current = version ?? 0;
  }, [version]);

  useEffect(() => {
    setAnnotations(initial || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  useEffect(
    () => () => {
      mounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // -- sync ---------------------------------------------------------------

  const flush = useCallback(async () => {
    if (!submissionId || !enabled) return;
    if (!pendingUpsert.current.size && !pendingDelete.current.size) return;

    const upsert = [...pendingUpsert.current.values()];
    const remove = [...pendingDelete.current];
    pendingUpsert.current.clear();
    pendingDelete.current.clear();

    setSyncState("syncing");
    try {
      const data = await markingApi.syncAnnotations(submissionId, {
        version: versionRef.current,
        upsert,
        remove,
      });
      if (!mounted.current) return;

      versionRef.current = data.version;
      onVersion?.(data.version);
      setAnnotations(data.annotations);

      // Any local reference to a temporary id now points at the real row.
      const map = data.id_map || {};
      if (Object.keys(map).length) {
        setSelectedId((cur) => (cur && map[cur]) || cur);
        undoStack.current = undoStack.current.map((cmd) => remapCommand(cmd, map));
        redoStack.current = redoStack.current.map((cmd) => remapCommand(cmd, map));
      }
      setSyncState("synced");
    } catch (e) {
      if (!mounted.current) return;
      if (isVersionConflict(e)) {
        setConflict(e.response.data);
        setSyncState("error");
      } else if (!e.response) {
        // Offline: put the work back on the queue so it flushes on reconnect
        // rather than being silently dropped.
        upsert.forEach((a) => pendingUpsert.current.set(a.id, a));
        remove.forEach((id) => pendingDelete.current.add(id));
        setSyncState("offline");
      } else {
        setSyncState("error");
      }
    }
  }, [submissionId, enabled, onVersion]);

  const scheduleSync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSyncState("syncing");
    timerRef.current = setTimeout(flush, SYNC_DELAY_MS);
  }, [flush]);

  const queueUpsert = useCallback(
    (annotation) => {
      pendingUpsert.current.set(annotation.id, annotation);
      pendingDelete.current.delete(annotation.id);
      scheduleSync();
    },
    [scheduleSync]
  );

  const queueDelete = useCallback(
    (id) => {
      pendingUpsert.current.delete(id);
      // A never-synced annotation has nothing to delete server-side.
      if (!String(id).startsWith("tmp-")) pendingDelete.current.add(id);
      scheduleSync();
    },
    [scheduleSync]
  );

  // -- mutations ----------------------------------------------------------

  const add = useCallback(
    (annotation) => {
      const created = { id: tempId(), w: 0, h: 0, payload: {}, ...annotation };
      setAnnotations((prev) => [...prev, created]);
      undoStack.current.push({ type: "add", annotation: created });
      redoStack.current = [];
      queueUpsert(created);
      return created;
    },
    [queueUpsert]
  );

  const update = useCallback(
    (id, patch, { record = true } = {}) => {
      setAnnotations((prev) => {
        const before = prev.find((a) => a.id === id);
        if (!before) return prev;
        if (record) {
          undoStack.current.push({ type: "update", id, before: { ...before } });
          redoStack.current = [];
        }
        const after = { ...before, ...patch };
        queueUpsert(after);
        return prev.map((a) => (a.id === id ? after : a));
      });
    },
    [queueUpsert]
  );

  const remove = useCallback(
    (id) => {
      setAnnotations((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) {
          undoStack.current.push({ type: "remove", annotation: { ...target } });
          redoStack.current = [];
        }
        return prev.filter((a) => a.id !== id);
      });
      setSelectedId((cur) => (cur === id ? null : cur));
      queueDelete(id);
    },
    [queueDelete]
  );

  // -- undo / redo --------------------------------------------------------

  const applyInverse = useCallback(
    (command, into) => {
      if (command.type === "add") {
        setAnnotations((prev) => prev.filter((a) => a.id !== command.annotation.id));
        queueDelete(command.annotation.id);
        into.push({ type: "remove", annotation: command.annotation });
      } else if (command.type === "remove") {
        setAnnotations((prev) => [...prev, command.annotation]);
        queueUpsert(command.annotation);
        into.push({ type: "add", annotation: command.annotation });
      } else if (command.type === "update") {
        setAnnotations((prev) => {
          const current = prev.find((a) => a.id === command.id);
          if (current) into.push({ type: "update", id: command.id, before: { ...current } });
          queueUpsert(command.before);
          return prev.map((a) => (a.id === command.id ? command.before : a));
        });
      }
    },
    [queueDelete, queueUpsert]
  );

  const undo = useCallback(() => {
    const cmd = undoStack.current.pop();
    if (cmd) applyInverse(cmd, redoStack.current);
  }, [applyInverse]);

  const redo = useCallback(() => {
    const cmd = redoStack.current.pop();
    if (cmd) applyInverse(cmd, undoStack.current);
  }, [applyInverse]);

  const clearPage = useCallback(
    async (page) => {
      const doomed = annotations.filter((a) => a.page === page);
      if (!doomed.length) return;
      doomed.forEach((a) =>
        undoStack.current.push({ type: "remove", annotation: { ...a } })
      );
      redoStack.current = [];
      setAnnotations((prev) => prev.filter((a) => a.page !== page));
      setSelectedId(null);

      if (timerRef.current) clearTimeout(timerRef.current);
      await flush();
      try {
        const data = await markingApi.clearPageAnnotations(submissionId, page);
        versionRef.current = data.version;
        onVersion?.(data.version);
      } catch {
        setSyncState("error");
      }
    },
    [annotations, flush, submissionId, onVersion]
  );

  const resetFrom = useCallback((list, nextVersion) => {
    pendingUpsert.current.clear();
    pendingDelete.current.clear();
    undoStack.current = [];
    redoStack.current = [];
    setAnnotations(list || []);
    setConflict(null);
    setSelectedId(null);
    if (nextVersion != null) versionRef.current = nextVersion;
    setSyncState("idle");
  }, []);

  return {
    annotations,
    selectedId,
    setSelectedId,
    syncState,
    conflict,
    add,
    update,
    remove,
    undo,
    redo,
    clearPage,
    flush,
    resetFrom,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

/** Swap temporary ids for server-assigned ones inside a queued command. */
function remapCommand(command, map) {
  if (command.type === "update") {
    const id = map[command.id] || command.id;
    return { ...command, id, before: { ...command.before, id } };
  }
  const a = command.annotation;
  if (!a) return command;
  const id = map[a.id] || a.id;
  return { ...command, annotation: { ...a, id } };
}

export default useAnnotations;
