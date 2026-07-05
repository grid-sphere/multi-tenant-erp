import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../hooks/useNotifications";
import {
  getNotificationTitle,
  getNotificationSubtitle,
  getNotificationDotColor,
  getNotificationRoute,
  getNotificationsPageRoute,
} from "../../../utils/notificationHelpers";

function TeacherNotificationBell({ darkMode }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({ pollIntervalMs: 30_000 });
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const previewList = notifications.slice(0, 5);

  const handleItemClick = async (n) => {
    setIsOpen(false);
    if (!n.is_read) {
      try { await markRead(n.id); } catch (e) { /* non-fatal */ }
    }
    navigate(getNotificationRoute(n, 'teacher'));
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try { await markAllRead(); } catch (e) { /* non-fatal */ }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setIsOpen((p) => !p)}
        className={`relative p-2 rounded-lg transition ${
          darkMode
            ? 'hover:bg-slate-700 text-slate-300 hover:text-white'
            : 'hover:bg-slate-100'
        }`}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border overflow-hidden z-50 ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? 'border-slate-700' : 'border-slate-100'
          }`}>
            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className={`max-h-80 overflow-y-auto divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
            {previewList.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-10 gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>notifications_off</span>
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              previewList.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors ${
                    darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                  } ${!n.is_read ? (darkMode ? 'bg-slate-700/40' : 'bg-blue-50/50') : ''}`}
                >
                  {!n.is_read && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: getNotificationDotColor(n) }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      n.is_read
                        ? (darkMode ? 'text-slate-400' : 'text-slate-500')
                        : (darkMode ? 'text-white' : 'text-slate-800')
                    }`}>
                      {getNotificationTitle(n)}
                    </p>
                    <p className={`text-[11px] truncate mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {getNotificationSubtitle(n)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => { setIsOpen(false); navigate(getNotificationsPageRoute('teacher')); }}
            className={`w-full text-center py-2.5 border-t text-xs font-bold text-blue-600 transition-colors ${
              darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'
            }`}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

const TopAppBar = ({ title, isSidebarOpen, onToggleSidebar }) => {
  const { darkMode } = useTheme();

  return (
    <header className={`backdrop-blur-xl flex justify-between items-center w-full px-4 md:px-6 py-4 sticky top-0 z-40 shadow-lg transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700'
        : 'bg-white/80 border-b border-slate-100/60'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`flex md:flex rounded-full p-2.5 transition-all duration-200 outline-none items-center justify-center active:scale-95 ${
            darkMode
              ? 'hover:bg-slate-700 text-slate-300 hover:text-white'
              : 'hover:bg-slate-50 text-slate-500 hover:text-blue-600'
          }`}
          title="Toggle Menu"
        >
          <span className="material-symbols-outlined text-xl font-bold">
            {isSidebarOpen ? "menu_open" : "menu"}
          </span>
        </button>
        <h1 className={`text-base md:text-lg font-extrabold tracking-tight font-display truncate max-w-[200px] md:max-w-none ${
          darkMode ? 'text-white' : 'text-blue-700'
        }`}>{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className={`p-2 rounded-full transition-colors ${
          darkMode 
            ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
            : 'text-slate-500 hover:bg-blue-50'
        }`}>
          <span className="material-symbols-outlined text-xl">search</span>
        </button>
        <TeacherNotificationBell darkMode={darkMode} />
      </div>
    </header>
  );
};

export default TopAppBar;