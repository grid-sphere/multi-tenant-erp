import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { schoolAdminApi } from "../../services/schoolAdminApi";
import { useSchoolAdmin } from "../../context/SchoolAdminProvider";
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
// Responsive Fluid Fields
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
export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    academicYears,
    classLevels,
    fetchSectionsByClass,
  } = useSchoolAdmin();

  const [student, setStudent] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "",
    enrollment_number: "", date_of_birth: "",
    phone_number: "", blood_group: "", address: "",
    is_archived: false,
  });

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [sections, setSections] = useState([]);

  // ── Toast helper ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch all data ──
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [studentData, enrollmentRes] = await Promise.all([
        schoolAdminApi.getStudentById(id),
        api.get(`academics/enrollments/?student=${id}`),
      ]);

      setStudent(studentData);
      setFormData({
        first_name: studentData.first_name || "",
        last_name: studentData.last_name || "",
        email: studentData.email || studentData.user?.email || "",
        enrollment_number: studentData.enrollment_number || "",
        date_of_birth: studentData.date_of_birth || "",
        phone_number: studentData.phone_number || "",
        blood_group: studentData.blood_group || "",
        address: studentData.address || "",
        is_archived: !!studentData.is_archived,
      });

      const results = enrollmentRes.data?.results || enrollmentRes.data || [];
      if (results.length > 0) {
        const enr = results[0];
        setEnrollment(enr);
        setEnrollmentId(enr.id);
        setSelectedYear(String(enr.academic_year || ""));
        setSelectedClass(String(enr.class_level || ""));
        setSelectedSection(String(enr.section || ""));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load student details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id, location.state?.refresh]);

  // ── Fetch sections on class change ──
  useEffect(() => {
    if (!selectedClass) { setSections([]); return; }
    fetchSectionsByClass(selectedClass)
      .then(setSections)
      .catch(() => setSections([]));
  }, [selectedClass, fetchSectionsByClass]);

  // ── Save handler ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await schoolAdminApi.updateStudent(id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        enrollment_number: formData.enrollment_number,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth || null,
        blood_group: formData.blood_group || null,
        address: formData.address || null,
        is_archived: formData.is_archived,
      });

      if (selectedClass && selectedYear) {
        const enrollmentPayload = {
          student: id,
          academic_year: selectedYear,
          class_level: selectedClass,
          section: selectedSection || null,
        };
        if (enrollmentId) {
          await api.patch(`academics/enrollments/${enrollmentId}/`, enrollmentPayload);
        } else {
          await api.post(`academics/enrollments/`, enrollmentPayload);
        }
      }

      await fetchAll();
      setIsEditing(false);
      showToast("Student updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      const data = err.response?.data;
      if (data && typeof data === "object") {
        showToast("Failed to save properties.", "error");
      } else {
        showToast("Failed to save changes.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/profiles/students/${id}/`);
      showToast("Student deleted successfully!", "success");
      setTimeout(() => navigate("/school-admin/students"), 1000);
    } catch (err) {
      showToast("Failed to delete student.", "error");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Loading state ──
 // ── Loading state ──
  if (loading) {
    return (
      <SchoolLayout>
        <div className="flex flex-col gap-4 px-4 md:px-8 pt-4 pb-12 w-full mx-auto">
          
          {/* Header Action Strip Skeleton */}
          <div className="flex justify-between items-center gap-3">
            <Skeleton style={{ width: 80, height: 20 }} />
            <div className="flex gap-2">
              <Skeleton style={{ width: 90, height: 36 }} />
              <Skeleton style={{ width: 120, height: 36 }} />
            </div>
          </div>

          {/* Identity Section Header Module Skeleton */}
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

          {/* Academic Profile Card Skeleton */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
              <Skeleton style={{ width: 4, height: 20, borderRadius: 9999 }} />
              <Skeleton style={{ width: 140, height: 16 }} />
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton style={{ width: 90, height: 12 }} />
                  <Skeleton style={{ height: 38, borderRadius: 8 }} className="w-full" />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-col gap-2">
                <Skeleton style={{ width: 120, height: 12 }} />
                <Skeleton style={{ height: 62, borderRadius: 8 }} className="w-full" />
              </div>
            </div>
          </div>

          {/* Class Enrollment Card Skeleton */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
              <Skeleton style={{ width: 4, height: 20, borderRadius: 9999 }} />
              <Skeleton style={{ width: 160, height: 16 }} />
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton style={{ width: 100, height: 12 }} />
                  <Skeleton style={{ height: 38, borderRadius: 8 }} className="w-full" />
                </div>
              ))}
              <div className="sm:col-span-2 flex flex-col gap-2">
                <Skeleton style={{ width: 110, height: 12 }} />
                <Skeleton style={{ height: 38, borderRadius: 8 }} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </SchoolLayout>
    );
  }

  if (error || !student) {
    return (
      <SchoolLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
          <p className="text-on-surface-variant font-medium">{error || "Student not found."}</p>
          <button onClick={() => navigate("/school-admin/students")} className="mt-4 bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm">
            Back
          </button>
        </div>
      </SchoolLayout>
    );
  }

  // ── Render ──
  const fName = student.first_name || student.user?.first_name || "";
  const lName = student.last_name || student.user?.last_name || "";
  const displayName = `${fName} ${lName}`.trim() || student.user?.email || "Unknown Student";
  const emailAddr = student.email || student.user?.email || "No Email";
  const initials = fName && lName ? `${fName[0]}${lName[0]}`.toUpperCase() : "ST";

  const yearName = academicYears.find(y => String(y.id) === String(selectedYear))?.name || "N/A";
  const classTitle = classLevels.find(c => String(c.id) === String(selectedClass))?.name || "N/A";
  const sectionName = sections.find(s => String(s.id) === String(selectedSection))?.name || enrollment?.section_name || (selectedSection ? `Section ${selectedSection}` : "N/A");

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

        {/* Responsive Modal overlay block code template */}
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

        {/* Context Back navigation strip controller */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <button onClick={() => navigate("/school-admin/students")} className="flex items-center gap-1.5 text-primary text-xs md:text-sm font-semibold hover:underline">
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
                <button onClick={() => { setIsEditing(false); fetchAll(); }} className="px-4 py-2 text-sm text-gray-500 font-bold hover:bg-gray-100 rounded-md">
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

            <div className="shrink-0 flex justify-center">
              {isEditing ? (
                <div className="flex gap-2 bg-surface-container-high/40 p-1 rounded-xl border border-outline-variant/10">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, is_archived: false }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${!formData.is_archived ? "bg-success text-white shadow-sm" : "text-on-surface-variant"}`}>
                    Active
                  </button>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, is_archived: true }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${formData.is_archived ? "bg-outline text-white shadow-sm" : "text-on-surface-variant"}`}>
                    Archived
                  </button>
                </div>
              ) : student.is_archived ? (
                <span className="bg-outline-variant/20 text-outline px-3.5 py-1.5 rounded-full font-extrabold text-2xs uppercase tracking-wider border border-outline-variant/30">Archived Profile</span>
              ) : (
                <span className="bg-success/10 text-success px-3.5 py-1.5 rounded-full font-extrabold text-2xs uppercase tracking-wider border border-success/20 flex items-center gap-1"> Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Academic Profile */}
        <SectionCard title="Academic Data" icon="assignment_ind" accentColor="var(--color-primary)">
          <Field label="Enrollment Number" viewValue={student.enrollment_number} isEditing={isEditing}>
            <input value={formData.enrollment_number} onChange={e => setFormData({ ...formData, enrollment_number: e.target.value })} className={editFieldClass} placeholder="STU-2026-001" />
          </Field>
          <Field label="Date of Birth" viewValue={student.date_of_birth} isEditing={isEditing}>
            <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className={editFieldClass} />
          </Field>
          <Field label="Phone Number" viewValue={student.phone_number} isEditing={isEditing}>
            <input value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className={editFieldClass} placeholder="Contact phone number" />
          </Field>
          <Field label="Blood Group" viewValue={student.blood_group} isEditing={isEditing}>
            <select value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })} className={editFieldClass}>
              <option value="">Select Group</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2 w-full min-w-0">
            <Field label="Residential Address" viewValue={student.address} isEditing={isEditing}>
              <textarea rows="2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={`${editFieldClass} resize-none`} placeholder="Full physical residence address details" />
            </Field>
          </div>
        </SectionCard>

        {/* Class Enrollment */}
        <SectionCard title="Class Enrollment Setup" icon="school" accentColor="var(--color-secondary)">
          <Field label="Academic Year" viewValue={yearName} isEditing={isEditing}>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={editFieldClass}>
              <option value="">Select Year</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </Field>
          <Field label="Class Level" viewValue={classTitle} isEditing={isEditing}>
            <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(""); }} className={editFieldClass}>
              <option value="">Select Class</option>
              {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2 w-full min-w-0">
            <Field label="Assigned Section" viewValue={sectionName} isEditing={isEditing}>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className={editFieldClass} disabled={!selectedClass}>
                <option value="">{selectedClass ? (sections.length ? "Select Section" : "No sections defined") : "Select class level parameter first"}</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        </SectionCard>

      </div>
    </SchoolLayout>
  );
}