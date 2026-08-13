import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/axiosClient";
import markingApi from "../services/markingApi";
import { generateRubric } from "../services/api";

/** Rows carry a client-side key so React can track them before the server assigns an id. */
let seq = 0;
const newRow = (overrides = {}) => ({
  key: `new-${++seq}`,
  id: null,
  label: "",
  max_marks: "",
  guidance: "",
  ...overrides,
});

/**
 * Loads and edits an assignment's mark scheme.
 *
 * The server enforces two rules that would otherwise be discovered only on
 * save, so both are mirrored here and surfaced live: question marks must sum
 * to the scheme total, and the scheme total must equal the assignment's
 * maximum. Because the total is pinned to the assignment, the editor treats
 * `assignment.max_marks` as the target and offers to change it rather than
 * letting the teacher type a total that can never save.
 */
export function useMarkSchemeEditor(assignmentId) {
  const [assignment, setAssignment] = useState(null);
  const [rows, setRows] = useState([]);
  const [hasExistingScheme, setHasExistingScheme] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: assignmentData } = await api.get(
        `/operations/assignments/${assignmentId}`
      );
      setAssignment(assignmentData);

      try {
        const scheme = await markingApi.getMarkScheme(assignmentId);
        setHasExistingScheme(true);
        setRows(
          (scheme.questions || []).map((q) =>
            newRow({
              id: q.id,
              label: q.label,
              max_marks: String(q.max_marks),
              guidance: q.guidance || "",
            })
          )
        );
      } catch (e) {
        // 404 simply means this assignment has no scheme yet.
        if (e?.response?.status === 404) {
          setHasExistingScheme(false);
          setRows([newRow({ label: "1" })]);
        } else {
          throw e;
        }
      }
    } catch (e) {
      setError(
        e?.response?.data?.detail || "Could not load this assignment."
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignmentId) load();
  }, [assignmentId, load]);

  // -- row editing --------------------------------------------------------

  const updateRow = useCallback((key, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => {
      // Guess the next label when the existing ones are plain numbers.
      const numeric = prev
        .map((r) => parseInt(r.label, 10))
        .filter((n) => Number.isFinite(n));
      const next = numeric.length ? String(Math.max(...numeric) + 1) : "";
      return [...prev, newRow({ label: next })];
    });
  }, []);

  const removeRow = useCallback((key) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const moveRow = useCallback((key, direction) => {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.key === key);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  /** Split the assignment total evenly across the current rows. */
  const distributeEvenly = useCallback(() => {
    setRows((prev) => {
      if (!prev.length || !assignment?.max_marks) return prev;
      const total = parseFloat(assignment.max_marks);
      const base = Math.floor((total / prev.length) * 2) / 2; // nearest 0.5
      const remainder = +(total - base * prev.length).toFixed(2);
      return prev.map((r, i) => ({
        ...r,
        // The remainder lands on the first question so the sum is exact.
        max_marks: String(i === 0 ? +(base + remainder).toFixed(2) : base),
      }));
    });
  }, [assignment]);

  // -- validation ---------------------------------------------------------

  const sum = useMemo(
    () =>
      rows.reduce((acc, r) => {
        const v = parseFloat(r.max_marks);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0),
    [rows]
  );

  const assignmentMax = parseFloat(assignment?.max_marks ?? 0);

  const issues = useMemo(() => {
    const list = [];
    if (!rows.length) {
      list.push({ level: "error", text: "Add at least one question." });
    }

    const labels = rows.map((r) => r.label.trim()).filter(Boolean);
    if (labels.length !== rows.length) {
      list.push({ level: "error", text: "Every question needs a label." });
    }
    if (new Set(labels).size !== labels.length) {
      list.push({ level: "error", text: "Question labels must be unique." });
    }
    if (rows.some((r) => !(parseFloat(r.max_marks) > 0))) {
      list.push({
        level: "error",
        text: "Every question needs marks greater than zero.",
      });
    }
    if (rows.length && Math.abs(sum - assignmentMax) > 0.001) {
      list.push({
        level: "error",
        text: `Questions total ${sum} but the assignment is out of ${assignmentMax}.`,
        mismatch: true,
      });
    }
    return list;
  }, [rows, sum, assignmentMax]);

  const canSave = issues.length === 0 && !saving;

  // -- persistence --------------------------------------------------------

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const scheme = await markingApi.saveMarkScheme(assignmentId, {
        totalMarks: assignmentMax.toFixed(2),
        questions: rows.map((r, i) => ({
          ...(r.id ? { id: r.id } : {}),
          label: r.label.trim(),
          max_marks: parseFloat(r.max_marks).toFixed(2),
          order: i,
          guidance: r.guidance || "",
        })),
      });
      setHasExistingScheme(true);
      setRows(
        (scheme.questions || []).map((q) =>
          newRow({
            id: q.id,
            label: q.label,
            max_marks: String(q.max_marks),
            guidance: q.guidance || "",
          })
        )
      );
      return scheme;
    } catch (e) {
      const data = e?.response?.data || {};
      const message =
        data.detail ||
        data.total_marks ||
        data.questions ||
        Object.values(data)[0] ||
        "Could not save the mark scheme.";
      setError(Array.isArray(message) ? message[0] : String(message));
      throw e;
    } finally {
      setSaving(false);
    }
  }, [assignmentId, assignmentMax, rows]);

  /**
   * Draft a scheme from the AI rubric generator.
   *
   * The rubric service returns weighted criteria, not questions, so each
   * criterion becomes a question: `criterion_name` is the label, `weight` the
   * marks, and the performance descriptors become marking guidance.
   *
   * Weights come back as percentages of the rubric's own total, which rarely
   * equals this assignment's maximum, so they are rescaled — otherwise the
   * scheme would be unsaveable the moment it arrived.
   *
   * It needs a chapter with ingested content behind it; without that the
   * service 404s, which is reported rather than swallowed.
   */
  const generateFromAI = useCallback(
    async ({ chapterName }) => {
      if (!assignment) throw new Error("Assignment not loaded.");
      setSaving(true);
      setError(null);
      try {
        const rubric = await generateRubric({
          class_name: assignment.section_name || assignment.class_name || "",
          subject: assignment.subject_name || "",
          chapter_name: chapterName,
          assignment_description: assignment.description || assignment.title,
          total_score: Math.round(assignmentMax) || 100,
        });

        const criteria = rubric?.criteria || [];
        if (!criteria.length) {
          throw new Error("The rubric came back with no criteria.");
        }

        const rawTotal = criteria.reduce(
          (sum, c) => sum + (Number(c.weight) || 0),
          0
        );
        if (rawTotal <= 0) throw new Error("The rubric had no usable weights.");

        // Rescale to the assignment total, rounded to halves, with the
        // remainder on the first row so the sum lands exactly.
        let running = 0;
        const scaled = criteria.map((c, i) => {
          const share = (Number(c.weight) || 0) / rawTotal;
          let marks = Math.round(share * assignmentMax * 2) / 2;
          if (i === criteria.length - 1) marks = +(assignmentMax - running).toFixed(2);
          else running = +(running + marks).toFixed(2);
          return { criterion: c, marks: Math.max(0, marks) };
        });

        setRows(
          scaled.map(({ criterion, marks }) =>
            newRow({
              label: String(criterion.criterion_name || "").slice(0, 20) || "Criterion",
              max_marks: String(marks),
              guidance: [
                criterion.excellent && `Excellent: ${criterion.excellent}`,
                criterion.good && `Good: ${criterion.good}`,
                criterion.needs_improvement &&
                  `Needs improvement: ${criterion.needs_improvement}`,
                criterion.poor && `Poor: ${criterion.poor}`,
              ]
                .filter(Boolean)
                .join("\n"),
            })
          )
        );
        return scaled.length;
      } catch (e) {
        const message =
          e?.message?.includes("404") || /no ingested data/i.test(e?.message || "")
            ? "No ingested content found for that chapter, so a rubric could not be generated."
            : e?.message || "Could not generate a mark scheme.";
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [assignment, assignmentMax]
  );

  /** Change the assignment's own maximum so a deliberate total can be saved. */
  const setAssignmentMax = useCallback(
    async (value) => {
      const { data } = await api.patch(
        `/operations/assignments/${assignmentId}`,
        { max_marks: value }
      );
      setAssignment(data);
      return data;
    },
    [assignmentId]
  );

  return {
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
    reload: load,
    clearError: () => setError(null),
  };
}

export default useMarkSchemeEditor;
