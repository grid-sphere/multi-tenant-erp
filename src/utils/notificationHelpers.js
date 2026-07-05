
// ── redirect_module -> role-specific route ──────────────────────────────
const ROLE_ROUTE_MAP = {
  admin: {
    "leave-dashboard": "/school-admin/leave-management",
    circular: "/school-admin/circulars",
    grievance: "/school-admin/grievances",
  },
  student: {
    "leave-dashboard": "/student/leave",
    circular: "/student/circulars",
    grievance: "/student/grievance",
  },
  teacher: {
    "leave-dashboard": "/teacher/leave-management",
    circular: "/teacher/circulars",
    grievance: "/teacher/circulars",
  },
  parent: {
    "leave-dashboard": "/parent/leave",
    circular: "/parent/circulars",
    grievance: "/parent/grievance",
  },
};

const NOTIFICATIONS_PAGE = {
  admin: "/school-admin/notifications",
  student: "/student/notifications",
  teacher: "/teacher/notifications",
  parent: "/parent/notifications",
};

/**
 * Resolve where clicking a notification should navigate to, for a given
 * portal role ("student" | "teacher" | "parent").
 */
export function getNotificationRoute(notification, role) {
  const redirectModule = notification?.payload?.redirect_module;
  const map = ROLE_ROUTE_MAP[role] || {};
  return map[redirectModule] || NOTIFICATIONS_PAGE[role] || "/";
}

export function getNotificationsPageRoute(role) {
  return NOTIFICATIONS_PAGE[role] || "/";
}

// ── title / subtitle / dot color per notification_type ─────────────────
function leaveNotificationTitle(payload = {}) {
  const { applicant_name, leave_type, status } = payload;
  if (status === "Pending") {
    return `${applicant_name} applied for ${leave_type} leave`;
  }
  return `${applicant_name}'s ${leave_type} leave was ${(status || "").toLowerCase()}`;
}

function circularNotificationTitle(payload = {}) {
  return payload.title || "New circular published";
}

function grievanceNotificationTitle(payload = {}) {
  return payload.title || "Grievance update";
}

export function getNotificationTitle(notification) {
  const { notification_type, payload = {} } = notification;
  if (notification_type === "leave") return leaveNotificationTitle(payload);
  if (notification_type === "circular") return circularNotificationTitle(payload);
  if (notification_type === "grievance") return grievanceNotificationTitle(payload);
  return notification.title ?? notification_type;
}

export function getNotificationSubtitle(notification) {
  const { notification_type, payload = {} } = notification;

  if (notification_type === "leave") {
    const { leave_type, applicant_role, start_date, end_date } = payload;
    const dateRange = start_date === end_date ? start_date : `${start_date} – ${end_date}`;
    return [leave_type, applicant_role, dateRange].filter(Boolean).join(" · ");
  }

  if (notification_type === "circular") {
    return payload.target_audience ? `For ${payload.target_audience}` : "New circular";
  }

  if (notification_type === "grievance") {
    const { category, priority, status, submitted_by_name } = payload;
    return [category, priority, status, submitted_by_name && `by ${submitted_by_name}`]
      .filter(Boolean)
      .join(" · ");
  }

  return notification.message ?? "";
}

export function getNotificationDotColor(notification) {
  const { notification_type, payload = {} } = notification;

  if (notification_type === "leave") {
    return payload.status === "Rejected" ? "var(--color-error, #dc2626)" : "var(--color-primary, #2563eb)";
  }

  if (notification_type === "grievance") {
    if (payload.priority === "High" || payload.priority === "Urgent" || payload.status === "Rejected") {
      return "var(--color-error, #dc2626)";
    }
    return "var(--color-tertiary, #7c3aed)";
  }

  if (notification_type === "circular") {
    return "var(--color-secondary, #0891b2)";
  }

  return "var(--color-primary, #2563eb)";
}