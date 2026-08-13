import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import markingApi from "../../../services/markingApi";

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"];
const ACCEPT_ATTR =
  "application/pdf,image/png,image/jpeg,image/webp,image/heic,.pdf,.png,.jpg,.jpeg,.webp,.heic";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function describeFileProblem(file) {
  const name = (file.name || "").toLowerCase();
  const extension = name.slice(name.lastIndexOf("."));
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `"${file.name}" can't be marked. Upload a PDF, or a photo (JPG, PNG).`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 25 MB.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * Send work for checking without a set assignment.
 *
 * The teacher list comes from the server and is limited to staff who actually
 * teach this student's section — a free-text teacher field would let work
 * land with someone who has never taught them.
 */
export default function PracticeUploadPanel({ onSubmitted }) {
  const navigate = useNavigate();

  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [mine, setMine] = useState([]);

  const loadMine = useCallback(() => {
    markingApi
      .getMyPracticeSubmissions()
      .then((d) => setMine(d.submissions || []))
      .catch(() => setMine([]));
  }, []);

  useEffect(() => {
    markingApi
      .getPracticeOptions()
      .then((d) => {
        setOptions(d);
        setLoadError(null);
      })
      .catch((e) => {
        // Previously this swallowed the failure and rendered "not enrolled",
        // which sent us hunting the wrong problem. A request that failed and
        // a student genuinely not on a class list need different messages.
        setOptions(null);
        setLoadError(
          e?.response?.status === 403
            ? "This is only available to student accounts."
            : e?.response?.data?.detail ||
                e?.message ||
                "Could not load the list of teachers."
        );
      })
      .finally(() => setLoading(false));
    loadMine();
  }, [loadMine]);

  const subjects = options?.subjects || [];
  const teachers =
    subjects.find((s) => s.id === subjectId)?.teachers || [];

  // Picking a subject invalidates the teacher choice underneath it.
  useEffect(() => {
    setTeacherId((current) =>
      teachers.some((t) => t.id === current) ? current : teachers[0]?.id || ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, subjects]);

  const handleFile = (picked) => {
    if (!picked) {
      setFile(null);
      setFileError(null);
      return;
    }
    const problem = describeFileProblem(picked);
    if (problem) {
      setFile(null);
      setFileError(problem);
      return;
    }
    setFile(picked);
    setFileError(null);
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setNote("");
    setFileError(null);
  };

  const handleSubmit = async () => {
    if (!file || !subjectId || !teacherId) return;
    setSubmitting(true);
    const progress = toast.loading("Uploading…");
    try {
      const signed = await markingApi.practiceUploadUrl(
        file.name,
        file.type || "application/octet-stream"
      );

      const put = await fetch(signed.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      const created = await markingApi.practiceSubmit({
        subject: subjectId,
        teacher: teacherId,
        title,
        note,
        filePath: signed.file_path,
      });

      toast.success(`Sent to ${created.teacher} for checking`, { id: progress });
      reset();
      setOpen(false);
      loadMine();
      onSubmitted?.(created);
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ||
          Object.values(e?.response?.data || {})[0] ||
          e?.message ||
          "Could not send that for checking.",
        { id: progress }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (loadError) {
    return (
      <div className="rounded-lg border border-error bg-error/10 p-4">
        <p className="text-sm font-semibold text-on-surface">
          Couldn't load the upload form
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">{loadError}</p>
      </div>
    );
  }

  if (!subjects.length) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <p className="text-sm font-semibold text-on-surface">
          No teachers to send work to yet
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          {options?.enrolled
            ? "No teachers are assigned to your class yet. Ask the office to set that up."
            : "No teachers have been assigned to any subjects yet, so there is nobody to send work to."}
        </p>
      </div>
    );
  }

  const canSubmit = file && subjectId && teacherId && !submitting;

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-container-low transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary">
            upload_file
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-on-surface">
              Send work for checking
            </span>
            <span className="block text-xs text-on-surface-variant">
              Extra or practice work, with no assignment set
            </span>
          </span>
        </span>
        <span className="material-symbols-outlined text-on-surface-variant shrink-0">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="p-4 pt-0 space-y-3">
          {options?.notice && (
            <p className="text-xs text-warning bg-warning/10 rounded-md px-3 py-2">
              {options.notice}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Subject">
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Choose a subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Teacher">
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                disabled={!subjectId}
                className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {!subjectId && <option value="">Pick a subject first</option>}
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.is_class_teacher ? " (class teacher)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="What is this? (optional)">
            <input
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Trigonometry practice questions"
              className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Field label="Message for your teacher (optional)">
            <textarea
              rows={2}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you'd like them to look at in particular?"
              className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 cursor-pointer border-2 border-dashed border-surface-container-high rounded-md px-4 py-2.5 text-sm text-on-surface-variant hover:border-primary transition-colors text-center sm:text-left truncate">
              {file ? `📎 ${file.name}` : "Choose a PDF or photo"}
              <input
                type="file"
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-md text-sm font-bold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {submitting ? "Sending…" : "Send for checking"}
            </button>
          </div>

          {fileError && <p className="text-xs text-error">{fileError}</p>}
        </div>
      )}

      {/* Previously sent practice work */}
      {mine.length > 0 && (
        <div className="border-t border-outline-variant">
          <p className="px-4 pt-3 text-2xs font-bold uppercase tracking-widest text-on-surface-variant">
            Sent for checking
          </p>
          <ul className="divide-y divide-outline-variant">
            {mine.map((row) => (
              <li
                key={row.submission_id}
                className="px-4 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {row.title}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {row.subject} · {row.teacher}
                  </p>
                </div>
                {row.is_returned ? (
                  <button
                    onClick={() =>
                      navigate(`/student/submissions/${row.submission_id}/marked`)
                    }
                    className="text-xs font-bold text-primary hover:underline shrink-0"
                  >
                    View marks →
                  </button>
                ) : (
                  <span className="text-xs text-on-surface-variant shrink-0">
                    Awaiting checking
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-2xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
