import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { schoolAdminApi } from "../services/schoolAdminApi";
import apiClient from "../services/axiosClient";

const SchoolAdminContext = createContext();

const LOAD_LABELS = [
  "classLevels", "sections", "academicYears", "subjects", 
  "teachers", "stats", "trends", "notifications", "settings", "leaveStats"
];

export const toList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
};

// Shown only if the leave-requests API call fails, so the Leave Dashboard
// screen is never empty while the backend is being wired up. Remove once
// the backend is reliably live.
const DEMO_LEAVES = [
  { id: "d1", applicant_role: "Teacher", applicant_name: "Meera Joshi", leave_type: "Sick", start_date: "2026-07-02", end_date: "2026-07-03", total_days: 2, reason: "Viral fever, doctor advised rest.", status: "Pending", applied_at: "2026-06-28T09:12:00Z", attachment: null },
  { id: "d2", applicant_role: "Student", applicant_name: "Aarav Singh", leave_type: "Casual", start_date: "2026-07-01", end_date: "2026-07-01", total_days: 1, reason: "Family function.", status: "Pending", applied_at: "2026-06-27T14:02:00Z", attachment: null },
  { id: "d3", applicant_role: "Teacher", applicant_name: "Rohan Kapoor", leave_type: "Emergency", start_date: "2026-06-30", end_date: "2026-06-30", total_days: 1, reason: "Family emergency, need to travel out of city.", status: "Approved", applied_at: "2026-06-26T08:40:00Z", reviewed_by_name: "Admin Office", reviewed_at: "2026-06-26T11:00:00Z", review_remarks: "Approved, hope all is well." },
  { id: "d4", applicant_role: "Student", applicant_name: "Diya Patel", leave_type: "Sick", start_date: "2026-06-24", end_date: "2026-06-26", total_days: 3, reason: "Chickenpox, isolation advised.", status: "Approved", applied_at: "2026-06-23T10:00:00Z", reviewed_by_name: "Sana Reddy", reviewed_at: "2026-06-23T12:00:00Z" },
  { id: "d5", applicant_role: "Teacher", applicant_name: "Imran Sheikh", leave_type: "Casual", start_date: "2026-07-10", end_date: "2026-07-11", total_days: 2, reason: "Personal work.", status: "Rejected", applied_at: "2026-06-20T09:00:00Z", reviewed_by_name: "Admin Office", reviewed_at: "2026-06-21T09:00:00Z", review_remarks: "Clashes with mid-term exam duty, please reschedule." },
];

export const SchoolAdminProvider = ({ children }) => {
  // --- Academic State ---
  const [classLevels, setClassLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // --- Statistics State ---
  const [studentsCount, setStudentsCount] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [enrollmentTrends, setEnrollmentTrends] = useState([]);

  // --- Utility / UI State ---
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sectionsByClass, setSectionsByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Leave Management State ---
  const [leaveStats, setLeaveStats] = useState({ pendingTeacher: 0, pendingStudent: 0 });

  // Full leave-requests list + demo-fallback flag, used by the Leave
  // Dashboard page. Loaded lazily via refreshLeaveRequests() rather than
  // as part of loadAllData(), since not every school-admin page needs it.
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [leaveRequestsError, setLeaveRequestsError] = useState(null);
  const [usingDemoLeaveData, setUsingDemoLeaveData] = useState(false);

  // --- Derived Selectors ---
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const notificationPreviewList = useMemo(
    () => notifications.slice(0, 4),
    [notifications]
  );

  const pendingLeaveCount = useMemo(
    () => leaveStats.pendingTeacher + leaveStats.pendingStudent,
    [leaveStats]
  );

  // --- Isolated Refresh Actions ---
  const refreshAcademics = useCallback(async () => {
    const [classRes, sectionRes, yearRes, subjectRes] = await Promise.allSettled([
      schoolAdminApi.getClassLevels(),
      schoolAdminApi.getSections(),
      schoolAdminApi.getAcademicYears(),
      schoolAdminApi.getSubjects(),
    ]);

    if (classRes.status === "fulfilled") setClassLevels(toList(classRes.value));
    if (sectionRes.status === "fulfilled") setSections(toList(sectionRes.value));
    if (yearRes.status === "fulfilled") setAcademicYears(toList(yearRes.value));
    if (subjectRes.status === "fulfilled") setSubjects(toList(subjectRes.value));

    setSectionsByClass({});
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const statsRes = await schoolAdminApi.getDashboardStats();
      if (statsRes?.total_students != null) setStudentsCount(statsRes.total_students);
      if (statsRes?.active_students != null) setActiveStudents(statsRes.active_students);
      if (statsRes?.total_teachers != null) setTeachersCount(statsRes.total_teachers);
    } catch {
      try {
        // Fallback for fragmented platforms
        const [studentsRes, teachersRes] = await Promise.all([
          apiClient.get("/school-admin/students/"),
          apiClient.get("/school-admin/teachers/"),
        ]);
        const totalStu = studentsRes.data?.count ?? studentsRes.data?.results?.length ?? (Array.isArray(studentsRes.data) ? studentsRes.data.length : 0);
        setStudentsCount(totalStu);

        try {
          const activeRes = await apiClient.get("/school-admin/students/?is_archived=false&page_size=1");
          setActiveStudents(activeRes.data?.count ?? activeRes.data?.results?.length ?? totalStu);
        } catch {
          const stuArr = toList(studentsRes.data);
          const activeFallback = stuArr.filter(s => s.is_archived === false || s.status === "ACTIVE" || s.is_active === true).length;
          setActiveStudents(activeFallback || totalStu);
        }

        setTeachersCount(teachersRes.data?.count ?? teachersRes.data?.results?.length ?? (Array.isArray(teachersRes.data) ? teachersRes.data.length : 0));
      } catch (err) {
        console.error("Failed to refresh school admin stats:", err);
      }
    }
  }, []);

  const refreshTrends = useCallback(async () => {
    try {
      const trendsRes = await schoolAdminApi.getEnrollmentTrends();
      const arr = trendsRes?.results ?? trendsRes?.data ?? trendsRes;
      setEnrollmentTrends(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error("Failed to refresh enrollment trends:", err);
      setEnrollmentTrends([]);
    }
  }, []);

  const refreshTeachers = useCallback(async () => {
    try {
      const data = await schoolAdminApi.getTeachers();
      setTeachers(toList(data));
    } catch (err) {
      console.error("Failed to refresh teachers:", err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const list = await schoolAdminApi.fetchNotifications();
      setNotifications(toList(list));
    } catch (err) {
      console.error("Failed to refresh notifications:", err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await schoolAdminApi.getSettings();
      setSettings(data);
      return data;
    } catch (err) {
      console.error("Failed to refresh settings:", err);
      throw err;
    }
  }, []);

  // Pending-leave counts, split by applicant role so a sidebar badge or
  // dashboard card can call out "N teacher / N student" leaves waiting.
  const refreshLeaveStats = useCallback(async () => {
    try {
      const data = await schoolAdminApi.getLeaveRequests({ status: "Pending" });
      const list = toList(data);
      setLeaveStats({
        pendingTeacher: list.filter((l) => l.applicant_role === "Teacher").length,
        pendingStudent: list.filter((l) => l.applicant_role === "Student").length,
      });
    } catch (err) {
      console.error("Failed to refresh leave stats:", err);
    }
  }, []);

  // Full (unfiltered-by-status) leave-requests list for the Leave Dashboard
  // page. Cancelled requests are withdrawn by the applicant and are never
  // surfaced to the admin.
  const refreshLeaveRequests = useCallback(async () => {
    setLeaveRequestsLoading(true);
    setLeaveRequestsError(null);
    try {
      const data = await schoolAdminApi.getLeaveRequests({});
      const list = toList(data);
      setLeaveRequests(list.filter((l) => l.status !== "Cancelled"));
      setUsingDemoLeaveData(false);
    } catch (err) {
      console.error("Failed to load leave requests:", err);
      setLeaveRequests(DEMO_LEAVES.filter((l) => l.status !== "Cancelled"));
      setUsingDemoLeaveData(true);
      setLeaveRequestsError(err.message || "Something went wrong loading leave requests.");
    } finally {
      setLeaveRequestsLoading(false);
    }
  }, []);

  const approveLeaveRequest = useCallback(async (id, remarks = "") => {
    const updated = usingDemoLeaveData
      ? null
      : await schoolAdminApi.approveLeaveRequest(id, remarks);
    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (usingDemoLeaveData) {
          return {
            ...l,
            status: "Approved",
            review_remarks: remarks,
            reviewed_by_name: "Admin Office",
            reviewed_at: new Date().toISOString(),
          };
        }
        return updated;
      })
    );
    refreshLeaveStats();
  }, [usingDemoLeaveData, refreshLeaveStats]);

  const rejectLeaveRequest = useCallback(async (id, remarks = "") => {
    const updated = usingDemoLeaveData
      ? null
      : await schoolAdminApi.rejectLeaveRequest(id, remarks);
    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (usingDemoLeaveData) {
          return {
            ...l,
            status: "Rejected",
            review_remarks: remarks,
            reviewed_by_name: "Admin Office",
            reviewed_at: new Date().toISOString(),
          };
        }
        return updated;
      })
    );
    refreshLeaveStats();
  }, [usingDemoLeaveData, refreshLeaveStats]);

  const deleteLeaveRequest = useCallback(async (id) => {
    if (!usingDemoLeaveData) {
      await schoolAdminApi.deleteLeaveRequest(id);
    }
    setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
    refreshLeaveStats();
  }, [usingDemoLeaveData, refreshLeaveStats]);

  // FIXED: Removed 'sectionsByClass' dependency to eliminate UI-freezing infinite render loop.
  const fetchSectionsByClass = useCallback(
    async (classId) => {
      if (!classId) return [];
      
      let localCache;
      setSectionsByClass(prev => {
        localCache = prev[classId];
        return prev;
      });
      if (localCache) return localCache;

      const cachedFromList = sections.filter(
        (s) => String(s.class_level) === String(classId) || String(s.class_level?.id) === String(classId)
      );
      
      if (cachedFromList.length > 0) {
        setSectionsByClass((prev) => ({ ...prev, [classId]: cachedFromList }));
        return cachedFromList;
      }

      const data = await schoolAdminApi.getSectionsByClass(classId);
      const list = toList(data);
      setSectionsByClass((prev) => ({ ...prev, [classId]: list }));
      return list;
    },
    [sections]
  );

  const markNotificationRead = useCallback(async (id) => {
    // Optimistic update first so the UI feels instant...
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await schoolAdminApi.markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      // ...roll back on failure.
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await schoolAdminApi.markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
      setNotifications(previous);
    }
  }, [notifications]);

  const updateSettings = useCallback(async (payload) => {
    const updated = await schoolAdminApi.updateSettings(payload);
    setSettings(updated);
    return updated;
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        schoolAdminApi.getClassLevels(),
        schoolAdminApi.getSections(),
        schoolAdminApi.getAcademicYears(),
        schoolAdminApi.getSubjects(),
        schoolAdminApi.getTeachers(),
        schoolAdminApi.getDashboardStats(),
        schoolAdminApi.getEnrollmentTrends(),
        schoolAdminApi.fetchNotifications(),
        schoolAdminApi.getSettings(),
        schoolAdminApi.getLeaveRequests({ status: "Pending" }),
      ]);

      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`Failed to load "${LOAD_LABELS[i]}":`, r.reason);
        }
      });

      const [
        classResult, sectionResult, yearResult, subjectResult,
        teacherResult, statsResult, trendsResult, notificationsResult, settingsResult,
        leaveStatsResult
      ] = results;
      
      setClassLevels(classResult.status === "fulfilled" ? toList(classResult.value) : []);
      setSections(sectionResult.status === "fulfilled" ? toList(sectionResult.value) : []);
      setAcademicYears(yearResult.status === "fulfilled" ? toList(yearResult.value) : []);
      setSubjects(subjectResult.status === "fulfilled" ? toList(subjectResult.value) : []);
      setTeachers(teacherResult.status === "fulfilled" ? toList(teacherResult.value) : []);

      if (statsResult.status === "fulfilled" && statsResult.value) {
        const stats = statsResult.value;
        if (stats.total_students != null) setStudentsCount(stats.total_students);
        if (stats.active_students != null) setActiveStudents(stats.active_students);
        if (stats.total_teachers != null) setTeachersCount(stats.total_teachers);
      } else {
        await refreshStats();
      }

      if (trendsResult.status === "fulfilled") {
        const arr = trendsResult.value?.results ?? trendsResult.value?.data ?? trendsResult.value;
        setEnrollmentTrends(Array.isArray(arr) ? arr : []);
      }

      const notificationsList = notificationsResult.status === "fulfilled" ? notificationsResult.value : [];
      setNotifications(toList(notificationsList));
      setSettings(settingsResult.status === "fulfilled" ? settingsResult.value : null);
      setSectionsByClass({});

      if (leaveStatsResult.status === "fulfilled") {
        const leaveList = toList(leaveStatsResult.value);
        setLeaveStats({
          pendingTeacher: leaveList.filter((l) => l.applicant_role === "Teacher").length,
          pendingStudent: leaveList.filter((l) => l.applicant_role === "Student").length,
        });
      }
    } catch (err) {
      console.error("Failed to load school admin context", err);
      setError(err.message || "Something went wrong loading school admin data.");
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Poll notifications independently of the (much heavier) full loadAllData
  // reload, so the bell/unread-count stay live across without needing a manual refresh.
  useEffect(() => {
    const interval = setInterval(refreshNotifications, 30_000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Context bundle
  const contextValue = useMemo(() => ({
    classLevels, sections, academicYears, subjects, teachers,
    studentsCount, activeStudents, teachersCount, enrollmentTrends,
    notifications, notificationPreviewList, unreadCount, settings,
    leaveStats, pendingLeaveCount,
    leaveRequests, leaveRequestsLoading, leaveRequestsError, usingDemoLeaveData,
    loading, error,
    reload: loadAllData,
    refreshAcademics, refreshStats, refreshTrends, refreshTeachers,
    refreshNotifications, refreshSettings, fetchSectionsByClass,
    refreshLeaveStats, refreshLeaveRequests,
    approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest,
    markNotificationRead, markAllNotificationsRead, updateSettings
  }), [
    classLevels, sections, academicYears, subjects, teachers,
    studentsCount, activeStudents, teachersCount, enrollmentTrends,
    notifications, notificationPreviewList, unreadCount, settings,
    leaveStats, pendingLeaveCount,
    leaveRequests, leaveRequestsLoading, leaveRequestsError, usingDemoLeaveData,
    loading, error, loadAllData, refreshAcademics, refreshStats, 
    refreshTrends, refreshTeachers, refreshNotifications, refreshSettings, 
    fetchSectionsByClass, refreshLeaveStats, refreshLeaveRequests,
    approveLeaveRequest, rejectLeaveRequest, deleteLeaveRequest,
    markNotificationRead, markAllNotificationsRead, updateSettings
  ]);

  return (
    <SchoolAdminContext.Provider value={contextValue}>
      {children}
    </SchoolAdminContext.Provider>
  );
};

export const useSchoolAdmin = () => useContext(SchoolAdminContext);