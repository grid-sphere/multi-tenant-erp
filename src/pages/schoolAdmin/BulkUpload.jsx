import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { schoolAdminApi } from "../../services/schoolAdminApi";

/* ─────────────────────────────────────────────
   Skeleton Shimmer Styles Injection (matches AddStudent/AddTeacher/AddParent)
───────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("skeleton-style")) {
  const s = document.createElement("style");
  s.id = "skeleton-style";
  s.textContent = `@keyframes skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Unified Design System Specifications
───────────────────────────────────────────── */
const labelClass = "text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5 block";

function SectionCard({ title, icon, children, actions }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">{icon}</span>
          <h3 className="text-sm font-headline font-bold text-on-surface">{title}</h3>
        </div>
        {actions}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Per-type configuration: columns, template, endpoint, list route
───────────────────────────────────────────── */
const UPLOAD_TYPES = {
  student: {
    key: "student",
    label: "Students",
    icon: "school",
    listRoute: "/school-admin/students",
    columns: ["first_name", "last_name", "email", "enrollment_number"],
    sampleRow: ["Aditi", "Sharma", "aditi.sharma@example.com", "ENR2024001"],
    call: (file) => schoolAdminApi.bulkUploadStudents(file),
  },
  teacher: {
    key: "teacher",
    label: "Teachers",
    icon: "person_4",
    listRoute: "/school-admin/teachers",
    columns: ["first_name", "last_name", "email", "employee_id", "qualification", "joining_date"],
    sampleRow: ["Rahul", "Verma", "rahul.verma@example.com", "EMP2024001", "M.Ed", "2024-06-01"],
    call: (file) => schoolAdminApi.bulkUploadTeachers(file),
  },
  parent: {
    key: "parent",
    label: "Parents",
    icon: "family_restroom",
    listRoute: "/school-admin/parents",
    columns: ["first_name", "last_name", "email", "phone_number", "address", "occupation", "emergency_contact_number"],
    sampleRow: ["Sunita", "Sharma", "sunita.sharma@example.com", "9876543210", "123 MG Road, Delhi", "Engineer", "9876500000"],
    call: (file) => schoolAdminApi.bulkUploadParents(file),
  },
  mapping: {
    key: "mapping",
    label: "Parent-Student Links",
    icon: "link",
    listRoute: "/school-admin/mapping",
    columns: ["parent_email", "student_enrollment_number", "relationship", "is_primary_contact", "can_view_academics", "can_pay_fees"],
    sampleRow: ["sunita.sharma@example.com", "ENR2024001", "Mother", "true", "true", "true"],
    call: (file) => schoolAdminApi.bulkLinkParentsStudents(file),
    note: "Both the parent and student must already be registered before linking them here.",
  },
};

const TABS = Object.values(UPLOAD_TYPES);

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function downloadTemplate(config) {
  const csv = [config.columns.join(","), config.sampleRow.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${config.key}_bulk_upload_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatErrorDetail(errors) {
  if (typeof errors === "string") return errors;
  if (errors && typeof errors === "object") {
    return Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
      .join(" | ");
  }
  return "Unknown error";
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function BulkUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type");
  const [activeType, setActiveType] = useState(
    initialType && UPLOAD_TYPES[initialType] ? initialType : "student"
  );

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const config = UPLOAD_TYPES[activeType];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const switchType = (type) => {
    setActiveType(type);
    resetFile();
  };

  const validateAndSetFile = (candidate) => {
    if (!candidate) return;
    const name = candidate.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) {
      setError("Only .csv or .xlsx files are supported.");
      return;
    }
    setError(null);
    setResult(null);
    setFile(candidate);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    validateAndSetFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await config.call(file);
      setResult(data);
      const failCount = data?.errors?.length || 0;
      if (failCount === 0) {
        showToast(data?.detail || "Upload processed successfully!");
      } else {
        showToast(`Completed with ${failCount} row(s) failing — see details below.`, "error");
      }
    } catch (err) {
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === "string" && d.includes("<!DOCTYPE")) {
          setError("Server Error (500). Please check the backend logs.");
        } else {
          setError(d.detail || formatErrorDetail(d));
        }
      } else {
        setError(err.message);
      }
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchoolLayout title="Bulk Upload">
      <div className="px-4 md:px-8 pt-4 pb-12 space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-4 md:right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl font-bold text-xs md:text-sm flex items-center gap-3 border border-outline-variant/10 transition-all ${
            toast.type === "success" ? "bg-success text-white" : "bg-error text-white"
          }`}>
            <span className="material-symbols-outlined text-base">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            {toast.msg}
          </div>
        )}

        {/* Top Bar */}
        <div className="flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(config.listRoute)}
            className="flex items-center gap-1.5 text-primary text-xs md:text-sm font-bold hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">Bulk Upload</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-body">
            Register multiple people at once, or link parents to students, from a CSV or Excel file.
          </p>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="p-3 bg-error/10 text-error rounded-xl border border-error/20 text-sm font-body">
            {error}
          </div>
        )}

        {/* Type Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchType(t.key)}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all border ${
                activeType === t.key
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Upload Card */}
        <SectionCard
          title={`Upload ${config.label}`}
          icon="upload_file"
          actions={
            <button
              type="button"
              onClick={() => downloadTemplate(config)}
              className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download template
            </button>
          }
        >
          <div className="space-y-4">
            {config.note && (
              <div className="p-3 bg-primary/5 text-on-surface-variant rounded-lg border border-primary/10 text-xs md:text-sm font-body flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">info</span>
                {config.note}
              </div>
            )}

            <div>
              <label className={labelClass}>Required columns</label>
              <div className="flex flex-wrap gap-1.5">
                {config.columns.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-md bg-surface-container-high text-[11px] font-mono text-on-surface-variant border border-outline-variant/10"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 text-center transition-all ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
                {file ? "description" : "cloud_upload"}
              </span>
              {file ? (
                <>
                  <p className="text-sm font-bold text-on-surface">{file.name}</p>
                  <p className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB · click or drop to replace</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-on-surface">Drag & drop your file here</p>
                  <p className="text-xs text-on-surface-variant">or click to browse · .csv or .xlsx</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => validateAndSetFile(e.target.files?.[0])}
              />
            </div>

            <div className="flex justify-end gap-2">
              {file && (
                <button
                  type="button"
                  onClick={resetFile}
                  className="px-4 py-2 text-xs md:text-sm text-on-surface-variant font-bold hover:bg-surface-container-high rounded-lg transition"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleUpload}
                className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Uploading…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Upload & Register
                  </>
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Results */}
        {result && (
          <SectionCard title="Results" icon="fact_check">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-on-surface">{result.detail}</p>

              {result.created?.length > 0 && (
                <div className="rounded-lg border border-success/20 overflow-hidden">
                  <div className="px-4 py-2 bg-success/10 text-success text-xs font-bold uppercase tracking-wide">
                    Registered ({result.created.length})
                  </div>
                  <div className="fh-64 overflow-y-auto divide-y divide-outline-variant/10">
                    {result.created.map((row, i) => (
                      <div key={i} className="px-4 py-2 text-xs md:text-sm flex justify-between gap-3">
                        <span className="text-on-surface-variant">Row {row.row}</span>
                        <span className="font-semibold text-on-surface truncate">{row.identifier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors?.length > 0 && (
                <div className="rounded-lg border border-error/20 overflow-hidden">
                  <div className="px-4 py-2 bg-error/10 text-error text-xs font-bold uppercase tracking-wide">
                    Failed ({result.errors.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                    {result.errors.map((row, i) => (
                      <div key={i} className="px-4 py-2 text-xs md:text-sm space-y-0.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-on-surface-variant">Row {row.row}</span>
                          <span className="font-semibold text-on-surface truncate">{row.identifier}</span>
                        </div>
                        <p className="text-error/90">{formatErrorDetail(row.errors)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </SchoolLayout>
  );
}