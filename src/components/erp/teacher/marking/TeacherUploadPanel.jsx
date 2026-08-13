import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import markingApi from "../../../../services/markingApi";

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"];
const ACCEPT_ATTR =
  "application/pdf,image/png,image/jpeg,image/webp,image/heic,.pdf,.png,.jpg,.jpeg,.webp,.heic";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function describeFileProblem(file) {
  const name = (file.name || "").toLowerCase();
  const extension = name.slice(name.lastIndexOf("."));
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `"${file.name}" can't be marked on screen. Use a PDF or an image.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 25 MB.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * Upload a script yourself and go straight to marking it.
 *
 * For paper scripts that never went through the portal, and for marking when
 * a student hasn't uploaded. Works on a partially configured school — the
 * server falls back to school-wide students and subjects when the teacher has
 * no class list — so this is also the one route that keeps working when setup
 * is incomplete.
 */
export default function TeacherUploadPanel({ onUploaded }) {
  const navigate = useNavigate();

  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [open, setOpen] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    markingApi
      .getTeacherUploadOptions()
      .then((d) => {
        setOptions(d);
        setStudentId(d.students?.[0]?.id || "");
        setSubjectId(d.subjects?.[0]?.id || "");
      })
      .catch((e) =>
        setLoadError(
          e?.response?.data?.detail ||
            e?.message ||
            "Could not load students and subjects."
        )
      )
      .finally(() => setLoading(false));
  }, []);

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

  const submit = async () => {
    if (!file || !studentId || !subjectId) return;
    setBusy(true);
    const progress = toast.loading("Uploading…");
    try {
      const signed = await markingApi.teacherUploadUrl(
        file.name,
        file.type || "application/octet-stream"
      );
      const put = await fetch(signed.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      const created = await markingApi.teacherUploadSubmit({
        student: studentId,
        subject: subjectId,
        title,
        filePath: signed.file_path,
        maxMarks: Number(maxMarks) || 100,
      });

      toast.success("Uploaded — opening the marking screen", { id: progress });
      onUploaded?.(created);
      // Straight into marking; that is the whole reason for uploading here.
      navigate(created.mark_url);
    } catch (e) {
      toast.error(
        e?.response?.data?.detail ||
          Object.values(e?.response?.data || {})[0] ||
          e?.message ||
          "Could not upload that script.",
        { id: progress }
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  if (loadError) {
    return (
      <div className="rounded-lg border border-error bg-error/10 p-4 text-sm text-on-surface">
        {loadError}
      </div>
    );
  }

  const students = options?.students || [];
  const subjects = options?.subjects || [];
  const canSubmit = file && studentId && subjectId && !busy && options?.can_upload;

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden mb-6">
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
              Upload a script to mark
            </span>
            <span className="block text-xs text-on-surface-variant">
              For paper scripts, or when a student hasn't uploaded
            </span>
          </span>
        </span>
        <span className="material-symbols-outlined text-on-surface-variant shrink-0">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="p-4 pt-0 space-y-3">
          {options?.notices?.map((n) => (
            <p
              key={n}
              className="text-xs text-warning bg-warning/10 rounded-md px-3 py-2"
            >
              {n}
            </p>
          ))}

          {!options?.can_upload ? (
            <p className="text-sm text-on-surface-variant">
              Uploading isn't possible until the school has at least one student,
              one subject and one class section.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Student">
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.enrollment_number ? ` · ${s.enrollment_number}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Subject">
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                <Field label="What is this? (optional)">
                  <input
                    type="text"
                    value={title}
                    maxLength={200}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Paper 1 — scanned script"
                    className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </Field>
                <Field label="Out of">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-surface-container-low border border-outline-variant text-on-surface tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </Field>
              </div>

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
                  onClick={submit}
                  className="px-5 py-2.5 rounded-md text-sm font-bold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 whitespace-nowrap"
                >
                  {busy ? "Uploading…" : "Upload & mark"}
                </button>
              </div>

              {fileError && <p className="text-xs text-error">{fileError}</p>}

              <p className="text-xs text-on-surface-variant">
                You'll go straight to the marking screen. Add a mark scheme there
                if this needs per-question marks.
              </p>
            </>
          )}
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
