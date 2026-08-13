import api from "./axiosClient";

/**
 * On-screen marking API — Phase 1.
 *
 * Every mutating call carries the session `version`. The server rejects a
 * stale version with 409 rather than letting one marker silently overwrite
 * another's work, so callers must handle that case.
 */

export const markingApi = {
  /** Full marking state for one submission, in a single round trip. */
  getSession: (submissionId) =>
    api.get(`/marking/submissions/${submissionId}/session/`).then((r) => r.data),

  /**
   * Autosave. `payload` may contain general_feedback, document_meta and/or
   * question_marks. `version` is required.
   */
  updateSession: (submissionId, payload) =>
    api
      .patch(`/marking/submissions/${submissionId}/session/update/`, payload)
      .then((r) => r.data),

  /** Derives the grade from the question marks and writes it to the submission. */
  complete: (submissionId, { allowPartial = false } = {}) =>
    api
      .post(`/marking/submissions/${submissionId}/complete/`, {
        allow_partial: allowPartial,
      })
      .then((r) => r.data),

  /** Puts a completed session back into marking so it can be annotated again. */
  reopen: (submissionId) =>
    api.post(`/marking/submissions/${submissionId}/reopen/`).then((r) => r.data),

  /**
   * Batched annotation upsert + delete in one round trip.
   * Returns { version, id_map, annotations } — `id_map` maps the temporary
   * client ids to the real ones the server assigned.
   */
  syncAnnotations: (submissionId, { version, upsert = [], remove = [] }) =>
    api
      .post(`/marking/submissions/${submissionId}/annotations/`, {
        version,
        upsert,
        delete: remove,
      })
      .then((r) => r.data),

  clearPageAnnotations: (submissionId, page) =>
    api
      .delete(`/marking/submissions/${submissionId}/annotations/page/${page}/`)
      .then((r) => r.data),

  /** Presigned PUT for the flattened script. */
  getAnnotatedUploadUrl: (submissionId, contentType = "application/pdf") =>
    api
      .post(`/marking/submissions/${submissionId}/annotated-upload/`, {
        content_type: contentType,
      })
      .then((r) => r.data),

  /** Records the uploaded script and flips the session to `returned`. */
  confirmAnnotatedUpload: (submissionId, filePath) =>
    api
      .post(`/marking/submissions/${submissionId}/annotated-confirm/`, {
        file_path: filePath,
      })
      .then((r) => r.data),

  /** Student/parent-facing result. Readable by the owning teacher too. */
  getMarkedScript: (submissionId) =>
    api
      .get(`/marking/submissions/${submissionId}/marked-script/`)
      .then((r) => r.data),

  getMarkScheme: (assignmentId) =>
    api
      .get(`/marking/assignments/${assignmentId}/mark-scheme/`)
      .then((r) => r.data),

  saveMarkScheme: (assignmentId, { totalMarks, questions, source }) =>
    api
      .put(`/marking/assignments/${assignmentId}/mark-scheme/`, {
        total_marks: totalMarks,
        source: source || "manual",
        questions,
      })
      .then((r) => r.data),

  /**
   * Submissions for an assignment with their marking progress.
   * `status` may be "pending" or "done"; counts always describe the whole batch.
   */
  getQueue: (assignmentId, status) =>
    api
      .get(
        `/marking/assignments/${assignmentId}/queue/${
          status ? `?status=${status}` : ""
        }`
      )
      .then((r) => r.data),

  // ── Practice submissions: student work with no set assignment ──────────

  /** Subjects and teachers this student may send work to. */
  getPracticeOptions: () =>
    api.get(`/marking/practice/options/`).then((r) => r.data),

  practiceUploadUrl: (fileName, contentType) =>
    api
      .post(`/marking/practice/request-upload/`, {
        file_name: fileName,
        content_type: contentType,
      })
      .then((r) => r.data),

  practiceSubmit: ({ subject, teacher, title, filePath, note }) =>
    api
      .post(`/marking/practice/submit/`, {
        subject,
        teacher,
        title,
        note,
        file_path: filePath,
      })
      .then((r) => r.data),

  getMyPracticeSubmissions: () =>
    api.get(`/marking/practice/mine/`).then((r) => r.data),

  // ── AI mark suggestions ────────────────────────────────────────────────

  /** Whether a vision model is configured, so the UI can hide the button. */
  getAiStatus: () => api.get(`/marking/ai-status/`).then((r) => r.data),

  /**
   * Ask a vision model to read the rendered pages and propose marks.
   * Returns suggestions only — nothing is saved until the teacher completes.
   */
  suggestMarks: (submissionId, images) =>
    api
      .post(`/marking/submissions/${submissionId}/ai-suggest/`, { images })
      .then((r) => r.data),

  /** Convert rendered pages to plain text. Needs no submission or mark scheme. */
  transcribe: (images) =>
    api.post(`/marking/transcribe/`, { images }).then((r) => r.data),

  // ── Local DeepSeek-OCR service (optional, self-hosted) ─────────────────

  /**
   * Which service (local CPU or remote GPU) is configured and whether it's
   * reachable. There is no way to change the URL from here — it comes only
   * from OCR_SERVICE_URL in the backend .env.
   */
  getLocalOcrStatus: () =>
    api.get(`/marking/local-ocr/status/`).then((r) => r.data),

  /** Queues a job from pre-rendered pages. Used by the local CPU service. */
  createLocalOcrJob: (
    images,
    { engine = "trocr", preset = "small", mode = "text" } = {}
  ) =>
    api
      .post(`/marking/local-ocr/jobs/`, { images, engine, preset, mode })
      .then((r) => r.data),

  /**
   * Queues a job from the original file. Remote (GPU) mode only.
   *
   * The file goes up untouched and Django splits a PDF into single pages,
   * sending one per request. Rasterising in the browser would cost megabytes
   * of PNG per page; sending the PDF whole would exceed Cloudflare's ~100s
   * limit on how long the origin may take to answer.
   */
  createLocalOcrUploadJob: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post(`/marking/local-ocr/jobs/upload/`, form, {
        // Let the browser set the multipart boundary; axios cannot.
        headers: { "Content-Type": undefined },
      })
      .then((r) => r.data);
  },

  getLocalOcrJob: (jobId) =>
    api.get(`/marking/local-ocr/jobs/${jobId}/`).then((r) => r.data),

  cancelLocalOcrJob: (jobId) =>
    api.post(`/marking/local-ocr/jobs/${jobId}/cancel/`).then((r) => r.data),

  // ── Teacher-side upload: file a script and mark it directly ────────────

  getTeacherUploadOptions: () =>
    api.get(`/marking/teacher-upload/options/`).then((r) => r.data),

  teacherUploadUrl: (fileName, contentType) =>
    api
      .post(`/marking/teacher-upload/request-upload/`, {
        file_name: fileName,
        content_type: contentType,
      })
      .then((r) => r.data),

  teacherUploadSubmit: ({ student, subject, title, filePath, maxMarks }) =>
    api
      .post(`/marking/teacher-upload/submit/`, {
        student,
        subject,
        title,
        file_path: filePath,
        max_marks: maxMarks,
      })
      .then((r) => r.data),

  /** Students with no enrollment record. Admin only. */
  getUnenrolledStudents: () =>
    api.get(`/marking/unenrolled-students/`).then((r) => r.data),

  /** Marking progress across assignments. Whole school for staff, own otherwise. */
  getProgress: (teacherId) =>
    api
      .get(`/marking/progress/${teacherId ? `?teacher=${teacherId}` : ""}`)
      .then((r) => r.data),
};

/** True when an axios error is the optimistic-lock rejection. */
export const isVersionConflict = (error) => error?.response?.status === 409;

export default markingApi;
