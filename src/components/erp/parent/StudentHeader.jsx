// src/components/erp/parent/StudentHeader.jsx

import React, { useState, useMemo } from "react";
import { useParent } from "../../../context/ParentProvider";

const getGradeDetails = (obtained, max) => {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  if (pct >= 90) return { letter: "A+", cls: "grade-Aplus" };
  if (pct >= 80) return { letter: "A",  cls: "grade-A" };
  if (pct >= 70) return { letter: "B+", cls: "grade-Bplus" };
  if (pct >= 60) return { letter: "B",  cls: "grade-B" };
  return               { letter: "C",  cls: "grade-C" };
};

const StudentHeader = () => {
  // FIX: this used to destructure `gradesReport`, a field that ParentProvider
  // never actually sets — GradesAssessmentHub.jsx (the real Grades & Report
  // page) gets its data from `gradesFlat` / `gradesExams` / `gradesSummary`.
  // Since gradesReport was always undefined, `disabled={downloading ||
  // !gradesReport}` made this button permanently disabled and the early
  // `if (!gradesReport) return;` inside downloadReportCard made the click
  // handler a no-op even on the rare chance it wasn't disabled. Switched to
  // the same fields the working Grades page already uses.
  const { activeChild, dashboard, gradesFlat, gradesExams, gradesSummary, loading } = useParent();
  const [downloading, setDownloading] = useState(false);

  const displayName = activeChild?.name || "Student";
  const classInfo = dashboard?.class_info;
  const classSection = classInfo
    ? `${classInfo.class || ""}${classInfo.section ? ` – ${classInfo.section}` : ""}`.trim()
    : "—";

  let schoolName = "School";
  try {
    const userData = JSON.parse(localStorage.getItem("user_data") || "null");
    schoolName = userData?.school_name || userData?.identity?.school_name || "School";
  } catch {
    // ignore parse errors, keep fallback
  }

  // gradesFlat is already flattened exam→subject by ParentProvider (same
  // data GradesAssessmentHub.jsx renders) — no exams[].subjects nesting to
  // walk through here.
  const flatRows = useMemo(() => (Array.isArray(gradesFlat) ? gradesFlat : []), [gradesFlat]);
  const hasGrades = flatRows.length > 0;

  // Prefer the backend's overall_percentage (computed across ALL exams
  // server-side) the same way GradesAssessmentHub does; fall back to
  // averaging the loaded rows only if that's missing.
  const overallPct = useMemo(() => {
    if (gradesSummary?.overall_percentage != null) return gradesSummary.overall_percentage;
    const withScores = flatRows.filter((r) => r.marks_obtained != null && r.max_marks != null);
    if (!withScores.length) return 0;
    return Math.round(
      withScores.reduce((sum, r) => sum + (parseFloat(r.marks_obtained) / parseFloat(r.max_marks)) * 100, 0) /
        withScores.length,
    );
  }, [flatRows, gradesSummary]);

  // Latest exam by date, same chronological approach as GradesAssessmentHub's
  // trend chart — falls back to the last flat row's exam name if gradesExams
  // isn't available for some reason.
  const latestExamName = useMemo(() => {
    if (Array.isArray(gradesExams) && gradesExams.length) {
      const sorted = [...gradesExams].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
      return sorted[sorted.length - 1]?.exam_name || null;
    }
    return flatRows[flatRows.length - 1]?.exam_name || null;
  }, [gradesExams, flatRows]);

  const downloadReportCard = () => {
    if (!hasGrades) return;
    setDownloading(true);

    const printWindow = window.open("", "_blank");
    const reportHTML = `<!DOCTYPE html><html><head><title>Report Card</title><meta charset="UTF-8">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333}
    .header{text-align:center;margin-bottom:30px;border-bottom:3px solid #3b82f6;padding-bottom:20px}
    .header h1{font-size:28px;color:#1e293b}.header h2{font-size:20px;color:#64748b;font-weight:normal}
    .info{background:#f8fafc;padding:15px 20px;border-radius:12px;margin-bottom:25px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
    .info-item{display:flex;gap:8px}.info-label{font-weight:600;color:#64748b;font-size:12px}.info-value{font-weight:700;color:#1e293b;font-size:14px}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px}
    .card{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;padding:20px;border-radius:16px;text-align:center}
    .card h4{font-size:12px;opacity:.9;margin-bottom:8px}.card .value{font-size:32px;font-weight:bold}
    table{width:100%;border-collapse:collapse;margin-bottom:30px}
    th{background:#f1f5f9;padding:12px;text-align:left;font-size:12px;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0}
    td{padding:12px;font-size:13px;border-bottom:1px solid #e2e8f0}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-weight:bold;font-size:11px}
    .grade-Aplus{background:#dcfce7;color:#166534}.grade-A{background:#dbeafe;color:#1e40af}
    .grade-Bplus{background:#fef3c7;color:#92400e}.grade-B{background:#ffedd5;color:#9a3412}.grade-C{background:#fee2e2;color:#991b1b}
    .footer{margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}
    </style></head><body>
    <div class="header"><h1>ACADEMIC REPORT CARD</h1><h2>${classSection}</h2><p>Academic Year ${classInfo?.academic_year || new Date().getFullYear()}</p></div>
    <div class="info">
      <div class="info-item"><span class="info-label">Student:</span><span class="info-value">${displayName}</span></div>
      <div class="info-item"><span class="info-label">Enroll No:</span><span class="info-value">${activeChild?.enrollment_number || "N/A"}</span></div>
      <div class="info-item"><span class="info-label">Roll No:</span><span class="info-value">${classInfo?.roll_number || "N/A"}</span></div>
      <div class="info-item"><span class="info-label">Date:</span><span class="info-value">${new Date().toLocaleDateString()}</span></div>
    </div>
    <div class="summary">
      <div class="card"><h4>Overall %</h4><div class="value">${overallPct}%</div></div>
      <div class="card" style="background:linear-gradient(135deg,#10b981,#059669)"><h4>Subjects Passed</h4><div class="value">${flatRows.filter(r=>parseFloat(r.max_marks)>0 && parseFloat(r.marks_obtained)>=parseFloat(r.max_marks)*0.4).length}</div></div>
      <div class="card" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"><h4>Latest Exam</h4><div class="value" style="font-size:16px">${latestExamName || "N/A"}</div></div>
    </div>
    <table><thead><tr><th>Subject</th><th>Exam</th><th>Obtained</th><th>Max</th><th>%</th><th>Grade</th><th>Remarks</th></tr></thead>
    <tbody>${flatRows.map((r) => {
      const obt = parseFloat(r.marks_obtained || 0), max = parseFloat(r.max_marks || 0);
      const pct = max > 0 ? ((obt / max) * 100).toFixed(1) : "0.0";
      const gd = getGradeDetails(obt, max);
      return `<tr><td><strong>${r.subject_name}</strong></td><td>${r.exam_name}</td><td>${r.marks_obtained}</td><td>${r.max_marks}</td><td><strong>${pct}%</strong></td><td><span class="badge ${gd.cls}">${gd.letter}</span></td><td style="font-style:italic;color:#64748b">${r.remarks || "No remarks"}</td></tr>`;
    }).join("")}</tbody></table>
    <div class="footer"><p>Generated on ${new Date().toLocaleString()} — Academic Architect</p></div>
    <script>window.print();setTimeout(()=>window.close(),500)</script></body></html>`;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => setDownloading(false), 1000);
  };

  if (loading) {
    return (
      <section className="animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 p-4 sm:p-6 space-y-2.5">
        <div className="h-5 sm:h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 sm:w-40" />
        <div className="flex gap-2.5">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-28 sm:w-32" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-28 sm:w-32" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="font-body relative overflow-hidden rounded-xl
                 bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700
                 shadow-md shadow-blue-900/10
                 px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6
                 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
    >
      {/* Decorative background layer — purely visual, no data */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-24 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/10" />
        <span className="material-symbols-outlined absolute right-72 top-6 text-white/20 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          auto_awesome
        </span>
        <svg className="absolute right-40 top-1/2 -translate-y-1/2 opacity-20" width="110" height="76" viewBox="0 0 130 90" fill="none">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 17 + 4} cy={row * 15 + 4} r="2" fill="white" />
            )),
          )}
        </svg>
        <div className="absolute -right-10 -bottom-16 w-52 h-52 rounded-full border border-white/10" />
      </div>

      {/* Left accent bar + title block */}
      <div className="relative flex gap-2.5 sm:gap-3 min-w-0">
        <span className="hidden sm:block w-1 rounded-full bg-sky-300/70 flex-shrink-0" />
        <div className="space-y-1 min-w-0">
          <h2 className="font-headline text-lg sm:text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight">
            Parent Dashboard
          </h2>

          <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1 text-3xs sm:text-xs text-sky-100">
            <span className="flex items-center gap-1 min-w-0 max-w-full">
              <span className="material-symbols-outlined text-sky-200 text-xs sm:text-sm flex-shrink-0">person</span>
              <span className="font-semibold text-white truncate">{displayName}</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />

            <span className="flex items-center gap-1 min-w-0 max-w-full">
              <span className="material-symbols-outlined text-sky-200 text-xs sm:text-sm flex-shrink-0">school</span>
              <span className="truncate">{classSection}</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />

            <span className="text-sky-200 font-medium truncate max-w-full">{schoolName}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="relative grid grid-cols-2 lg:flex gap-2 lg:flex-nowrap lg:justify-end flex-shrink-0 w-full lg:w-auto">
        <button
          onClick={downloadReportCard}
          disabled={downloading || !hasGrades}
          title={!hasGrades ? "No grades available yet for this child" : undefined}
          className="flex items-center justify-center gap-1
                     bg-white/15 backdrop-blur-sm border border-white/25
                     text-white
                     px-2.5 sm:px-3 py-2 rounded-md font-semibold text-3xs sm:text-xs
                     hover:bg-white/25
                     transition-colors active:scale-95 duration-75
                     disabled:opacity-50 whitespace-nowrap min-w-0"
        >
          <span className="material-symbols-outlined text-sm flex-shrink-0">
            {downloading ? "hourglass_empty" : "picture_as_pdf"}
          </span>
          <span className="truncate">{downloading ? "Preparing..." : "Download Report"}</span>
        </button>

        {/* Teacher email isn't returned by any current parent API — intentionally
            disabled until that's available. Wire up once we hit the Assignments page.
            (Unlike Download Report, this one is disabled on purpose, not a bug.) */}
        <button
          disabled
          title="Teacher contact not available yet"
          className="flex items-center justify-center gap-1
                     bg-blue-500/90 border border-white/10 text-white opacity-70 cursor-not-allowed
                     px-2.5 sm:px-3 py-2 rounded-md font-semibold text-3xs sm:text-xs whitespace-nowrap min-w-0"
        >
          <span className="material-symbols-outlined text-sm flex-shrink-0">mail</span>
          <span className="truncate">Contact Teacher</span>
        </button>
      </div>
    </section>
  );
};

export default StudentHeader;