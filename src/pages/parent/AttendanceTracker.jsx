import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { useParent } from "../../context/ParentProvider";

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />;
}

function AttendanceSkeleton() {
  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2.5">
          <div className="space-y-1.5">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-56 h-2.5" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-24 h-8 rounded-md" />
            <Skeleton className="w-28 h-8 rounded-md" />
          </div>
        </div>
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4">
          <div className="xl:col-span-4 flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm space-y-2.5">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-24 h-2.5" />
                <Skeleton className="w-14 h-6" />
              </div>
            ))}
          </div>
          <div className="xl:col-span-8 bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex justify-between">
              <Skeleton className="w-32 h-4" />
              <div className="flex gap-2">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ─── Request Leave Modal ───────────────────────────────────────────────── */
function RequestLeaveModal({ studentName, onClose, onSubmit }) {
  const [form, setForm]           = useState({ fromDate: "", toDate: "", reason: "", type: "Medical" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const leaveTypes = ["Medical", "Family Emergency", "Travel", "Personal", "Other"];

  const handleSubmit = async () => {
    if (!form.fromDate || !form.toDate || !form.reason.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { onSubmit?.(); onClose(); }, 1500);
  };

  return (
    <div
      className="font-body fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-sm max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">Request Leave</h2>
            <p className="text-2xs text-slate-500 dark:text-slate-300 mt-0.5 truncate">For {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 px-5 text-center">
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-2.5">
              <span className="material-symbols-outlined text-green-600 dark:text-green-300 text-lg">check_circle</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Leave request submitted</p>
            <p className="text-2xs text-slate-500 dark:text-slate-300 mt-1">The school will review and respond shortly.</p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="min-w-0">
                <label className="block text-2xs font-medium text-slate-500 dark:text-slate-300 mb-1">From date</label>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={e => setForm(p => ({ ...p, fromDate: e.target.value }))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-2xs font-medium text-slate-500 dark:text-slate-300 mb-1">To date</label>
                <input
                  type="date"
                  value={form.toDate}
                  onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-500 dark:text-slate-300 mb-1">Leave type</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {leaveTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-medium text-slate-500 dark:text-slate-300 mb-1">Reason</label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Briefly describe the reason for leave..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1 pb-1">
              <button
                onClick={onClose}
                className="flex-1 text-xs py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.fromDate || !form.toDate || !form.reason.trim()}
                className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Export CSV ────────────────────────────────────────────────────────── */
function exportToCSV(records, studentName) {
  const headers = ["Date", "Day", "Status", "Remarks"];
  const rows = records.map(r => {
    const d = new Date(r.date);
    return [
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      d.toLocaleDateString("en-US", { weekday: "long" }),
      r.status  || "",
      r.remarks || "",
    ];
  });

  const csvContent = [
    [`Attendance Report — ${studentName}`],
    [`Generated on: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`],
    [],
    headers,
    ...rows,
  ]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `attendance_${studentName.replace(/\s+/g, "_").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function AttendanceTracker() {
  const {
    activeChild,
    enrollment,
    attendanceRecords,
    attendanceSummary,
    dashboard,
    loading,
    childDataLoading,
    error,
  } = useParent();

  const [currentDate,    setCurrentDate]    = useState(new Date());
  const [showLeaveModal, setShowLeaveModal]  = useState(false);
  const [exportFeedback, setExportFeedback]  = useState(false);
  const [selectedRow,    setSelectedRow]     = useState(null);
  const [visibleLogs,    setVisibleLogs]     = useState(5);

  useEffect(() => {
    setVisibleLogs(5);
  }, [attendanceRecords]);

  const year      = currentDate.getFullYear();
  const month     = currentDate.getMonth();
  const monthWord  = currentDate.toLocaleString("en-US", { month: "long" });

  const attendanceMap = useMemo(() => {
    if (!Array.isArray(attendanceRecords)) return {};
    return attendanceRecords.reduce((acc, r) => { acc[r.date] = r; return acc; }, {});
  }, [attendanceRecords]);

  const daysCount       = new Date(year, month + 1, 0).getDate();
  const days            = Array.from({ length: daysCount }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyDays       = Array.from({ length: firstDayOfMonth });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const overallAttendance = useMemo(() => {
    if (attendanceSummary?.attendance_percentage != null) {
      return parseFloat(attendanceSummary.attendance_percentage).toFixed(2);
    }
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) return "0.00";
    const present = attendanceRecords.filter(r => r.status === "Present").length;
    return ((present / attendanceRecords.length) * 100).toFixed(2);
  }, [attendanceSummary, attendanceRecords]);

  const minRequirement       = 75;
  const attendanceDifference = (parseFloat(overallAttendance) - minRequirement).toFixed(2);
  const requirementMet       = parseFloat(overallAttendance) >= minRequirement;

  const monthlyDistribution = useMemo(() => {
    const s = { Present: 0, Absent: 0, Late: 0 };
    if (!Array.isArray(attendanceRecords)) return s;
    attendanceRecords.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month && s[r.status] !== undefined) {
        s[r.status]++;
      }
    });
    return s;
  }, [attendanceRecords, year, month]);

  const studentFirstName = activeChild?.name?.split(" ")[0] || "your child";
  const studentFullName  = activeChild?.name || studentFirstName;
  const totalSubjects    = dashboard?.stats?.total_grades ?? 0;

  const statusClasses = {
    Present: "bg-green-100 text-green-700 border-green-200",
    Absent:  "bg-red-100 text-red-700 border-red-200",
    Late:    "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const badgeCls = {
    Present: "bg-green-50 text-green-700",
    Absent:  "bg-red-50 text-red-700",
    Late:    "bg-yellow-50 text-yellow-700",
  };

  const handleExport = () => {
    const sorted = [...(attendanceRecords || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    exportToCSV(sorted, studentFullName);
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2000);
  };

  if (loading) return <AttendanceSkeleton />;

  if (error || !activeChild) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl p-4 text-xs">
            Could not load attendance data. {error?.message || "Please try again later."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sortedRecords  = [...(attendanceRecords || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const visibleRecords = sortedRecords.slice(0, visibleLogs);

  return (
    <DashboardLayout>
      <div className="font-body p-2.5 sm:p-3.5 lg:p-4 max-w-7xl mx-auto space-y-3 sm:space-y-4">

        {/* ── Header ── */}
        <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2.5">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Child Attendance
            </h1>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              Tracking {studentFirstName}'s academic presence
              {childDataLoading && (
                <span className="inline-block w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-300 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-2xs sm:text-xs hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">
                {exportFeedback ? "check" : "download"}
              </span>
              <span className="hidden xs:inline">{exportFeedback ? "Exported!" : "Export"}</span>
            </button>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-2xs sm:text-xs hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">event_busy</span>
              <span>Request Leave</span>
            </button>
          </div>
        </div>

        {/* ── Stat cards + Calendar ── */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5">

          {/* LEFT: 3 stat cards */}
          <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2.5 sm:gap-3">

            {/* Card 1: Overall */}
            <div className="bg-white dark:bg-slate-800 px-3 py-2.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2.5 flex-wrap transition-colors duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-base">analytics</span>
                </span>
                <div className="min-w-0">
                  <p className="text-2xs font-medium text-slate-500 dark:text-slate-400 truncate">Overall Attendance</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {overallAttendance}<span className="text-xs font-semibold">%</span>
                  </p>
                </div>
              </div>
              <div className="w-12 flex flex-col items-end gap-1 flex-shrink-0">
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(parseFloat(overallAttendance), 100)}%` }}
                  />
                </div>
                <span className="text-3xs text-slate-400 dark:text-slate-400 whitespace-nowrap">{overallAttendance}% of 100%</span>
              </div>
            </div>

            {/* Card 2: Min Requirement */}
            <div className="bg-white dark:bg-slate-800 px-3 py-2.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2.5 flex-wrap transition-colors duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined text-base">gavel</span>
                </span>
                <div className="min-w-0">
                  <p className="text-2xs font-medium text-slate-500 dark:text-slate-400 truncate">Min. Requirement</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {minRequirement}<span className="text-xs font-semibold">%</span>
                  </p>
                  <p className="text-3xs text-slate-400 dark:text-slate-400 italic truncate">
                    {requirementMet
                      ? `${Math.abs(attendanceDifference)}% above limit`
                      : `${Math.abs(attendanceDifference)}% below limit`}
                  </p>
                </div>
              </div>
              <span className={`text-3xs font-bold px-1.5 py-1 rounded-full self-start whitespace-nowrap flex-shrink-0 ${
                requirementMet
                  ? "text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/30"
                  : "text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30"
              }`}>
                {requirementMet ? "Met" : "Not Met"}
              </span>
            </div>

            {/* Card 3: Monthly Breakdown */}
            <div className="bg-white dark:bg-slate-800 px-3 py-2.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
              <p className="text-2xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Monthly Breakdown</p>
              <p className="text-3xs text-slate-400 dark:text-slate-500 mb-2.5">{monthWord} {year}</p>

              {monthlyDistribution.Present === 0 && monthlyDistribution.Absent === 0 && monthlyDistribution.Late === 0 ? (
                <p className="text-2xs text-slate-400 dark:text-slate-400 text-center py-3">No data for this month</p>
              ) : (
                <div className="flex items-end gap-2 sm:gap-2.5 h-14">
                  {[
                    { label: "Present", count: monthlyDistribution.Present, barColor: "bg-green-400",  textColor: "text-green-600 dark:text-green-300"  },
                    { label: "Absent",  count: monthlyDistribution.Absent,  barColor: "bg-red-400",    textColor: "text-red-600 dark:text-red-300"    },
                    { label: "Late",    count: monthlyDistribution.Late,    barColor: "bg-yellow-400", textColor: "text-yellow-600 dark:text-yellow-300" },
                  ].map(({ label, count, barColor, textColor }) => {
                    const total = monthlyDistribution.Present + monthlyDistribution.Absent + monthlyDistribution.Late;
                    const heightPercent = total > 0 ? ((count / total) * 100).toFixed(2) : "0.00";
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className={`text-3xs font-bold ${textColor}`}>{count}</span>
                        <div className="w-full flex items-end" style={{ height: "36px" }}>
                          <div
                            className={`w-full ${barColor} rounded-t-md transition-all duration-500`}
                            style={{ height: `${heightPercent}%`, minHeight: count > 0 ? "3px" : "0px" }}
                          />
                        </div>
                        <span className="text-3xs text-slate-400 dark:text-slate-400 truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Calendar */}
          <div className="xl:col-span-8 bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <div className="flex justify-between items-center flex-wrap gap-2 mb-3 sm:mb-4">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {monthWord} {year}
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">Visual Presence Log</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-800 dark:text-white active:scale-90"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-800 dark:text-white active:scale-90"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-3xs font-bold text-slate-400 dark:text-slate-400 pb-1">{d}</div>
              ))}
              {emptyDays.map((_, idx) => <div key={`b-${idx}`} />)}
              {days.map(day => {
                const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const record  = attendanceMap?.[dateKey];
                return (
                  <div
                    key={day}
                    title={record?.status || ""}
                    className={`h-7 sm:h-8 xl:h-9 rounded-lg flex items-center justify-center text-2xs font-semibold border transition-all cursor-default select-none ${
                      record
                        ? (statusClasses[record.status] ?? "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600")
                        : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-400"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2.5 sm:gap-4 mt-3 sm:mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              {[
                { color: "bg-green-400",  label: "Present"   },
                { color: "bg-red-400",    label: "Absent"    },
                { color: "bg-yellow-400", label: "Late"      },
                { color: "bg-slate-200 dark:bg-slate-700", label: "No record" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                  <span className="text-2xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Enrollment Details ── */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 px-3 py-2.5 transition-colors duration-300">
          <p className="text-3xs font-semibold text-slate-400 dark:text-slate-400 mb-2.5 uppercase tracking-wider">Enrollment Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {[
              { label: "Student",       value: studentFullName },
              { label: "Class",         value: enrollment ? `${enrollment.class_level_name} – ${enrollment.section_name}` : "N/A" },
              { label: "Roll no.",      value: enrollment?.roll_number || "N/A" },
              { label: "Academic year", value: enrollment?.academic_year_name || "N/A" },
              { label: "Subjects",      value: totalSubjects || "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <p className="text-3xs text-slate-400 dark:text-slate-400 mb-0.5 break-words">{label}</p>
                <p className="text-2xs font-bold text-slate-900 dark:text-white break-words">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Attendance Log ── */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">

          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">Attendance Log</h2>
            <span className="text-2xs text-slate-400 dark:text-slate-400 flex-shrink-0">
              Showing {Math.min(visibleLogs, sortedRecords.length)} of {sortedRecords.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="border-b-2 border-blue-100 dark:border-blue-900/30">
                  <th className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-3 py-2.5 text-3xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-3xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap bg-white dark:bg-slate-800">
                    Day
                  </th>
                  <th className="px-3 py-2.5 text-3xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap bg-white dark:bg-slate-800">
                    Remarks
                  </th>
                  <th className="px-3 py-2.5 text-3xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap text-center bg-white dark:bg-slate-800">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-2xs text-slate-400 dark:text-slate-400">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  visibleRecords.map((rec, idx) => {
                    const d          = new Date(rec.date);
                    const rowKey     = rec.id || rec.date || idx;
                    const isSelected = selectedRow === rowKey;
                    return (
                      <tr
                        key={rowKey}
                        onClick={() => setSelectedRow(isSelected ? null : rowKey)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                        }`}
                      >
                        <td className={`sticky left-0 z-10 px-3 py-2.5 text-2xs font-semibold text-slate-900 dark:text-white whitespace-nowrap transition-colors duration-150 ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-slate-800"
                        }`}>
                          {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-3 py-2.5 text-2xs text-slate-500 dark:text-slate-300 whitespace-nowrap">
                          {d.toLocaleDateString("en-US", { weekday: "long" })}
                        </td>
                        <td className="px-3 py-2.5 text-2xs text-slate-500 dark:text-slate-300 max-w-[180px] break-words">
                          {rec.remarks || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider whitespace-nowrap ${badgeCls[rec.status] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                            {rec.status || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {visibleLogs < sortedRecords.length && (
            <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 flex justify-center">
              <button
                onClick={() => setVisibleLogs(v => v + 5)}
                className="text-2xs font-semibold text-blue-600 dark:text-blue-300 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Load more ({sortedRecords.length - visibleLogs} remaining)
              </button>
            </div>
          )}
        </div>

      </div>

      {showLeaveModal && (
        <RequestLeaveModal
          studentName={studentFullName}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={() => setShowLeaveModal(false)}
        />
      )}
    </DashboardLayout>
  );
}