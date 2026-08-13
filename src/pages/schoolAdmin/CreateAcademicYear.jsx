import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import api from "../../services/axiosClient";
import { useSchoolAdmin } from "../../context/SchoolAdminProvider";

// ─────────────────────────────────────────────
// Skeleton shimmer keyframe injected once
// ─────────────────────────────────────────────
const SHIMMER_STYLE = `
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

function InjectShimmer() {
  useEffect(() => {
    if (document.getElementById("skeleton-shimmer-style")) return;
    const tag = document.createElement("style");
    tag.id = "skeleton-shimmer-style";
    tag.textContent = SHIMMER_STYLE;
    document.head.appendChild(tag);
  }, []);
  return null;
}

// ─────────────────────────────────────────────
// Skeleton atom
// ─────────────────────────────────────────────
function Skeleton({ style = {} }) {
  return (
    <div
      style={{
        borderRadius: 6,
        background:
          "linear-gradient(90deg,#ececec 25%,#d8d8d8 50%,#ececec 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
        ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Full-page skeleton (mirrors exact page layout)
// ─────────────────────────────────────────────
function PageSkeleton({editMode}) {
  const isEditMode = editMode;

  return (
    <div className="px-4 md:px-8 pt-4 pb-12 space-y-6">

      {/* Top bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Skeleton style={{ width: 50, height: 18 }} />
        <div className="flex gap-2">
          <Skeleton style={{ width: 80, height: 36, borderRadius: 8 }} />
          {isEditMode && <Skeleton style={{ width: 80, height: 36, borderRadius: 8 }} />}
          <Skeleton style={{ width: 80, height: 36, borderRadius: 8 }} />
        </div>
      </div>

      {/* Identity card */}
     <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-4 md:p-6 shadow-sm animate-pulse">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
        
        <div className="flex items-center gap-4 md:gap-5 min-w-0 w-full">
          <div className="hidden sm:flex w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-surface-container-high items-center justify-center border border-outline-variant/10">
            <Skeleton style={{ width: 24, height: 24, borderRadius: 4 }} />
          </div>
          
          <div className="flex-1 min-w-0 w-full">            
            <Skeleton style={{ width: 64, height: 12, marginBottom: 8 }} />            
            <Skeleton style={{ height: 28 }} className="w-full max-w-[160px] md:max-w-[200px] mt-1" />
          </div>
        </div>
        
        <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-outline-variant/10 pt-4 sm:pt-0">          
          <Skeleton style={{ width: 110, height: 12 }} className="sm:hidden" />
          
          <div className="flex items-center gap-3">           
            <Skeleton style={{ width: 40, height: 20, borderRadius: 999 }} className="shrink-0" />
                        
            <Skeleton style={{ borderRadius: 8 }} className="w-20 md:w-24 h-[28px] md:h-[36px] shrink-0" />
          </div>
        </div>
      </div>
    </div>

      {/* Year Configuration card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-5 md:p-6 shadow-sm animate-pulse">
          
        <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-4 mb-5">          
          <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} className="shrink-0" />          
          <Skeleton style={{ width: 140, height: 18 }} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    
          <div className="space-y-2">           
            <Skeleton style={{ width: 65, height: 12 }} />            
            <Skeleton style={{ height: 40 }} className="w-full rounded-lg" />
          </div>
          
          <div className="space-y-2">            
            <Skeleton style={{ width: 60, height: 12 }} />            
            <Skeleton style={{ height: 40 }} className="w-full rounded-lg" />
          </div>
        </div>
      </div>
      
    </div>
  );
}

// ─────────────────────────────────────────────
// Style tokens (same as Student)
// ─────────────────────────────────────────────
const labelClass =
  "text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block";
const editFieldClass =
  "w-full text-sm font-bold text-slate-800 bg-white border border-primary/30 focus:ring-2 focus:ring-primary/10 outline-none px-4 py-2 rounded-md";

// ─────────────────────────────────────────────
// SectionCard
// ─────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-blue-400 shrink-0" />
        <span className="material-symbols-outlined text-[18px] text-gray-400">{icon}</span>
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      </div>
      <div className="p-6 grid md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function CreateAcademicYear() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { refreshAcademics } = useSchoolAdmin();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  // Always show skeleton on first mount — for edit mode it waits for fetch,
  // for create mode it clears after one tick so the transition feels intentional.
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Toast ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch (edit) or dismiss skeleton (create) ──
  useEffect(() => {
    if (!isEditMode) {
      // No data to fetch — just let one paint happen then reveal the form
      const t = setTimeout(() => setInitialLoad(false), 400);
      return () => clearTimeout(t);
    }

    const fetchAcademicYearDetails = async () => {
      try {
        const response = await api.get(`academics/academic-years/${id}/`);
        const data = response.data;
        setName(data.name || "");
        setStartDate(data.start_date || "");
        setEndDate(data.end_date || "");
        setIsActive(data.is_active ?? true);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to load academic year details.");
      } finally {
        setInitialLoad(false);
      }
    };

    fetchAcademicYearDetails();
  }, [id, isEditMode]);

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (new Date(startDate) >= new Date(endDate)) {
      setError("End Date must be strictly after the Start Date.");
      return;
    }

    setLoading(true);
    try {
      const payload = { name, start_date: startDate, end_date: endDate, is_active: isActive };
      if (isEditMode) {
        await api.patch(`academics/academic-years/${id}/`, payload);
      } else {
        await api.post(`academics/academic-years/`, payload);
      }
      showToast(`Academic Year ${isEditMode ? "updated" : "created"} successfully!`);
      await refreshAcademics();
      setTimeout(() => navigate("/school-admin/academic-years"), 1000);
    } catch (err) {
      if (err.response?.data) {
        setError(
          Object.entries(err.response.data)
            .map(([f, v]) => `${f}: ${Array.isArray(v) ? v.join(" ") : v}`)
            .join(" | ")
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`academics/academic-years/${id}/`);
      showToast("Academic Year deleted successfully!", "success");
      await refreshAcademics();
      setTimeout(() => navigate("/school-admin/academic-years"), 1000);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete academic year. Please try again.", "error");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Skeleton ──
  if (initialLoad) {
    return (
      <SchoolLayout title="Academic Years">
        <InjectShimmer />
        <PageSkeleton editMode={isEditMode}/>
      </SchoolLayout>
    );
  }

  // ── Render ──
  return (
    <SchoolLayout title="Academic Years">
      <InjectShimmer />
      <form onSubmit={handleSubmit}>
        <div className="px-4 md:px-8 pt-4 pb-12 space-y-6">

          {/* Toast */}
          {toast && (
            <div
              className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 transition-all duration-300 ${toast.type === "success"
                  ? "bg-success text-white"
                  : toast.type === "error"
                    ? "bg-error text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
            >
              <span className="material-symbols-outlined text-base">
                {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
              </span>
              {toast.msg}
            </div>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Academic Year</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-gray-900">{name}</span>?
                  All associated data will be permanently removed.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isDeleting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Year"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Top Bar ── */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/school-admin/academic-years")}
              className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>

            <div className="flex gap-2">
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 md:px-4 px-2 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-md hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/school-admin/academic-years")}
                className="md:px-4 px-2 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 md:px-4 px-2 py-2 bg-primary text-white text-sm font-bold rounded-md shadow-sm disabled:opacity-70"
              >
                {loading && (
                  <span className="material-symbols-outlined animate-spin text-[16px]">
                    progress_activity
                  </span>
                )}
                {loading ? "Saving..." : isEditMode ? "Update Year" : "Save Year"}
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm font-medium flex gap-2">
              <span className="material-symbols-outlined text-xl shrink-0">error</span>
              {error}
            </div>
          )}

          {/* ── Identity Card ── */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-4 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
              
              {/* Left Block: Icon and Input Element Field */}
              <div className="flex items-center gap-4 md:gap-5 min-w-0 w-full">
                {/* Icon badge hidden on mobile views, visible from tablet (sm) breakpoint up */}
                <div className="hidden sm:flex w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-primary/10 text-primary items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-[24px] md:text-[28px]">calendar_month</span>
                </div>
                
                <div className="flex-1 min-w-0 w-full">
                  <label className={labelClass}>Year Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 2026-2027"
                    className="text-lg md:text-2xl font-headline font-black text-on-surface bg-transparent border-b-2 border-outline-variant/30 focus:border-primary outline-none pb-1 w-full max-w-full sm:max-w-xs transition-colors placeholder:text-on-surface-variant/30 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Right Block: Status Change Action Toggle */}
              <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-outline-variant/10 pt-4 sm:pt-0">
                {/* Visible descriptor label displayed only on mobile viewports for enhanced clarity */}
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 sm:hidden">Institutional Status</span>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 outline-none"
                    style={{ backgroundColor: isActive ? "var(--color-primary)" : "color-mix(in srgb, var(--color-outline-variant) 40%, transparent)" }}
                  >
                    <div
                      className="w-4 h-4 bg-surface-container-lowest rounded-full shadow transition-transform"
                      style={{ transform: isActive ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                  
                  {isActive ? (
                    <span className="bg-success/10 text-success border border-success/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-extrabold text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">
                      Active
                    </span>
                  ) : (
                    <span className="bg-outline-variant/20 text-outline border border-outline-variant/30 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-extrabold text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ── Year Configuration SectionCard ── */}
          <SectionCard title="Year Configuration" icon="date_range">
            <div>
              <p className={labelClass}>Start Date</p>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={editFieldClass}
              />
            </div>
            <div>
              <p className={labelClass}>End Date</p>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={editFieldClass}
              />
            </div>
          </SectionCard>

        </div>
      </form>
    </SchoolLayout>
  );
}