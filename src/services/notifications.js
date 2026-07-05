import apiClient from "./apiClient";

export const fetchNotifications = async (params) => {
  const res = await apiClient.get(`/notifications/`, { params });
  return res.data.results;
};

export const fetchUnreadCount = async () => {
  const res = await apiClient.get(`/notifications/unread-count/`);
  return res.data.unread_count;
};

export const markNotificationRead = async (id) => {
  const res = await apiClient.post(`/notifications/${id}/mark-read/`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await apiClient.post(`/notifications/mark-all-read/`);
  return res.data;
};

