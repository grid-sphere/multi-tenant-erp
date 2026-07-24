import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { financeApi } from "../../services/financeApi";

const REQUIRED_COLUMNS = [
  "student_email", "enrollment_number", "first_name", "last_name",
  "class_name", "section_name", "academic_year", "tuition_fee", "due_date",
];

const OPTIONAL_COLUMNS = [
  "amount_paid", "roll_number",
];

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

const labelClass = "text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5 block";

function downloadTemplate() {
  const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
  const sampleRow = {
    student_email: "aditi.sharma@example.com",
    enrollment_number: "ENR2024001",
    first_name: "Aditi",
    last_name: "Sharma",
    class_name: "Grade 5",
    section_name: "A",
    academic_year: "2024-2025",
    tuition_fee: 20000,
    due_date: "2025-04-30",
    amount_paid: 0,
    roll_number: "5A-01",
  };
  const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fees");
  XLSX.writeFile(workbook, "fee_bulk_upload_template.xlsx");
}

export default function FeeBulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const resetFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateAndSetFile = (candidate) => {
    if (!candidate) return;
    const name = candidate.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      setError("Only .xlsx or .xls files are supported for fee uploads.");
      return;
    }
    setError(null);
    setResult(null);
    setFile(candidate);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await financeApi.bulkUploadFees(file, { updateExisting });
      setResult(data);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || d?.detail || err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SchoolLayout title="Bulk Upload Fees">
      <div className="px-4 md:px-8 pt-4 pb-12 space-y-6 mx-auto">

        <button
          type="button"
          onClick={() => navigate("/school-admin/finance/student-fees")}
          className="flex items-center gap-1.5 text-primary text-xs md:text-sm font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Fee Management
        </button>

        <div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">Bulk Upload Fees</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-body">
            Create or update student fee records in bulk from an Excel file.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-error/10 text-error rounded-xl border border-error/20 text-sm font-body">
            {error}
          </div>
        )}

        <SectionCard
          title="Upload Fee Sheet"
          icon="upload_file"
          actions={
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download template
            </button>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 text-on-surface-variant rounded-lg border border-primary/10 text-xs md:text-sm font-body flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">info</span>
              Only <strong>.xlsx</strong> or <strong>.xls</strong> files are accepted (not .csv). If a matching
              class, section, academic year, or enrollment doesn't exist yet, it will be created automatically.
            </div>

            <div>
              <label className={labelClass}>Required columns</label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {REQUIRED_COLUMNS.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-md bg-surface-container-high text-[11px] font-mono text-on-surface-variant border border-outline-variant/10">
                    {c}
                  </span>
                ))}
              </div>
              <label className={labelClass}>Optional columns</label>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONAL_COLUMNS.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-md bg-surface-container-high/50 text-[11px] font-mono text-on-surface-variant border border-outline-variant/10">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              Update existing fee records if a match is found (same student + class + year)
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 text-center transition-all ${
                dragActive ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high"
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
                  <p className="text-sm font-bold text-on-surface">Drag & drop your Excel file here</p>
                  <p className="text-xs text-on-surface-variant">or click to browse · .xlsx or .xls</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => validateAndSetFile(e.target.files?.[0])}
              />
            </div>

            <div className="flex justify-end gap-2">
              {file && (
                <button type="button" onClick={resetFile} className="px-4 py-2 text-xs md:text-sm text-on-surface-variant font-bold hover:bg-surface-container-high rounded-lg transition">
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
                    Processing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {result && (
          <SectionCard title="Results" icon="fact_check">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  ["Total", result.summary?.total, "var(--color-primary)"],
                  ["Successful", result.summary?.successful, "var(--color-success)"],
                  ["Failed", result.summary?.failed, "var(--color-error)"],
                  ["Created", result.summary?.created, "var(--color-secondary)"],
                  ["Updated", result.summary?.updated, "var(--color-outline)"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-lg border border-outline-variant/10 p-3" style={{ borderLeft: `3px solid ${color}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                    <p className="text-lg font-headline font-black text-on-surface mt-0.5">{value ?? 0}</p>
                  </div>
                ))}
              </div>

              {result.errors?.length > 0 && (
                <div className="rounded-lg border border-error/20 overflow-hidden">
                  <div className="px-4 py-2 bg-error/10 text-error text-xs font-bold uppercase tracking-wide">
                    Errors (showing first {result.errors.length})
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/10">
                    {result.errors.map((e, i) => (
                      <div key={i} className="px-4 py-2 text-xs md:text-sm space-y-0.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-on-surface-variant">Row {e.row}</span>
                          <span className="font-semibold text-on-surface truncate">{e.data?.student_email}</span>
                        </div>
                        <p className="text-error/90">{e.error}</p>
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