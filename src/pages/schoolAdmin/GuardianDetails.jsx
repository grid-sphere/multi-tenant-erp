import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import api from "../../services/axiosClient";

// ─────────────────────────────────────────────
// Skeleton Loader (shimmer)
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

// ─────────────────────────────────────────────
// Helpers (mirrors StudentDetails)
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

function Field({ label, viewValue, isEditing, children }) {
  return (
    <div className="min-w-0 w-full">
      <span className={labelClass}>{label}</span>
      {isEditing ? children : <div className={viewFieldClass}>{viewValue || "N/A"}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function GuardianDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [parent, setParent] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    occupation: "",
    emergency_contact_number: "",
    is_archived: false,
  });

  // ── Toast helper ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch parent ──
  const fetchParent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`profiles/parents/${id}/`);
      const data = response.data;
      setParent(data);

      // IMPORTANT: parent.user is a UUID string, NOT an object.
      const uid = typeof data.user === "object" ? data.user?.id : data.user;
      setUserId(uid);

      // Determine archived status – from the profile or fallback to user.is_active
      let isArchived = !!data.is_archived;
      if (uid && !data.is_archived) {
        try {
          const userRes = await api.get(`users/${uid}/`);
          isArchived = userRes.data.is_active === false;
        } catch (_) { /* ignore */ }
      }

      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || data.user?.email || "",
        phone_number: data.phone_number || "",
        occupation: data.occupation || "",
        emergency_contact_number: data.emergency_contact_number || "",
        is_archived: isArchived,
      });
    } catch (err) {
      setError("Failed to load guardian details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParent();
  }, [id]);

  // ── Save handler ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update parent profile fields including is_archived
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        occupation: formData.occupation,
        emergency_contact_number: formData.emergency_contact_number,
        is_archived: formData.is_archived,
      };
      await api.patch(`profiles/parents/${id}/`, payload);

      // 2. If we have the user ID, sync the user's is_active and name/email
      if (userId) {
        await api.patch(`users/${userId}/`, {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_active: !formData.is_archived,
        });
      }

      await fetchParent();
      setIsEditing(false);
      showToast("Guardian updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      const msg = err.response?.data
        ? Object.entries(err.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ")
        : "Failed to save changes.";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`profiles/parents/${id}/`);
      showToast("Guardian deleted successfully!", "success");
      setTimeout(() => navigate("/school-admin/parents"), 1000);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete guardian. Please try again.", "error");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Loading state (Matches Student Details Structure precisely) ──
  if (loading) {
    return (
      <SchoolLayout>
        <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 w-full mx-auto animate-pulse">
          {/* Top Bar Skeleton */}
          <div className="flex justify-between items-center gap-3">
            <Skeleton style={{ width: 80, height: 20 }} />
            <div className="flex gap-2">
              <Skeleton style={{ width: 90, height: 36 }} />
              <Skeleton style={{ width: 120, height: 36 }} />
            </div>
          </div>

          {/* Identity Header Card Skeleton */}
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full">
                <Skeleton style={{ width: 64, height: 64, borderRadius: 12 }} className="shrink-0" />
                <div className="flex flex-col md:items-start items-center gap-2 w-full">
                  <Skeleton style={{ width: 220, height: 24 }} />
                  <Skeleton style={{ width: 160, height: 14 }} />
                </div>
              </div>
              <div className="shrink-0">
                <Skeleton style={{ width: 90, height: 28, borderRadius: 9999 }} />
              </div>
            </div>
          </div>

          {/* Guardian Profile Card Skeleton */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
              <Skeleton style={{ width: 4, height: 20, borderRadius: 9999 }} />
              <Skeleton style={{ width: 140, height: 16 }} />
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton style={{ width: 90, height: 12 }} />
                  <Skeleton style={{ height: 38, borderRadius: 8 }} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SchoolLayout>
    );
  }

  if (error || !parent) {
    return (
      <SchoolLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
          <p className="text-on-surface-variant font-medium">{error || "Guardian not found."}</p>
          <button onClick={() => navigate("/school-admin/parents")} className="mt-4 bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm">
            Back
          </button>
        </div>
      </SchoolLayout>
    );
  }

  // ── Render ──
  const displayName = `${formData.first_name} ${formData.last_name}`.trim() || parent.email || "Unknown Guardian";
  const emailAddr = parent.email || parent.user?.email || "No Email";
  const isArchived = formData.is_archived || false;

  const fName = parent.first_name || "";
  const lName = parent.last_name || "";
  const initials = fName && lName ? `${fName[0]}${lName[0]}`.toUpperCase() : "GU";

  return (
    <SchoolLayout>
      <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 mx-auto w-full">

        {/* Global Action Notifications Toast */}
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

        {/* Responsive Modal Overlay */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 md:p-6 max-w-md w-full shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error text-xl">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-headline font-bold text-on-surface">Delete Profile</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Permanently remove records.</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-on-surface-variant mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-on-surface">{displayName}</span>? This structural framework mutation cannot be undone.
              </p>
              <div className="flex gap-2.5 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-outline-variant/20 rounded-lg text-xs md:text-sm font-bold text-on-surface hover:bg-surface-container-high transition">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-error text-white rounded-lg text-xs md:text-sm font-bold hover:bg-error/90 transition flex items-center gap-2 disabled:opacity-50">
                  {isDeleting ? "Removing..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Back Navigation Strip */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button onClick={() => navigate("/school-admin/parents")} className="flex items-center gap-1.5 text-primary text-xs md:text-sm font-semibold hover:underline">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
          </button>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-md hover:bg-red-100 transition-colors">
                  <span className="material-symbols-outlined text-base">delete</span> Delete
                </button>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-fixed text-primary text-sm font-bold rounded-md hover:bg-primary-fixed transition-colors">
                  <span className="material-symbols-outlined text-base">edit</span> Edit Profile
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditing(false); fetchParent(); }} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-md">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-md shadow-sm disabled:opacity-70">
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Identity Section Header Module */}
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
                      <input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="First Name" className={editFieldClass} />
                      <input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="Last Name" className={editFieldClass} />
                    </div>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email Address" className={`${editFieldClass} font-mono`} />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl font-headline font-black text-on-surface truncate">{displayName}</h2>
                    <p className="text-xs text-on-surface-variant/80 font-mono mt-0.5 truncate">{emailAddr}</p>
                  </>
                )}
              </div>
            </div>

            {/* Fully Responsive & Correctly Styled Archive/Active Toggle Strip */}
            <div className="shrink-0 flex justify-center items-center">
              {isEditing ? (
                <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-surface-container-high/40 p-1 rounded-xl border border-outline-variant/10">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, is_archived: false }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                      !formData.is_archived 
                        ? "bg-success text-white shadow-sm" 
                        : "text-on-surface-variant hover:bg-surface-container-highest/50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full transition-colors ${!formData.is_archived ? "bg-white" : "bg-outline"}`}></span>
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, is_archived: true }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                      formData.is_archived 
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
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Guardian Profile Data Grid */}
        <SectionCard title="Guardian Profile" icon="assignment_ind" accentColor="var(--color-primary)">
          <Field label="Phone Number" viewValue={parent.phone_number} isEditing={isEditing}>
            <input value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className={editFieldClass} placeholder="+91 98765 43210" />
          </Field>

          <Field label="Occupation" viewValue={parent.occupation} isEditing={isEditing}>
            <input value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} className={editFieldClass} placeholder="e.g. Software Engineer" />
          </Field>

          <Field label="Emergency Contact" viewValue={parent.emergency_contact_number} isEditing={isEditing}>
            <input value={formData.emergency_contact_number} onChange={e => setFormData({ ...formData, emergency_contact_number: e.target.value })} className={editFieldClass} placeholder="+91 98765 43210" />
          </Field>
        </SectionCard>

      </div>
    </SchoolLayout>
  );
}