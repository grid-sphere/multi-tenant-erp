// src/pages/schoolAdmin/Notifications.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout"; // adjust path if SchoolLayout lives elsewhere
import { useNotifications } from "../../hooks/useNotifications";
import {
   getNotificationTitle,
  getNotificationSubtitle,
  getNotificationDotColor,
  getNotificationRoute,
  getNotificationsPageRoute,
} from "../../utils/notificationHelpers"

function resolveRoute(notification) {
  const payload = notification.payload;
  switch (payload.redirect_module) {
    case "leave-dashboard":
      return `/school-admin/leave-management`;
    case "grievance":
      return `/school-admin/grievances`;
    default:
      return "/school-admin/notifications";
  }
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function leaveTitle(payload) {
  if (payload.status === "Pending") {
    return `${payload.applicant_name} applied for ${payload.leave_type} leave`;
  }
  return `Your ${payload.leave_type} leave was ${payload.status.toLowerCase()}`;
}

export function notificationTitle(notification) {
  return notification.notification_type === "leave"
    ? getNotificationSubtitle(notification.payload)
    : notification.notification_type;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications({
    pollIntervalMs: 30_000,
  });

  async function handleClick(notification) {
    if (!notification.is_read) {
      try {
        await markRead(notification.id);
      } catch {
        // Non-fatal -- still navigate even if marking read failed.
      }
    }
    
    navigate(getNotificationRoute(notification, 'admin'));
  }

  return (
    <SchoolLayout title="Notifications">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold">
            Notifications {unreadCount > 0 && <span className="text-primary">({unreadCount} unread)</span>}
          </h1>
          {unreadCount > 0 && (
            <button onClick={() => markAllRead()} className="text-sm text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>

        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
          {loading && <div className="px-4 py-8 text-sm text-outline text-center">Loading…</div>}

          {!loading && error && (
            <div className="px-4 py-8 text-sm text-error text-center">{error}</div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="px-4 py-8 text-sm text-outline text-center">You're all caught up.</div>
          )}

          {!loading &&
            !error &&
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container transition-colors ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{getNotificationTitle(n)}</p>
                    <p className="text-xs text-outline mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </SchoolLayout>
  );
}