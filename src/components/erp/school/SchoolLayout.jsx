import React, { useState, useEffect } from "react";
import SchoolSidebar from "./SchoolSidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "../../../context/ThemeContext";
import { useNotifications } from "../../../hooks/useNotifications";
import {
  getNotificationTitle,
  getNotificationSubtitle,
  getNotificationDotColor,
  getNotificationRoute,
  getNotificationsPageRoute,
} from "../../../utils/notificationHelpers";


function SchoolLayoutInner({ children, title = "Dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();

  // ── Sidebar state with localStorage persistence ──
  // - On first visit: closed on mobile (<768px), open on larger screens
  // - On subsequent visits: restores the user's last preference
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('schoolSidebarOpen');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // First visit: close on small screens, open on larger
    return window.innerWidth >= 768;
  });

  // Save sidebar state whenever it changes
  useEffect(() => {
    localStorage.setItem('schoolSidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // ── Notifications — same shared hook/service/utils as Student, Teacher,
  // and Parent portals (see hooks/useNotifications.js + services/notifications.js
  // + utils/notificationHelpers.js). No more SchoolAdminProvider context
  // dependency, and no more placeholder fallback data -- an empty inbox
  // now just renders an empty state, same as everywhere else.
  const { notifications, unreadCount, refresh, markRead, markAllRead } = useNotifications({
    pollIntervalMs: 30_000,
  });
  const notificationPreviewList = notifications.slice(0, 5);

  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchString, setSearchString] = useState("");

  // Some other part of the app (e.g. after an action elsewhere) can still
  // dispatch this event to force an immediate refresh of the bell.
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("sync-unread-count", handler);
    return () => window.removeEventListener("sync-unread-count", handler);
  }, [refresh]);

  const handleItemClick = async (n) => {
    setIsNotificationDropdownOpen(false);
    if (!n.is_read) {
      try { await markRead(n.id); } catch (e) { /* non-fatal, keep navigating */ }
    }
    navigate(getNotificationRoute(n, 'admin'));
  };

  const handleQuickResolve = async (id, e) => {
    e.stopPropagation();
    try { await markRead(id); } catch (e) { /* non-fatal */ }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try { await markAllRead(); } catch (e) { /* non-fatal */ }
  };

  const dk = darkMode;
  const SIDEBAR_W = "14rem"; // 224px / w-56

  return (
    <div className={`font-body min-h-screen overflow-x-hidden relative transition-colors duration-300
      ${dk ? "bg-background text-on-surface" : "bg-background text-on-surface"}`}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: SIDEBAR_W }}
        className={`fixed inset-y-0 left-0 z-50 shadow-lg transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"}`}>
        <SchoolSidebar />
      </div>

      {/* ── MAIN ── */}
      <main className="min-h-screen flex flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: isSidebarOpen ? SIDEBAR_W : "0" }}>

        {/* ── TOPBAR — compact h-12 ── */}
        <header
          className={`fixed top-0 right-0 z-40 flex items-center justify-between lg:px-5 px-2 transition-all duration-300 ease-in-out
            ${dk ? "bg-surface-container/90 border-outline-variant/20" : "bg-surface-container-lowest/90 border-outline-variant/10"}`}
          style={{
            height: "3rem",
            width: isSidebarOpen ? `calc(100% - ${SIDEBAR_W})` : "100%",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid color-mix(in srgb, var(--color-outline-variant) 15%, transparent)",
          }}>

          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(p => !p)}
              className="p-1.5 rounded-lg transition-all active:scale-95 outline-none"
              style={{ color: "var(--color-on-surface-variant)" }}
              onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 8%, transparent)"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <span className="material-symbols-outlined text-lg">{isSidebarOpen ? "menu_open" : "menu"}</span>
            </button>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tight" style={{ color: "var(--color-on-surface)" }}>{title}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline" style={{ color: "var(--color-outline)" }}>
                Institutional Administration Panel
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className={`relative hidden md:block transition-all duration-300 ${searchFocused ? "w-64" : "w-48"}`}>
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: searchFocused ? "var(--color-primary)" : "var(--color-outline)", fontSize: "15px" }}>search</span>
              <input
                value={searchString}
                onChange={e => setSearchString(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search records…"
                className="w-full pl-8 pr-3 py-1 rounded-lg text-xs font-semibold border outline-none transition-all"
                style={{
                  background: dk ? "var(--color-surface-container-low)" : "var(--color-surface-container)",
                  border: `1px solid ${searchFocused ? "color-mix(in srgb, var(--color-primary) 50%, transparent)" : "color-mix(in srgb, var(--color-outline-variant) 20%, transparent)"}`,
                  color: "var(--color-on-surface)",
                }} />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setIsNotificationDropdownOpen(p => !p)}
                className="p-1.5 rounded-lg transition-all relative active:scale-95 outline-none"
                style={{ color: isNotificationDropdownOpen ? "var(--color-primary)" : "var(--color-on-surface-variant)" }}
                onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 8%, transparent)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <span className="material-symbols-outlined text-lg">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationDropdownOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl border overflow-hidden z-20
                    ${dk ? "bg-surface-container-lowest border-outline-variant/20" : "bg-surface-container-lowest border-outline-variant/10"}`}>
                    <div className={`px-4 py-2.5 border-b flex justify-between items-center
                      ${dk ? "bg-surface-container-high border-outline-variant/20" : "bg-surface-container-high border-outline-variant/10"}`}>
                      <span className="text-xs font-black uppercase tracking-tight" style={{ color: "var(--color-on-surface)" }}>Notifications</span>
                      {unreadCount > 0 ? (
                        <button onClick={handleMarkAllRead}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full transition"
                          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                          {unreadCount} Pending · Mark all read
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                          All caught up
                        </span>
                      )}
                    </div>
                    <div className="divide-y max-h-56 overflow-y-auto"
                      style={{ borderColor: "color-mix(in srgb, var(--color-outline-variant) 15%, transparent)" }}>
                      {notificationPreviewList.length === 0 ? (
                        <div className="px-3.5 py-6 flex flex-col items-center gap-1.5 text-center"
                          style={{ color: "var(--color-outline)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>notifications_off</span>
                          <p className="text-[11px] font-semibold">No notifications yet</p>
                        </div>
                      ) : (
                        notificationPreviewList.map(n => (
                          <div key={n.id}
                            onClick={() => handleItemClick(n)}
                            className={`px-3.5 py-2.5 flex items-start gap-2.5 cursor-pointer transition-all ${!n.is_read ? "bg-primary/5" : ""}`}
                            onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 5%, transparent)"}
                            onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "" : "color-mix(in srgb, var(--color-primary) 5%, transparent)"}>
                            {!n.is_read && (
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ background: getNotificationDotColor(n) }} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: n.is_read ? "var(--color-on-surface-variant)" : "var(--color-on-surface)" }}>{getNotificationTitle(n)}</p>
                              <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>{getNotificationSubtitle(n)}</p>
                            </div>
                            {!n.is_read && (
                              <button onClick={e => handleQuickResolve(n.id, e)}
                                className="w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0"
                                style={{ border: "1px solid color-mix(in srgb, var(--color-outline-variant) 20%, transparent)", color: "var(--color-outline)" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--color-primary)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--color-outline)"; }}>
                                <span className="material-symbols-outlined text-[10px]">check</span>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <button onClick={() => { setIsNotificationDropdownOpen(false); navigate(getNotificationsPageRoute('admin')); }}
                      className="w-full text-center py-2 border-t text-[11px] font-bold transition"
                      style={{
                        color: "var(--color-primary)",
                        background: "var(--color-surface-container-high)",
                        borderColor: "color-mix(in srgb, var(--color-outline-variant) 15%, transparent)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--color-primary) 6%, transparent)"}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--color-surface-container-high)"}>
                      View All Notifications
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Avatar */}
            <div onClick={() => navigate("/school-admin/settings")}
              className="w-7 h-7 rounded-lg overflow-hidden border cursor-pointer transition-all active:scale-95 shadow-sm"
              style={{ borderColor: "color-mix(in srgb, var(--color-outline-variant) 20%, transparent)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-outline-variant) 20%, transparent)"}>
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr-h68ZGUP34FUflv2mFF-gNJjT5N_6ytDAglZduyU7THcHTXquHtKCzW8pah1ZVvvgH2DwFQmNae7GnJLai44EeHTkxyJ7zBwpwQDu-gvnmEk4ZR9VvIQ42BaYW5Iv2e6IOltaThdGqNRbF3cqmGeYfEhWJShw9MZsTyFHM6ygEEHITElBL26bGg34Jsu79sL7xFoRsP1OthWVTv3qIia-yBCPlh5GqFFycTauUCcNk7mlY9MFiACpCeL5aUtTEaP1cd3-aT6LQ"
                alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT — pt-12 to clear 48px topbar ── */}
        <div key={location.pathname}
          className="pt-12 lg:px-5 px-2  pb-5 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-400">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function SchoolLayout({ children, title }) {
  return (
    <ThemeProvider>
      <SchoolLayoutInner title={title}>{children}</SchoolLayoutInner>
    </ThemeProvider>
  );
}