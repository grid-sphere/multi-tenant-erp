import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { schoolAdminApi } from "../../services/schoolAdminApi";
import api from "../../services/axiosClient";

// ─────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────
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

function TeacherDetailsSkeleton() {
  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <Skeleton style={{ width: 50, height: 20 }} />
        <div className="flex gap-2">
          <Skeleton style={{ width: 100, height: 36, borderRadius: 8 }} />
          <Skeleton style={{ width: 100, height: 36, borderRadius: 8 }} />
        </div>
      </div>

      {/* Identity Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <Skeleton style={{ width: 64, height: 64, borderRadius: 16 }} />
          <div className="flex-1">
            <Skeleton style={{ width: 150, height: 24 }} />
            <Skeleton style={{ width: 100, height: 14, marginTop: 4 }} />
          </div>
          <Skeleton style={{ width: 100, height: 36, borderRadius: 8 }} />
        </div>
      </div>

      {/* Professional Details */}
      <div className="bg-bg-surface-container-lowest rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <Skeleton style={{ width: 140, height: 16 }} />
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={i === 2 ? "md:col-span-2" : ""}>
              <Skeleton style={{ width: 80, height: 10 }} />
              <Skeleton style={{ width: "100%", height: 40, marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const labelClass = "text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5 block";
const viewFieldClass = "text-xs md:text-sm font-semibold text-on-surface bg-surface-container-high/50 px-4 py-2.5 rounded-lg border border-outline-variant/10 w-full truncate";
const editFieldClass = "w-full text-xs md:text-sm font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-3 py-2 rounded-lg transition";

function SectionCard({ title, icon, accentColor = "var(--color-primary)", children }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: accentColor }}></span>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">{icon}</span>
        <h3 className="text-sm font-headline font-bold text-on-surface">{title}</h3>
      </div>
      <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">{children}</div>
    </div>
  );
}

function Field({ label, viewValue, isEditing, children, colSpan = false }) {
  return (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <p className={labelClass}>{label}</p>
      {isEditing ? children : <p className={viewFieldClass}>{viewValue || "N/A"}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function TeacherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "",
    employee_id: "", qualification: "",
    joining_date: "", phone_number: "",
    is_archived: false,
  });

  // ── Toast helper ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch teacher ──
  const fetchTeacher = async () => {
    try {
      setLoading(true);
      const data = await schoolAdminApi.getTeacherById(id);
      const userId = typeof data.user === "object" ? data.user?.id : data.user;
      setUserId(userId);

      // Determine archived status from profile + user
      let isArchived = !!data.is_archived;
      if (userId) {
        try {
          const userRes = await api.get(`users/${userId}/`);
          isArchived = userRes.data.is_active === false;
        } catch (_) { /* fallback to profile value */ }
      }

      setTeacher(data);
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        employee_id: data.employee_id || "",
        qualification: data.qualification || "",
        joining_date: data.joining_date || "",
        phone_number: data.phone_number || "",
        is_archived: isArchived,
      });
    } catch (err) {
      setError("Failed to load faculty details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeacher(); }, [id]);

  // ── Save handler ──
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // 1. PATCH teacher profile – include is_archived if the serializer allows it
      const teacherPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        employee_id: formData.employee_id,
        qualification: formData.qualification || null,
        phone_number: formData.phone_number || null,
        joining_date: formData.joining_date || null,
        is_archived: formData.is_archived,   // <— ADDED to sync profile status
      };
      await schoolAdminApi.updateTeacher(id, teacherPayload);

      // 2. PATCH user is_active – sync with archived status
      if (userId) {
        await api.patch(`users/${userId}/`, {
          is_active: !formData.is_archived,
        });
      }

      await fetchTeacher();
      setIsEditing(false);
      showToast("Teacher updated successfully!");
    } catch (err) {
      console.error("Failed to update:", err);
      const msg = err.response?.data
        ? Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ")
        : "Failed to save changes. Please check your connection.";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the teacher profile (and user should cascade if configured)
      await api.delete(`/profiles/teachers/${id}/`);
      showToast("Teacher deleted successfully!", "success");
      setTimeout(() => navigate("/school-admin/teachers"), 1000);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete teacher. Please try again.", "error");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Skeleton Loading ──
  if (loading) {
    return (
      <SchoolLayout title="Teacher Details">
        <TeacherDetailsSkeleton />
      </SchoolLayout>
    );
  }

  if (error || !teacher) {
    return (
      <SchoolLayout title="Teacher Details">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <p className="text-gray-500">{error || "Teacher not found."}</p>
            <button
              onClick={() => navigate("/school-admin/teachers")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
            >
              Back
            </button>
          </div>
        </div>
      </SchoolLayout>
    );
  }

  // ── Render ──
  const fName = teacher.first_name || teacher.user?.first_name || "";
  const lName = teacher.last_name || teacher.user?.last_name || "";
  const displayName = `${fName} ${lName}`.trim() || teacher.user?.email || "Unknown";
  const emailAddr = teacher.email || teacher.user?.email || "No Email";
  const initials = fName && lName ? `${fName[0]}${lName[0]}`.toUpperCase() : "TR";
  const isArchived = formData.is_archived || false;

  return (
    <SchoolLayout title="Teacher Details">
      <div className="px-4 md:px-8 py-6 space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 transition-all duration-300 ${toast.type === "success"
              ? "bg-success text-white"
              : toast.type === "error"
                ? "bg-error text-white"
                : "bg-gray-100 text-gray-800"
            }`}>
            <span className="material-symbols-outlined text-base">
              {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
            </span>
            {toast.msg}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Teacher</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">{displayName}</span>?
                All associated data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
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
                    "Delete Teacher"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={() => navigate("/school-admin/teachers")}
            className="flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
          </button>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-md hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-fixed text-primary text-sm font-bold rounded-md hover:bg-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit Profile
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsEditing(false); fetchTeacher(); }}
                  className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-md shadow-sm disabled:opacity-70"
                >
                  {isSaving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Identity Header Card */}
         <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full min-w-0">
              <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg md:text-xl border border-primary/20">
                {initials}
              </div>
              <div className="w-full min-w-0">
                {isEditing ? (
                  <div className="flex flex-col gap-2 w-full max-w-md mx-auto sm:mx-0">
                    <div className="flex gap-2">
                      <input
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="First Name"
                        className={editFieldClass}
                      />
                      <input
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Last Name"
                        className={editFieldClass}
                      />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email Address"
                      className={`${editFieldClass} font-mono text-xs`}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl font-headline font-black text-on-surface truncate">{displayName}</h2>
                    <p className="text-xs text-on-surface-variant/80 font-mono mt-0.5 truncate">{emailAddr}</p>
                  </>
                )}
              </div>
            </div>

            {/* Status badge / toggle */}
            <div className="shrink-0 flex justify-center">
              {isEditing ? (
                <div className="flex gap-2 bg-surface-container-high/40 p-1 rounded-xl border border-outline-variant/10 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, is_archived: false }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                      !isArchived 
                        ? "bg-success text-white shadow-sm" 
                        : "text-on-surface-variant hover:bg-surface-container-highest/50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-colors ${!isArchived ? "bg-white" : "bg-outline"}`}></span>
                    Active
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, is_archived: true }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                      isArchived 
                        ? "bg-outline text-white shadow-sm" 
                        : "text-on-surface-variant hover:bg-surface-container-highest/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                    Archived
                  </button>
                </div>
              ) : isArchived ? (
                <span className="bg-outline-variant/20 text-outline px-3.5 py-1.5 rounded-full font-extrabold text-2xs uppercase tracking-wider border border-outline-variant/30 flex items-center gap-1.5">
                  Archived Profile
                </span>
              ) : (
                <span className="bg-success/10 text-success px-3.5 py-1.5 rounded-full font-extrabold text-2xs uppercase tracking-wider border border-success/20 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> 
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <SectionCard title="Professional Details" icon="school" accentColor="var(--color-primary)">
          <Field label="Employee ID" viewValue={teacher.employee_id} isEditing={isEditing}>
            <input value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} className={editFieldClass} placeholder="e.g. EMP-2024" />
          </Field>
          <Field label="Email Address" viewValue={emailAddr} isEditing={isEditing}>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={editFieldClass} placeholder="email@example.com" />
          </Field>
          <Field label="Qualification" viewValue={teacher.qualification || "Unspecified"} isEditing={isEditing}>
            <input value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} className={editFieldClass} placeholder="e.g. PhD, M.Sc" />
          </Field>
          <Field label="Joining Date" viewValue={teacher.joining_date} isEditing={isEditing}>
            <input type="date" value={formData.joining_date} onChange={e => setFormData({ ...formData, joining_date: e.target.value })} className={editFieldClass} />
          </Field>
          <Field label="Phone Number" viewValue={teacher.phone_number} isEditing={isEditing}>
            <input value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className={editFieldClass} placeholder="+91 98765 43210" />
          </Field>
        </SectionCard>

      </div>
    </SchoolLayout>
  );
}