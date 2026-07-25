import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { financeApi } from "../../services/financeApi";
import { useSchoolAdmin } from "../../context/SchoolAdminProvider";

/* ─────────────────────────────────────────────
   Skeleton Loader (reused pattern)
───────────────────────────────────────────── */
function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        background: "linear-gradient(90deg, color-mix(in srgb, var(--color-outline-variant) 16%, var(--color-surface-container-lowest)) 25%, color-mix(in srgb, var(--color-outline-variant) 28%, var(--color-surface-container-lowest)) 50%, color-mix(in srgb, var(--color-outline-variant) 16%, var(--color-surface-container-lowest)) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
        ...style,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Full-page Skeleton
───────────────────────────────────────────── */
function StudentFeesSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <Skeleton style={{ width: 200, height: 28 }} />
          <Skeleton style={{ width: 280, height: 16, marginTop: 4 }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl p-4 border border-outline-variant/10 bg-surface-container-lowest" style={{ minHeight: "72px" }}>
            <Skeleton style={{ width: 28, height: 28, borderRadius: 6 }} />
            <div className="mt-2">
              <Skeleton style={{ width: 70, height: 10 }} />
              <Skeleton style={{ width: 50, height: 20, marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 shadow-sm">
        <Skeleton style={{ flex: 1, height: 40, borderRadius: 8 }} />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton style={{ flex: 1, height: 40, borderRadius: 8 }} className="sm:w-28 sm:flex-none" />
          <Skeleton style={{ flex: 1, height: 40, borderRadius: 8 }} className="sm:w-32 sm:flex-none" />
          <Skeleton style={{ flex: 1, height: 40, borderRadius: 8 }} className="sm:w-32 sm:flex-none" />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high/30 text-xs font-headline font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10">
              <tr>
                <th className="px-4 md:px-6 py-4"><Skeleton style={{ width: 100, height: 12 }} /></th>
                <th className="px-4 md:px-6 py-4 hidden sm:table-cell"><Skeleton style={{ width: 80, height: 12 }} /></th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell"><Skeleton style={{ width: 80, height: 12 }} /></th>
                <th className="px-4 md:px-6 py-4 text-center"><Skeleton style={{ width: 50, height: 12, margin: "0 auto" }} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton style={{ width: 36, height: 36, borderRadius: 999 }} />
                      <div>
                        <Skeleton style={{ width: 110, height: 14 }} />
                        <Skeleton style={{ width: 140, height: 10, marginTop: 4 }} className="sm:hidden" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden sm:table-cell"><Skeleton style={{ width: 70, height: 12 }} /></td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell"><Skeleton style={{ width: 90, height: 12 }} /></td>
                  <td className="px-4 md:px-6 py-4 text-center"><Skeleton style={{ width: 60, height: 20, borderRadius: 999, margin: "0 auto" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
function StatCard({ icon, label, value, accentColor }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 flex flex-col justify-between transition-all duration-200"
      style={{
        background: "var(--color-surface-container-lowest)",
        border: "1px solid color-mix(in srgb, var(--color-outline-variant) 12%, transparent)",
        borderLeft: `3px solid ${accentColor}`,
        minHeight: "72px",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px color-mix(in srgb, ${accentColor} 12%, transparent)`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: accentColor }} />
      <div className="flex items-start justify-between">
        <div className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}>
          <span className="material-symbols-outlined" style={{ color: accentColor, fontSize: "16px" }}>{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
          style={{ color: "var(--color-on-surface-variant)" }}>{label}</p>
        <p className="text-xl font-headline font-black leading-none"
          style={{ color: "var(--color-on-surface)" }}>{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Status Badge
───────────────────────────────────────────── */
const STATUS_STYLES = {
  Paid: "bg-success/20 text-success",
  Partial: "bg-secondary/20 text-secondary",
  Pending: "bg-outline-variant/20 text-outline",
  Overdue: "bg-error/20 text-error",
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase font-extrabold ${cls} px-2 md:px-2.5 py-1 rounded-full whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cls.split(" ")[1].replace("text-", "bg-")}`} />
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatCurrency(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function getInitials(name) {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function StudentFees() {
  const navigate = useNavigate();
  const { classLevels, academicYears } = useSchoolAdmin();

  const [allFees, setAllFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Bulk export loading state
  const [exporting, setExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, classFilter, yearFilter, pageSize]);

  // Fetch the full fee directory once on mount. Search and filters are
  // applied client-side below so typing in the search box never re-triggers
  // a fetch or flashes the full-page skeleton (the backend's student-fees
  // endpoint doesn't support server-side filtering anyway).
  useEffect(() => {
    fetchAllFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllFees = async () => {
    setLoading(true);
    setError(null);
    try {
      let page = 1;
      let results = [];
      let hasNext = true;
      while (hasNext) {
        const data = await financeApi.getStudentFees(page);
        results = [...results, ...(data.results || data || [])];
        hasNext = Boolean(data.next);
        page += 1;
      }
      setAllFees(results);
    } catch (err) {
      setError("Failed to fetch student fee records.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk export — downloads all student fee records as an .xlsx file, using
  // the same column schema as the bulk-upload template (see finance/views.py
  // StudentFeeViewSet.bulk_export). The backend returns a raw xlsx blob,
  // so we create a temporary object URL and trigger a download.
  const handleBulkExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await financeApi.exportStudentFees();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student-fees-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export student fee records.");
    } finally {
      setExporting(false);
    }
  };

  // Stats — always reflect the full directory, not the current search/filter.
  const totalRecords = allFees.length;
  const paidCount = allFees.filter(f => f.status === "Paid").length;
  const pendingOverdueCount = allFees.filter(f => f.status === "Pending" || f.status === "Overdue").length;
  const totalOutstanding = allFees.reduce((sum, f) => sum + Number(f.balance_due || 0), 0);

  // Client-side search + filters, computed from the already-fetched list —
  // no network round-trip, no loading flash.
  const filteredFees = useMemo(() => {
    return allFees.filter((f) => {
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (classFilter) {
        const matchName = classLevels.find(c => String(c.id) === String(classFilter))?.name;
        if (matchName && f.class_level_name !== matchName) return false;
      }
      if (yearFilter) {
        const matchName = academicYears.find(y => String(y.id) === String(yearFilter))?.name;
        if (matchName && f.academic_year_name !== matchName) return false;
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const haystack = `${f.student_name || ""} ${f.class_level_name || ""} ${f.academic_year_name || ""} ${f.status || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allFees, statusFilter, classFilter, yearFilter, debouncedSearch, classLevels, academicYears]);

  const filteredCount = filteredFees.length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const paginatedFees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFees.slice(start, start + pageSize);
  }, [filteredFees, currentPage, pageSize]);

  const rangeStart = filteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredCount);

  // ── Full-page skeleton while loading ──
  if (loading) {
    return (
      <SchoolLayout title="Fee Management">
        <StudentFeesSkeleton />
      </SchoolLayout>
    );
  }

  // ── Main render ──
  return (
    <SchoolLayout title="Fee Management">
      <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface">Student Fee Management</h2>
            <p className="text-sm text-on-surface-variant mt-1 font-body">
              Track fee payments, dues, and outstanding balances across the institution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkExport}
              disabled={exporting}
              className="whitespace-nowrap bg-surface-container-lowest text-on-surface border border-outline-variant/30 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-surface-container-high/50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[18px] ${exporting ? "animate-spin" : ""}`}>
                {exporting ? "progress_activity" : "download"}
              </span>
              {exporting ? "Exporting..." : "Bulk Export"}
            </button>
            <button
              onClick={() => navigate("/school-admin/finance/bulk-upload")}
              className="whitespace-nowrap bg-surface-container-lowest text-primary border border-primary/30 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-error/10 text-error rounded-xl border border-error/20 text-sm font-body">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="receipt_long" label="Total Records" value={totalRecords} accentColor="var(--color-primary)" />
          <StatCard icon="check_circle" label="Fully Paid" value={paidCount} accentColor="var(--color-success)" />
          <StatCard icon="schedule" label="Pending / Overdue" value={pendingOverdueCount} accentColor="var(--color-error)" />
          <StatCard icon="account_balance_wallet" label="Outstanding" value={formatCurrency(totalOutstanding)} accentColor="var(--color-secondary)" />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search student, class, year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary focus:ring-1 focus:ring-primary transition outline-none"
              style={{ color: "var(--color-on-surface)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none sm:flex-none"
              style={{ color: "var(--color-on-surface)" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partially Paid</option>
              <option value="Paid">Fully Paid</option>
              <option value="Overdue">Overdue</option>
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none sm:flex-none"
              style={{ color: "var(--color-on-surface)" }}
            >
              <option value="">All Classes</option>
              {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="col-span-2 sm:col-auto px-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none sm:flex-none"
              style={{ color: "var(--color-on-surface)" }}
            >
              <option value="">All Academic Years</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 ml-auto shrink-0">
            <button
              onClick={fetchAllFees}
              className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high/50 transition"
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
            </button>
            <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
              {filteredCount} {filteredCount === 1 ? "record" : "records"} found
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-surface-container-high/30 text-xs font-headline font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10">
                <tr>
                  <th className="px-4 md:px-6 py-4">Student</th>
                  <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Class / Year</th>
                  <th className="px-4 md:px-6 py-4 hidden md:table-cell text-right">Total Fee</th>
                  <th className="px-4 md:px-6 py-4 hidden md:table-cell text-right">Paid</th>
                  <th className="px-4 md:px-6 py-4 text-right">Balance Due</th>
                  <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Due Date</th>
                  <th className="px-4 md:px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paginatedFees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 md:px-6 py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">receipt_long</span>
                      <p className="text-sm font-medium">No fee records found</p>
                      <p className="text-xs">Try adjusting your filters or search.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedFees.map((f, index) => (
                    <tr
                      key={f.id}
                      onClick={() => navigate(`/school-admin/finance/student-fees/${f.id}`)}
                      className="group cursor-pointer transition-all duration-150 hover:bg-surface-container-high/30 hover:shadow-inner"
                      style={{ animation: `fadeInUp 0.3s ease ${index * 0.05}s both` }}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-xs border border-outline-variant/20 shrink-0">
                            {getInitials(f.student_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-xs">
                              {f.student_name || "Unknown Student"}
                            </p>
                            <p className="text-[10px] md:text-2xs text-outline font-mono mt-0.5 truncate max-w-[150px] sm:hidden">
                              {f.class_level_name} · {f.academic_year_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs text-on-surface-variant hidden sm:table-cell">
                        {f.class_level_name || "N/A"} · {f.academic_year_name || "N/A"}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-xs font-semibold text-on-surface-variant hidden md:table-cell text-right">
                        {formatCurrency(f.total_fee)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-xs font-semibold text-success hidden md:table-cell text-right">
                        {formatCurrency(f.amount_paid)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-xs font-bold text-right" style={{ color: Number(f.balance_due) > 0 ? "var(--color-error)" : "var(--color-on-surface-variant)" }}>
                        {formatCurrency(f.balance_due)}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-xs text-on-surface-variant hidden sm:table-cell">
                        {f.due_date || "N/A"}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <StatusBadge status={f.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCount > 0 && (
            <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-outline-variant/10 bg-surface-container-high/30">
              <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-xs font-body text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-surface-container-low border border-outline-variant/20 text-xs rounded-md px-1.5 py-1 outline-none focus:border-primary text-on-surface"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <span>Showing {rangeStart}-{rangeEnd} of {filteredCount}</span>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold border border-outline-variant/20 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
                >Previous</button>
                <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold border border-outline-variant/20 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
                >Next</button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </SchoolLayout>
  );
}