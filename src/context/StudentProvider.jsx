import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getStudentProfile,
  getStudentDashboardData,
  getStudentEnrollment,
  getStudentParents,
  getAcademicYear,
  getAssignments,
  getSubmissions,
  getStudentAttendanceRecords,
} from "../services/studentAPIs";

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [contextData, setContextData] = useState({
    profile: null,
    dashboard: null,
    enrollment: null,
    parents: [],
    academic: { years: [], subs: [] },
    assignments: [],
    submissions: [],
    attendanceRecords: [],
  });
  const [loading, setLoading] = useState(true);

  // A method to refresh specific data (like submissions after upload)
  const refreshSubmissions = async () => {
    const subs = await getSubmissions();
    setContextData((prev) => ({ ...prev, submissions: subs }));
<<<<<<< Updated upstream
  };
=======
  }, []);

  const refreshCirculars = useCallback(async () => {
    const circulars = await getCirculars();
    setContextData((prev) => ({ ...prev, circulars }));
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const results = await Promise.allSettled([
        getStudentProfile(),
        getStudentDashboardData(),
        getStudentEnrollment(),
        getStudentParents(),
        getAcademicYear(),
        getAssignments(),
        getSubmissions(),
        getAttendanceRecords(),
        getCirculars(),
      ]);

      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`Failed to load "${LOAD_LABELS[i]}":`, r.reason);
        }
      });

      const [
        profileResult,
        dashboardResult,
        enrollmentResult,
        parentsResult,
        academicResult,
        assignmentsResult,
        submissionsResult,
        attendanceRecordsResult,
        circularsResult,
      ] = results;

      const profile = profileResult.status === "fulfilled" && profileResult.value
        ? profileResult.value
        : { id: "mock-student", user: { first_name: "Mock", last_name: "Student", email: "student@example.com" } };

      const dashboard = dashboardResult.status === "fulfilled" && dashboardResult.value
        ? dashboardResult.value
        : { stats: { total_assignments: 5, total_exams: 3 } };

      const enrollment = enrollmentResult.status === "fulfilled" && enrollmentResult.value
        ? enrollmentResult.value
        : { class_level_name: "Grade 10", section_name: "A", roll_number: "10A-01", academic_year_name: "2026-2027" };

      const parents = parentsResult.status === "fulfilled" && parentsResult.value
        ? parentsResult.value
        : [];

      const academic = academicResult.status === "fulfilled" && academicResult.value
        ? academicResult.value
        : { years: [], subs: [] };

      const assignments = assignmentsResult.status === "fulfilled" && assignmentsResult.value
        ? assignmentsResult.value
        : [];

      const submissions = submissionsResult.status === "fulfilled" && submissionsResult.value
        ? submissionsResult.value
        : [];

      // ✅ FIX: getAttendanceRecords() already returns a plain array
      // (response.data.results || []) — it is NOT an object with a
      // `.records` key. Only fall back to MOCK_ATTENDANCE.records when
      // the call actually failed.
      const attendanceRecords = attendanceRecordsResult.status === "fulfilled" && attendanceRecordsResult.value
        ? attendanceRecordsResult.value
        : MOCK_ATTENDANCE.records;

      const circulars = circularsResult.status === "fulfilled" && circularsResult.value
        ? circularsResult.value
        : [];

      setContextData({
        profile,
        dashboard,
        enrollment,
        parents,
        academic,
        assignments,
        submissions,
        attendanceRecords,
        circulars,
      });

    } catch (err) {
      console.error("Failed to load global student data", err);
    } finally {
      setLoading(false);
    }
  }, []);
>>>>>>> Stashed changes

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user_data"));
        const studentId = userData?.profiles?.student?.id;

        if (!studentId) throw new Error("No student ID found.");

        const [
          profile,
          dashboard,
          enrollment,
          parentsData,
          academic,
          assignments,
          submissions,
          attendanceRecords,
        ] = await Promise.all([
          getStudentProfile(studentId),
          getStudentDashboardData(studentId),
          getStudentEnrollment(studentId),
          getStudentParents(),
          getAcademicYear(),
          getAssignments(),
          getSubmissions(),
          getStudentAttendanceRecords(studentId),
        ]);

        setContextData({
          profile,
          dashboard,
          enrollment,
          parents: parentsData.filter((p) => p.student === studentId),
          academic,
          assignments,
          submissions,
          attendanceRecords,
        });
      } catch (err) {
        console.error("Failed to load global student data", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  return (
    <StudentContext.Provider
      value={{ ...contextData, loading, refreshSubmissions }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);
