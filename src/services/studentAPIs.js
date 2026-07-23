import api from "./axiosClient";

const isIgnorableClientError = (error) =>
  error?.response?.status === 404 || error?.response?.status === 403;

// NEW: whenever a 404/403 gets swallowed into an empty fallback, log the
// real status + URL. Without this, a route that's wrong/renamed on the
// backend looks identical in the UI to "this student genuinely has no
// subjects/grades/etc." — which is exactly the bug we're chasing. Safe to
// keep in production, it's just a console.warn.
const logIgnoredError = (label, error) => {
  console.warn(
    `[studentAPIs] "${label}" returned ${error?.response?.status} for ` +
    `${error?.config?.url} — falling back to empty result.`,
  );
};

// ── Profile ──

export const getStudentProfile = async () => {
  const response = await api.get(`/profiles/students/me/`);
  return response.data;
};

export const updateStudentProfile = async (payload) => {
  const response = await api.patch(`/profiles/students/me/`, payload);
  return response.data;
};

export const updateMyPassword = async (userId, password) => {
  const response = await api.patch(`/users/${userId}/`, { password });
  return response.data;
};

export const getStudentParents = async () => {
  try {
    const response = await api.get(`/profiles/students/me/parents/`);
    return response.data.results || response.data || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getStudentParents", error);
      return [];
    }
    throw error;
  }
};

// NOTE: this endpoint's response is NOT just a plain subjects array.
// It's already scoped to the student's current class and looks like:
// {
//   count: 5,
//   results: [ { id, name, code, school, class_levels: [...] }, ... ],
//   class_level:  { id, name },
//   section:      { id, name },
//   academic_year:{ id, name },
// }
// So we return the whole object — both the subject list AND the
// class_level/section/academic_year context — instead of throwing the
// context away. This also means the frontend never needs a second
// request (e.g. fetching the section separately) just to know which
// class level the subjects belong to.
export const getStudentSubjects = async () => {
  try {
    const response = await api.get(`/profiles/students/me/subjects/`);
    return (
      response.data || {
        results: [],
        class_level: null,
        section: null,
        academic_year: null,
      }
    );
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getStudentSubjects", error);
      return { results: [], class_level: null, section: null, academic_year: null };
    }
    throw error;
  }
};

// Returns the raw dashboard object from the backend:
// { class_info, attendance_summary, upcoming_assignments, recent_grades, stats }
export const getStudentDashboard = async () => {
  const response = await api.get(`/profiles/students/dashboard/`);
  return response.data;
};

// ── Academics / enrollment ──

export const getStudentEnrollment = async () => {
  const response = await api.get(`/academics/enrollments/me/`);
  const data = response.data;
  if (Array.isArray(data?.results)) {
    return data.results[0] || null;
  }
  return data;
};

export const getEnrollmentHistory = async () => {
  const response = await api.get(`/academics/enrollments/me/history/`);
  return response.data.results || response.data || [];
};

// Fetches academic years + subjects scoped to the student's class level.
// Returns { years: [...], subs: [...], classLevel, section, academicYear }
// (classLevel/section/academicYear come bundled with the subjects response
// itself — see getStudentSubjects — so no separate section lookup is needed)
export const getAcademicYear = async () => {
  const [yearsRes, subjectsRes] = await Promise.all([
    api.get(`/academics/academic-years/`),
    getStudentSubjects(),
  ]);
  return {
    years: yearsRes.data.results || [],
    subs: subjectsRes.results || [],
    classLevel: subjectsRes.class_level || null,
    section: subjectsRes.section || null,
    academicYear: subjectsRes.academic_year || null,
  };
};

export const getSectionById = async (sectionId) => {
  const response = await api.get(`/academics/sections/${sectionId}/`);
  return response.data;
};

// ── Attendance ──

export const getAttendanceRecords = async (params = {}) => {
  try {
    const response = await api.get(`/operations/attendance/me/`, { params });
    return response.data.results || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getAttendanceRecords", error);
      return [];
    }
    throw error;
  }
};

export const getAttendanceSummary = async () => {
  const response = await api.get(`/operations/attendance/me/summary/`);
  return response.data;
};

// ── Grades & exams ──

export const getGrades = async () => {
  try {
    const response = await api.get(`/operations/grades/me/`);
    return response.data.results || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getGrades", error);
      return [];
    }
    throw error;
  }
};

export const getReportCard = async () => {
  const response = await api.get(`/operations/grades/me/report-card/`);
  return response.data;
};

export const getExams = async () => {
  const response = await api.get(`/operations/exams/me/`);
  return response.data.results || response.data;
};

export const getUpcomingExams = async () => {
  const response = await api.get(`/operations/exams/me/upcoming/`);
  return response.data.results || response.data;
};

// ── Assignments ──

export const getAssignments = async () => {
  try {
    const response = await api.get(`/operations/assignments/me/`);
    return response.data.results || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getAssignments", error);
      return [];
    }
    throw error;
  }
};

export const getUpcomingAssignments = async () => {
  try {
    const response = await api.get(`/operations/assignments/me/upcoming/`);
    return response.data.results || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getUpcomingAssignments", error);
      return [];
    }
    throw error;
  }
};

// ── Submissions ──

export const getSubmissions = async () => {
  try {
    const response = await api.get(`/operations/submissions/me/`);
    return response.data.results || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getSubmissions", error);
      return [];
    }
    throw error;
  }
};

// NOTE: removed getPendingDrafts() (/operations/submissions/my-pending-drafts/)
// — not in the current routes table. The new request-upload/confirm flow
// has no draft concept to query, so this had nothing left to call.

// ── Submission upload flow ──
// Per the current routes table, this is a 2-step flow (no draft concept):
//   1) POST /operations/submissions/request-upload/  → get a signed R2 upload URL
//   2) PUT  {upload_url}                              → direct upload to R2
//   3) POST /operations/submissions/confirm/          → create the submission

export const requestUploadUrl = async (assignmentId, fileName, contentType) => {
  const response = await api.post(`/operations/submissions/request-upload/`, {
    assignment_id: assignmentId,
    file_name: fileName,
    content_type: contentType || "application/octet-stream",
  });
  return response.data; // { upload_url, file_path, expires_at, ... }
};

export const uploadFileToSignedUrl = async (uploadUrl, file) => {
  // Direct PUT straight to storage (R2/S3) — intentionally NOT using the
  // `api` client here, since that would attach our auth header / base URL
  // to a request that's going to a different host with its own signed auth.
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) {
    throw new Error(`Upload to storage failed with status ${res.status}`);
  }
};

// The upload_url's path includes the R2 bucket name as its first segment
// (e.g. /ai-cos/submissions/.../file.pdf). The confirm/ endpoint expects
// the path WITHOUT that bucket segment — so we derive it from the URL
// instead of trusting the raw `file_path` field on the request-upload
// response (that field is what was including the bucket name and causing
// confirm/ to fail).
const extractFilePathFromUrl = (uploadUrl) => {
  const url = new URL(uploadUrl);
  let path = url.pathname;
  if (path.startsWith("/")) path = path.substring(1);
  const parts = path.split("/");
  parts.shift(); // drop the bucket name (first segment)
  return parts.join("/");
};

export const confirmSubmission = async (assignmentId, filePath) => {
  const response = await api.post(`/operations/submissions/confirm/`, {
    assignment_id: assignmentId,
    file_path: filePath,
  });
  return response.data;
};

// Convenience wrapper: runs all 3 upload steps for a given File object.
// Public signature (assignmentId, file) is unchanged, so callers like
// Assignments.jsx don't need to know the route names changed underneath.
export const submitAssignment = async (assignmentId, file) => {
  const { upload_url } = await requestUploadUrl(assignmentId, file.name, file.type);
  await uploadFileToSignedUrl(upload_url, file);
  const actualFilePath = extractFilePathFromUrl(upload_url);
  return confirmSubmission(assignmentId, actualFilePath);
};

// ── Combined dashboard fetch ──
// Fetches all data needed by the Dashboard page in parallel.
// Returns a single object consumed by StudentProvider under the "dashboard" key:
//   {
//     dashboardRaw:      raw /profiles/students/dashboard/ response,
//     attendanceSummary: raw /operations/attendance/me/summary/ response,
//     grades:            { results: [...] }  from /operations/grades/me/,
//     reportCard:        raw /operations/grades/me/report-card/ response,
//   }
export const getStudentDashboardData = async () => {
  const [dashboardResult, attendanceSummaryResult, gradesResult, reportCardResult] =
    await Promise.allSettled([
      getStudentDashboard(),
      getAttendanceSummary(),
      getGrades(),
      getReportCard(),
    ]);

  if (dashboardResult.status === "rejected") {
    console.error("Failed to load dashboard:", dashboardResult.reason);
  }
  if (attendanceSummaryResult.status === "rejected") {
    console.error("Failed to load attendance summary:", attendanceSummaryResult.reason);
  }
  if (gradesResult.status === "rejected") {
    console.error("Failed to load grades:", gradesResult.reason);
  }
  if (reportCardResult.status === "rejected") {
    console.error("Failed to load report card:", reportCardResult.reason);
  }

  return {
    // The raw payload from /profiles/students/dashboard/
    // Fields: class_info, attendance_summary, upcoming_assignments, recent_grades, stats
    dashboardRaw: dashboardResult.status === "fulfilled" ? dashboardResult.value : null,

    // { total_days, present, absent, late, half_day, attendance_percentage }
    attendanceSummary:
      attendanceSummaryResult.status === "fulfilled" ? attendanceSummaryResult.value : null,

    // Wrapped so consumers can do dashboard.grades.results consistently
    grades: { results: gradesResult.status === "fulfilled" ? gradesResult.value : [] },

    // { overall_percentage, exams: [...] }
    reportCard: reportCardResult.status === "fulfilled" ? reportCardResult.value : null,
  };
};

// ── Circulars ──

export const getCirculars = async () => {
  try {
    const response = await api.get(`/school-admin/circulars/`);
    return response.data.results || response.data || [];
  } catch (error) {
    if (isIgnorableClientError(error)) {
      logIgnoredError("getCirculars", error);
      return [];
    }
    throw error;
  }
};