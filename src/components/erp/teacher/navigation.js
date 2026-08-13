export const navItems = [
  {
    label: "Dashboard",
    path: "/teacher/dashboard",
    icon: "dashboard",
  },

  {
    label: "My Classes",
    path: "/teacher/classes",
    icon: "groups",
  },

  {
    label: "Assignments",
    path: "/teacher/assignments",
    icon: "assignment",
  },

  // On-screen marking. Sits next to Assignments because it is the other half
  // of the same job, and was previously only reachable by drilling into an
  // assignment's pending submissions.
  {
    label: "Marking",
    path: "/teacher/marking/progress",
    icon: "rate_review",
  },

  // Reads scanned or photographed scripts with DeepSeek-OCR on the GPU.
  {
    label: "Paper Checking",
    path: "/teacher/tools/transcribe",
    icon: "document_scanner",
  },

  {
    label: "Attendance",
    path: "/teacher/attendance",
    icon: "event_available",
  },

  {
    label: "Timetable",
    path: "/teacher/timetable",
    icon: "calendar_month",
  },
  
  {
    label: "Grades",
    path: "/teacher/grades",
    icon: "grading",
  },

  {
    label: "AI Tools",
    path: "/teacher/ai-tools",
    icon: "psychology",
  },
  {
    label: "Leave Management",
    path: "/teacher/leave-management",
    icon: "event_busy"
  }

  /*{
label: "Analytics",
path: "/teacher/analytics",
icon: "insights"
}*/
];

export const secondaryNavItems = [
  {
    label: "Notifications",
    path: "/teacher/notifications",
    icon: "notifications",
  },

  {
    label: "Profile",
    path: "/teacher/profile",
    icon: "person",
  },

  {
    label: "Settings",
    path: "/teacher/settings",
    icon: "settings",
  },
];
