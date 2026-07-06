import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";

/**
 * @param {{ pollIntervalMs?: number }} [options]
 *   pollIntervalMs: ms between polls while the panel/app is mounted.
 *   Set 0 to disable polling and only fetch on mount / manual refresh().
 *   Default: 30s.
 */
export function useNotifications({ pollIntervalMs = 30_000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [list, count] = await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount, then poll. This satisfies the "non-instantaneous,
  // polled or fetched on demand on client component mount" requirement --
  // approve/reject notifications show up next time this fires.
  useEffect(() => {
    refresh();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(refresh, pollIntervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, pollIntervalMs]);

  const markRead = useCallback(async (id) => {
    const updated = await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    return updated;
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loading, error, refresh, markRead, markAllRead };
}