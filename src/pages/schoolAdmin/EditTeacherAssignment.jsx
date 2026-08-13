import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { schoolAdminApi } from "../../services/schoolAdminApi";
import { useSchoolAdmin } from "../../context/SchoolAdminProvider";

// ─────────────────────────────────────────────
// Responsive Fluid Fields & Variables
// ─────────────────────────────────────────────
const labelClass = "text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant/80 mb-1.5 block";
const viewFieldClass = "text-xs md:text-sm font-semibold text-on-surface bg-surface-container-high/50 px-4 py-2.5 rounded-lg border border-outline-variant/10 w-full truncate";
const editFieldClass = "w-full text-xs md:text-sm font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none px-3 py-2 rounded-lg transition";

// ─────────────────────────────────────────────
// Unified Theme-Aware Skeleton Atoms
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
// Full-page skeleton — mirrors exact layout
// ─────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 w-full mx-auto">

      {/* ── Top bar ── */}
      <div className="flex justify-between items-center gap-3">
        <Skeleton style={{ width: 140, height: 20 }} />
        <div className="flex gap-2">
          <Skeleton style={{ width: 80, height: 36, borderRadius: 8 }} />
          <Skeleton style={{ width: 110, height: 36, borderRadius: 8 }} />
        </div>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row  gap-4 text-center sm:text-left w-full">
            <Skeleton style={{ width: 64, height: 64, borderRadius: 12 }} className="shrink-0" />
            <div className="flex flex-col md:items-start gap-2 w-full">
              <Skeleton style={{ width: 220, height: 24 }} />
              <Skeleton style={{ width: 160, height: 14 }} />
            </div>
          </div>
          <div className="shrink-0 hidden md:block">
            <Skeleton style={{ width: 120, height: 36, borderRadius: 8 }} />
          </div>
        </div>
      </div>

      {/* ── Assignment Details card ── */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
          <Skeleton style={{ width: 4, height: 20, borderRadius: 9999 }} />
          <Skeleton style={{ width: 140, height: 16 }} />
        </div>
        {/* Card body — grid */}
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton style={{ width: 90, height: 12 }} />
              <Skeleton style={{ height: 38, borderRadius: 8 }} className="w-full" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────
// SectionCard + Field
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Context Mutation Block Field Wrapper
// ─────────────────────────────────────────────
function Field({ label, viewValue, isEditing, children }) {
  return (
    <div className="min-w-0 w-full">
      <span className={labelClass}>{label}</span>
      {isEditing ? children : <div className={viewFieldClass}>{viewValue || "N/A"}</div>}
    </div>
  );
}

export default function EditTeacherAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    teachers,
    subjects,
    classLevels,
    academicYears,
    fetchSectionsByClass,
  } = useSchoolAdmin();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [assignment, setAssignment] = useState(null);

  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const [sections, setSections] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const assignData = await schoolAdminApi.getTeacherAssignmentById(id);
      setAssignment(assignData);
      setTeacherId(assignData.teacher_id || "");
      setSubjectId(assignData.subject_id || "");
      setClassLevelId(assignData.class_level_id || "");
      setSectionId(assignData.section_id || "");
      setAcademicYearId(assignData.academic_year_id || "");
      setIsClassTeacher(assignData.is_class_teacher || false);

      if (assignData.class_level_id) {
        const sectionList = await fetchSectionsByClass(assignData.class_level_id);
        setSections(sectionList);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      showToast("Failed to load assignment data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (!classLevelId) { setSections([]); setSectionId(""); return; }
    fetchSectionsByClass(classLevelId)
      .then(setSections)
      .catch(() => setSections([]));
  }, [classLevelId, fetchSectionsByClass]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        teacher: teacherId,
        subject: subjectId,
        class_level: classLevelId,
        section: sectionId || null,
        academic_year: academicYearId,
        is_class_teacher: isClassTeacher,
      };
      await schoolAdminApi.updateTeacherAssignment(id, payload);
      const updated = await schoolAdminApi.getTeacherAssignmentById(id);
      setAssignment(updated);
      setTeacherId(updated.teacher_id || "");
      setSubjectId(updated.subject_id || "");
      setClassLevelId(updated.class_level_id || "");
      setSectionId(updated.section_id || "");
      setAcademicYearId(updated.academic_year_id || "");
      setIsClassTeacher(updated.is_class_teacher || false);
      showToast("Assignment updated successfully!");
      setIsEditing(false);
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
        : "Failed to update assignment.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await schoolAdminApi.deleteTeacherAssignment(id);
      showToast("Assignment deleted successfully!", "success");
      setTimeout(() => navigate("/school-admin/teacher-assignment"), 1000);
    } catch (err) {
      showToast("Failed to delete assignment.", "error");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (assignment) {
      setTeacherId(assignment.teacher_id || "");
      setSubjectId(assignment.subject_id || "");
      setClassLevelId(assignment.class_level_id || "");
      setSectionId(assignment.section_id || "");
      setAcademicYearId(assignment.academic_year_id || "");
      setIsClassTeacher(assignment.is_class_teacher || false);
    }
    setIsEditing(false);
  };

  // ── Skeleton ──
  if (loading) {
    return (
      <SchoolLayout>
        <PageSkeleton />
      </SchoolLayout>
    );
  }

  // ── Derived values ──
  const teacherName = assignment?.teacher_name || "Unknown Teacher";
  const subjectName = assignment?.subject_name || "N/A";
  const classLevelName = assignment?.class_level_name || "N/A";
  const sectionName = assignment?.section_name || "N/A";
  const academicYearName = assignment?.academic_year_name || "N/A";
  const role = assignment?.is_class_teacher ? "Class Teacher" : "Subject Teacher";

  const nameParts = teacherName.trim().split(" ");
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : teacherName.slice(0, 2).toUpperCase();

  return (
    <SchoolLayout>
      <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 mx-auto w-full">

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

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 md:p-6 max-w-md w-full shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error text-xl">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-headline font-bold text-on-surface">Delete Assignment</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Permanently remove records.</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-on-surface-variant mb-6 leading-relaxed">
                Are you sure you want to delete the assignment for <span className="font-bold text-on-surface">{teacherName}</span> — {subjectName} ({classLevelName})?
              </p>
              <div className="flex gap-2.5 justify-end">
                <button onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-outline-variant/20 rounded-lg text-xs md:text-sm font-bold text-on-surface hover:bg-surface-container-high transition">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-4 py-2 bg-error text-white rounded-lg text-xs md:text-sm font-bold hover:bg-error/90 transition flex items-center gap-2 disabled:opacity-50">
                  {deleting ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removing...</>) : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Top Bar ── */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button onClick={() => navigate("/school-admin/teacher-assignment")}
            className="flex items-center gap-1.5 text-primary text-xs md:text-sm font-semibold hover:underline">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-md hover:bg-red-100 transition-colors">
                  <span className="material-symbols-outlined text-base">delete</span>Delete
                </button>
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-fixed text-primary text-sm font-bold rounded-md hover:bg-primary-fixed transition-colors">
                  <span className="material-symbols-outlined text-base">edit</span>Edit Profile
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel}
                  className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-md">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-md shadow-sm disabled:opacity-70">
                  {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Identity Card ── */}
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-4 md:p-6 shadow-sm">
          <div className={`${isEditing ? "flex-col" : "flex flex-col md:flex-row md:items-center justify-between gap-4"}`}>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                {initials}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <p className={labelClass}>Teacher</p>
                      <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={editFieldClass} required>
                        <option value="">Select Teacher</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.first_name} {t.last_name}{t.employee_id ? ` (${t.employee_id})` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className={labelClass}>Subject</p>
                      <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={editFieldClass} required>
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl font-headline font-black text-on-surface truncate">{teacherName}</h2>
                    <p className="text-xs text-on-surface-variant/80 font-mono mt-0.5 truncate">{subjectName}</p>
                  </>
                )}
              </div>
            </div>

            <div className={`${isEditing ? "mt-4" : ""} shrink-0`}>
              {isEditing ? (
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors select-none">
                  <input type="checkbox" checked={isClassTeacher} onChange={() => setIsClassTeacher(!isClassTeacher)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/50 border-outline-variant" />
                  <span className="text-sm font-bold text-primary">Class Teacher</span>
                </label>
              ) : assignment?.is_class_teacher ? (
                <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">stars</span>Class Teacher
                </span>
              ) : (
                <span className="bg-success/10 text-success border border-success/20 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 w-fit">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>Subject Teacher
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Assignment Details SectionCard ── */}
        <SectionCard title="Assignment Details" icon="assignment_ind">
          <Field label="Class Level" viewValue={classLevelName} isEditing={isEditing}>
            <select value={classLevelId} onChange={(e) => { setClassLevelId(e.target.value); setSectionId(""); }} className={editFieldClass} required>
              <option value="">Select Class</option>
              {classLevels.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>

          <Field label="Section" viewValue={sectionName} isEditing={isEditing}>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={editFieldClass} disabled={!classLevelId}>
              <option value="">{classLevelId ? (sections.length ? "Select Section" : "No sections available") : "Pick class first"}</option>
              {sections.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </Field>

          <Field label="Academic Year" viewValue={academicYearName} isEditing={isEditing}>
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className={editFieldClass} required>
              <option value="">Select Academic Year</option>
              {academicYears.map((y) => (<option key={y.id} value={y.id}>{y.name}</option>))}
            </select>
          </Field>

          <Field label="Role" viewValue={role} isEditing={false} />
        </SectionCard>

      </div>
    </SchoolLayout>
  );
}