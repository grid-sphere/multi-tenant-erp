import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { useParent } from "../../context/ParentProvider";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const LEAVE_API = `${API_BASE_URL}/api/v1/leave-management/leave-requests`;

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />;
}

function LeaveSkeleton() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-3 rounded-lg shadow-sm space-y-2">
              <Skeleton className="w-7 h-7 rounded-md" />
              <Skeleton className="w-20 h-2.5" />
              <Skeleton className="w-10 h-4" />
            </div>
          ))}
        </section>
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
          <Skeleton className="w-32 h-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-10 rounded-md" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const f = new Date(from);
  const t = new Date(to);
  const diff = Math.round((t - f) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

const statusClasses = {
  Approved: "bg-green-100 text-green-700 border-green-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ParentLeavePortal() {
  const { activeChildId, activeChild, loading: parentLoading } = useParent();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const fetchLeaves = () => {
    if (!activeChildId) return;
    setLoading(true);
    setError(null);

    // Parent role hits the standard list endpoint (not /me/, that's student-only).
    // Backend queryset is expected to scope this to the parent's mapped children,
    // and we filter by the active child via query param.
    fetch(`${LEAVE_API}/?student_id=${activeChildId}`, { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load leave records");
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        // Safety net: if backend ignores the query param and returns all
        // children's leaves, filter client-side by student id.
        const scoped = list.filter(
          (l) => !l.student_id && !l.student || l.student_id === activeChildId || l.student === activeChildId
        );
        setLeaves(scoped.length ? scoped : list);
      })
      .catch((err) => setError(err.message || "Something went wrong"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeChildId) fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChildId]);

  const stats = useMemo(() => {
    const summary = { total: leaves.length, Approved: 0, Pending: 0, Rejected: 0 };
    leaves.forEach((l) => {
      if (summary[l.status] !== undefined) summary[l.status]++;
    });
    return summary;
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    if (!filterStatus) return leaves;
    return leaves.filter((l) => l.status === filterStatus);
  }, [leaves, filterStatus]);

  if (parentLoading || loading) return <LeaveSkeleton />;

  const statCards = [
    { label: "Total Applied", value: stats.total, icon: "event_note", color: "blue" },
    { label: "Approved", value: stats.Approved, icon: "check_circle", color: "green" },
    { label: "Pending", value: stats.Pending, icon: "hourglass_empty", color: "yellow" },
    { label: "Rejected", value: stats.Rejected, icon: "cancel", color: "red" },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4">

        {/* HEADER */}
        <section>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {activeChild?.name ? `${activeChild.name}'s Leave Requests` : "Leave Requests"}
          </h2>
          <p className="text-2xs text-slate-500 dark:text-slate-400">View leave applications and their approval status</p>
        </section>

        {/* STAT CARDS */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {statCards.map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-800 px-3 py-2.5 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5"
            >
              <span className={`p-1.5 rounded-md flex-shrink-0 ${colorMap[color]}`}>
                <span className="material-symbols-outlined text-base">{icon}</span>
              </span>
              <div>
                <p className="text-2xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* HISTORY */}
        <section className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Leave History</h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-100 dark:bg-slate-700 border-none rounded-md px-2.5 py-1.5 text-2xs font-medium focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {error && (
            <p className="text-2xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5 mb-3">
              {error}
            </p>
          )}

          {filteredLeaves.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">No leave requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-2xs text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60">
                    <th className="py-2 pr-3 font-semibold">Type</th>
                    <th className="py-2 pr-3 font-semibold">From</th>
                    <th className="py-2 pr-3 font-semibold">To</th>
                    <th className="py-2 pr-3 font-semibold">Days</th>
                    <th className="py-2 pr-3 font-semibold">Reason</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                      <td className="py-2 pr-3 font-medium text-slate-800 dark:text-slate-100">{leave.leave_type}</td>
                      <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                        {new Date(leave.start_date).toLocaleDateString("en-GB").replace(/\//g, "-")}
                      </td>
                      <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                        {new Date(leave.end_date).toLocaleDateString("en-GB").replace(/\//g, "-")}
                      </td>
                      <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">
                        {leave.total_days ?? daysBetween(leave.start_date, leave.end_date)}
                      </td>
                      <td className="py-2 pr-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${statusClasses[leave.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}