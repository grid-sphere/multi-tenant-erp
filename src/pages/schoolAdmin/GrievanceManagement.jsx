import React, { useState, useEffect, useMemo } from "react";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { schoolAdminApi } from "../../services/schoolAdminApi";

const PAGE_SIZE = 10;

// ── Status config – keys match backend exactly ──
const STATUS = {
    "Pending": { label: "Pending", cls: "text-amber-700 bg-amber-50 border border-amber-200" },
    "In-Progress": { label: "In Review", cls: "text-blue-700 bg-blue-50 border border-blue-200" },
    "Resolved": { label: "Resolved", cls: "text-green-700 bg-green-50 border border-green-200" },
    "Rejected": { label: "Rejected", cls: "text-red-700 bg-red-50 border border-red-200" },
    "Closed": { label: "Closed", cls: "text-gray-600 bg-gray-100 border border-gray-200" },
};

// ── Priority config – keys match backend exactly ──
const PRIORITY = {
    "Low": { label: "Low", dot: "bg-green-500", cls: "text-green-700 bg-green-50" },
    "Medium": { label: "Medium", dot: "bg-amber-500", cls: "text-amber-700 bg-amber-50" },
    "High": { label: "High", dot: "bg-red-500", cls: "text-red-700 bg-red-50" },
    "Urgent": { label: "Urgent", dot: "bg-purple-500", cls: "text-purple-700 bg-purple-50" },
};

// ── Submitter role config ──
// The API doesn't return an explicit "who filed this" role, so we derive it:
// if the submitter's name matches the student's name, the student filed it
// themselves; otherwise a parent/guardian filed it on the student's behalf.
const SUBMITTER = {
    student: { label: "Student", cls: "text-teal-700 bg-teal-50 border border-teal-200", icon: "school" },
    parent: { label: "Parent", cls: "text-violet-700 bg-violet-50 border border-violet-200", icon: "family_restroom" },
};

function getSubmitterRole(g) {
    const submitter = (g.submitted_by_name || "").trim().toLowerCase();
    const student = (g.student_name || "").trim().toLowerCase();
    if (submitter && student && submitter === student) return "student";
    return "parent";
}

// ── Skeleton component (unchanged) ──
function Skeleton({ className = "", style = {} }) {
    return (
        <div
            className={`rounded-md ${className}`}
            style={{
                background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--color-outline-variant) 16%, var(--color-surface-container-lowest)) 25%, color-mix(in srgb, var(--color-outline-variant) 28%, var(--color-surface-container-lowest)) 50%, color-mix(in srgb, var(--color-outline-variant) 16%, var(--color-surface-container-lowest)) 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-shimmer 1.4s ease infinite",
                ...style,
            }}
        />
    );
}

function GrievanceSkeleton() {
    return (
        <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 max-w-7xl">
            <div className="flex justify-between items-start">
                <div>
                    <Skeleton style={{ width: 200, height: 28 }} />
                    <Skeleton style={{ width: 320, height: 16, marginTop: 4 }} />
                </div>
                <Skeleton style={{ width: 140, height: 40, borderRadius: 8 }} />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border rounded-xl">
                        <Skeleton style={{ width: 60, height: 10 }} />
                        <Skeleton style={{ width: 40, height: 20, marginTop: 4 }} />
                    </div>
                ))}
            </div>
            <div className="flex gap-3 flex-wrap">
                <Skeleton style={{ width: 200, height: 40 }} />
                <Skeleton style={{ width: 150, height: 40 }} />
                <Skeleton style={{ width: 150, height: 40 }} />
            </div>
            <div className="rounded-xl border">
                <Skeleton style={{ width: "100%", height: 300 }} />
            </div>
        </div>
    );
}

// ── Stat Card ──
function StatCard({ icon, label, value, accentColor, subtitle }) {
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
                {subtitle && <p className="text-[9px] font-medium text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ── Submitter Badge (small pill used in row + modal) ──
function SubmitterBadge({ role }) {
    const cfg = SUBMITTER[role] || SUBMITTER.parent;
    return (
        <span className={`inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
            <span className="material-symbols-outlined text-[13px] leading-none">{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

// ── GrievanceRow ──
function GrievanceRow({ grievance, onClick }) {
    const status = STATUS[grievance.status] || STATUS["Pending"];
    const priority = PRIORITY[grievance.priority] || PRIORITY["Low"];
    const role = getSubmitterRole(grievance);

    return (
        <tr
            onClick={() => onClick(grievance)}
            className="group cursor-pointer hover:bg-surface-container-high/30 transition-colors"
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">{grievance.title}</span>
                    <span className="text-2xs text-outline">#{grievance.id?.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                    <SubmitterBadge role={role} />
                    <span className="text-outline">•</span>
                    <span>{grievance.submitted_by_name || "Unknown"}</span>
                    <span className="text-outline">•</span>
                    <span className="capitalize">{grievance.category}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`text-2xs font-bold px-2 py-1 rounded-full ${status.cls}`}>
                    {status.label}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                    <span className={`text-2xs font-bold ${priority.cls.split(" ")[0]}`}>{priority.label}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-on-surface-variant">
                {grievance.student_name || "—"}
            </td>
            <td className="px-4 py-3 text-sm text-on-surface-variant">
                {new Date(grievance.created_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-right">
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                    chevron_right
                </span>
            </td>
        </tr>
    );
}

// ── Pagination Bar ──
function PaginationBar({ page, totalPages, totalItems, pageSize, onPageChange }) {
    if (totalItems === 0) return null;

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    // Build a compact page list: 1 … (p-1) p (p+1) … last
    const pages = [];
    const addPage = (n) => pages.push(n);
    const addEllipsis = () => pages.push("…");

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) addPage(i);
    } else {
        addPage(1);
        if (page > 3) addEllipsis();
        const lo = Math.max(2, page - 1);
        const hi = Math.min(totalPages - 1, page + 1);
        for (let i = lo; i <= hi; i++) addPage(i);
        if (page < totalPages - 2) addEllipsis();
        addPage(totalPages);
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant">
                Showing <span className="font-bold text-on-surface">{start}–{end}</span> of{" "}
                <span className="font-bold text-on-surface">{totalItems}</span> grievances
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                {pages.map((p, i) =>
                    p === "…" ? (
                        <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-on-surface-variant text-sm">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors
                                ${p === page
                                    ? "bg-primary text-white"
                                    : "border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
            </div>
        </div>
    );
}

// ── Detail Modal ──
function GrievanceDetailModal({ grievanceId, onClose, onUpdate }) {
    const [grievance, setGrievance] = useState(null);
    const [detailLoading, setDetailLoading] = useState(true);
    const [detailError, setDetailError] = useState("");

    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [adminRemarks, setAdminRemarks] = useState("");
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);

    // Fetch the FULL grievance record — the list row this modal was opened
    // from (GrievanceAdminListSerializer) doesn't include description or
    // admin_remarks, so we always re-fetch the detail endpoint here.
    useEffect(() => {
        let active = true;
        (async () => {
            setDetailLoading(true);
            setDetailError("");
            try {
                const data = await schoolAdminApi.getGrievanceById(grievanceId);
                if (!active) return;
                setGrievance(data);
                setStatus(data.status);
                setPriority(data.priority);
                setAssignedTo(data.assigned_to || "");
                setAdminRemarks(data.admin_remarks || "");
            } catch (err) {
                if (active) setDetailError("Failed to load grievance details.");
            } finally {
                if (active) setDetailLoading(false);
            }
        })();
        return () => { active = false; };
    }, [grievanceId]);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await schoolAdminApi.getTeachers(1, "");
                setStaff(res.results || res || []);
            } catch (_) { }
        };
        fetchStaff();
    }, []);

    const handleUpdate = async (action) => {
        setLoading(true);
        try {
            if (action === "resolve") {
                await schoolAdminApi.resolveGrievance(grievanceId, { admin_remarks: adminRemarks });
            } else if (action === "reject") {
                await schoolAdminApi.rejectGrievance(grievanceId, { admin_remarks: adminRemarks });
            } else {
                await schoolAdminApi.updateGrievance(grievanceId, {
                    status,
                    priority,
                    assigned_to: assignedTo || null,
                    admin_remarks: adminRemarks,
                });
            }
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Update error:", err);
            alert("Failed to update grievance.");
        } finally {
            setLoading(false);
        }
    };

    const role = grievance ? getSubmitterRole(grievance) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-outline-variant/10 animate-in zoom-in-95 duration-200">

                {detailLoading ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <Skeleton style={{ width: 260, height: 26 }} />
                            <button onClick={onClose} className="p-1 hover:bg-surface-container-high rounded-lg">
                                <span className="material-symbols-outlined text-on-surface-variant">close</span>
                            </button>
                        </div>
                        <Skeleton style={{ width: "100%", height: 60 }} />
                        <Skeleton style={{ width: "100%", height: 80 }} />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton style={{ width: "100%", height: 40 }} />
                            <Skeleton style={{ width: "100%", height: 40 }} />
                        </div>
                    </div>
                ) : detailError ? (
                    <div className="text-center py-10">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-2 block">error</span>
                        <p className="text-sm font-bold text-on-surface">{detailError}</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 border border-outline-variant/20 text-on-surface-variant rounded-lg text-sm font-bold hover:bg-surface-container-high"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-headline font-bold text-on-surface break-words [overflow-wrap:anywhere]">{grievance.title}</h3>
                                <div className="mt-1"><SubmitterBadge role={role} /></div>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-surface-container-high rounded-lg">
                                <span className="material-symbols-outlined text-on-surface-variant">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/*
                                Filed-by / student info. When a parent files on behalf of a
                                student, both names are shown. When the student files for
                                themselves, we only show one line to avoid the confusing
                                "Milo murphy / Milo murphy" repetition.
                            */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {role === "student" ? (
                                    <div className="col-span-2">
                                        <span className="text-on-surface-variant">Filed by student:</span>{" "}
                                        <span className="font-semibold text-on-surface">{grievance.submitted_by_name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <span className="text-on-surface-variant">Filed by parent:</span>{" "}
                                            <span className="font-semibold text-on-surface">{grievance.submitted_by_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-on-surface-variant">On behalf of student:</span>{" "}
                                            <span className="font-semibold text-on-surface">{grievance.student_name || "—"}</span>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <span className="text-on-surface-variant">Category:</span>{" "}
                                    <span className="font-semibold text-on-surface capitalize">{grievance.category}</span>
                                </div>
                                <div>
                                    <span className="text-on-surface-variant">Created:</span>{" "}
                                    <span className="font-semibold text-on-surface">
                                        {new Date(grievance.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-on-surface-variant text-xs uppercase font-bold tracking-wider">Description</p>
                                <p className="text-sm text-on-surface mt-1 bg-surface-container-high p-3 rounded-lg whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                                    {grievance.description?.trim() ? grievance.description : "No description provided."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-2xs font-bold uppercase text-on-surface-variant block mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-surface-container-low border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                    >
                                        {Object.keys(STATUS).map((k) => (
                                            <option key={k} value={k}>
                                                {STATUS[k].label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-2xs font-bold uppercase text-on-surface-variant block mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full bg-surface-container-low border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                    >
                                        {Object.keys(PRIORITY).map((k) => (
                                            <option key={k} value={k}>
                                                {PRIORITY[k].label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-2xs font-bold uppercase text-on-surface-variant block mb-1">Assign to Staff</label>
                                <select
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full bg-surface-container-low border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {staff.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.first_name} {t.last_name} ({t.employee_id || "N/A"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-2xs font-bold uppercase text-on-surface-variant block mb-1">Admin Remarks</label>
                                <textarea
                                    rows="2"
                                    value={adminRemarks}
                                    onChange={(e) => setAdminRemarks(e.target.value)}
                                    className="w-full bg-surface-container-low border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none resize-none"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
                                <button
                                    onClick={() => handleUpdate("save")}
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-70"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    onClick={() => handleUpdate("resolve")}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-70"
                                >
                                    Resolve
                                </button>
                                <button
                                    onClick={() => handleUpdate("reject")}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-70"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-outline-variant/20 text-on-surface-variant rounded-lg text-sm font-bold hover:bg-surface-container-high"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main Component ──
export default function GrievanceManagement() {
    const [grievances, setGrievances] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [submitterFilter, setSubmitterFilter] = useState("all"); // all | student | parent
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset to page 1 whenever the filter/search changes the result set
    useEffect(() => {
        setPage(1);
    }, [statusFilter, submitterFilter, debouncedSearch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [list, statsData] = await Promise.all([
                schoolAdminApi.getAdminGrievances(),
                schoolAdminApi.getAdminGrievanceStats(),
            ]);
            setGrievances(list.results || list || []);
            setStats(statsData || {});
        } catch (err) {
            console.error("❌ Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = useMemo(() => {
        let items = grievances;
        if (statusFilter !== "all") {
            items = items.filter((g) => g.status === statusFilter);
        }
        if (submitterFilter !== "all") {
            items = items.filter((g) => getSubmitterRole(g) === submitterFilter);
        }
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            items = items.filter(
                (g) =>
                    g.title?.toLowerCase().includes(q) ||
                    g.submitted_by_name?.toLowerCase().includes(q) ||
                    g.student_name?.toLowerCase().includes(q) ||
                    g.category?.toLowerCase().includes(q)
            );
        }
        return items;
    }, [grievances, statusFilter, submitterFilter, debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = useMemo(() => {
        const startIdx = (safePage - 1) * PAGE_SIZE;
        return filtered.slice(startIdx, startIdx + PAGE_SIZE);
    }, [filtered, safePage]);

    // Counts for the submitter filter, computed off the status+search-filtered
    // set (but before the submitter filter itself) so the numbers stay
    // meaningful as the person narrows down other filters.
    const submitterCounts = useMemo(() => {
        let base = grievances;
        if (statusFilter !== "all") base = base.filter((g) => g.status === statusFilter);
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            base = base.filter(
                (g) =>
                    g.title?.toLowerCase().includes(q) ||
                    g.submitted_by_name?.toLowerCase().includes(q) ||
                    g.student_name?.toLowerCase().includes(q) ||
                    g.category?.toLowerCase().includes(q)
            );
        }
        return {
            student: base.filter((g) => getSubmitterRole(g) === "student").length,
            parent: base.filter((g) => getSubmitterRole(g) === "parent").length,
        };
    }, [grievances, statusFilter, debouncedSearch]);

    if (loading) {
        return (
            <SchoolLayout title="Grievance Management">
                <GrievanceSkeleton />
            </SchoolLayout>
        );
    }

    return (
        <SchoolLayout title="Grievance Management">
            <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 max-w-7xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-headline font-extrabold text-on-surface">Grievance Management</h2>
                        <p className="text-sm text-on-surface-variant mt-1">
                            View, filter, and manage all student & parent grievances.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total" value={stats.total || 0} accentColor="#2563eb" icon="folder_open" />
                    <StatCard label="Pending" value={stats.pending || 0} accentColor="#d97706" icon="pending" />
                    <StatCard label="In Progress" value={stats.in_progress || 0} accentColor="#4f46e5" icon="sync" />
                    <StatCard label="Resolved" value={stats.resolved || 0} accentColor="#16a34a" icon="check_circle" />
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10 shadow-sm">
                    <div className="flex-1 min-w-[200px] relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search by title, student, parent..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                        />
                    </div>

                    <select
                        value={submitterFilter}
                        onChange={(e) => setSubmitterFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary outline-none text-on-surface"
                    >
                        <option value="all">All Submitters</option>
                        <option value="student">Filed by Student ({submitterCounts.student})</option>
                        <option value="parent">Filed by Parent ({submitterCounts.parent})</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm bg-surface-container-high/50 border border-outline-variant/10 focus:border-primary outline-none text-on-surface"
                    >
                        <option value="all">All Statuses</option>
                        {Object.keys(STATUS).map((key) => (
                            <option key={key} value={key}>
                                {STATUS[key].label}
                            </option>
                        ))}
                    </select>

                    <span className="text-xs font-semibold text-on-surface-variant">{filtered.length} grievances</span>
                </div>

                {/* Table */}
                <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-high/30 text-xs font-headline font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10">
                                <tr>
                                    <th className="px-4 py-3">Grievance</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-10 text-center text-on-surface-variant">
                                            No grievances found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((g) => (
                                        <GrievanceRow key={g.id} grievance={g} onClick={(row) => setSelectedId(row.id)} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <PaginationBar
                        page={safePage}
                        totalPages={totalPages}
                        totalItems={filtered.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </div>

                {selectedId && (
                    <GrievanceDetailModal
                        grievanceId={selectedId}
                        onClose={() => setSelectedId(null)}
                        onUpdate={fetchData}
                    />
                )}
            </div>
        </SchoolLayout>
    );
}