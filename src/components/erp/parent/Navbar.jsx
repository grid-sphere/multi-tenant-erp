import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParent } from "../../../context/ParentProvider";
import StudentIDCardModal from "../../../pages/parent/StudentIDCard";
import { useNotifications } from "../../../hooks/useNotifications";
import {
  getNotificationTitle,
  getNotificationSubtitle,
  getNotificationDotColor,
  getNotificationRoute,
  getNotificationsPageRoute,
} from "../../../utils/notificationHelpers";

const PAGE_NAMES = {
  "/parent":                "Dashboard",
  "/parent/child-overview": "Child Overview",
  "/parent/attendance":     "Attendance",
  "/parent/assignments":    "Assignments",
  "/parent/grades":         "Grades & Report",
  "/parent/insights":       "AI Insights",
  "/parent/settings":       "Settings",
  "/parent/notifications":  "Notifications",
};

function ParentNotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({ pollIntervalMs: 30_000 });
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const previewList = notifications.slice(0, 5);

  const handleItemClick = async (n) => {
    setIsOpen(false);
    if (!n.is_read) {
      try { await markRead(n.id); } catch (e) { /* non-fatal */ }
    }
    navigate(getNotificationRoute(n, "parent"));
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try { await markAllRead(); } catch (e) { /* non-fatal */ }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="relative text-slate-600 dark:text-slate-300
                   hover:text-blue-600 dark:hover:text-blue-300
                   hover:scale-110 active:scale-95
                   transition-all flex-shrink-0"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-base sm:text-lg">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-40 animate-[pageFadeIn_0.15s_ease-out]">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {previewList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>notifications_off</span>
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              previewList.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 ${
                    !n.is_read ? "bg-blue-50/60 dark:bg-slate-700/60" : ""
                  }`}
                >
                  {!n.is_read && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: getNotificationDotColor(n) }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      n.is_read ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-white"
                    }`}>
                      {getNotificationTitle(n)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {getNotificationSubtitle(n)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => { setIsOpen(false); navigate(getNotificationsPageRoute("parent")); }}
            className="w-full text-center py-2.5 border-t border-slate-100 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

const Navbar = ({ onOpenSidebar, onToggleSidebar, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { students, activeChild, switchChild, loading } = useParent();

  const [childMenuOpen, setChildMenuOpen] = useState(false);
  const [showIDCard,    setShowIDCard]    = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setChildMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const handleHamburgerClick = () => {
    if (isMobile) onOpenSidebar();
    else onToggleSidebar();
  };

  const userData        = JSON.parse(localStorage.getItem("user_data") || "null");
  const parentData      = userData?.identity;
  const parentFirstName = parentData?.first_name;
  const parentLastName  = parentData?.last_name;

  const displayName =
    parentFirstName && parentLastName
      ? `${parentFirstName[0].toUpperCase() + parentFirstName.slice(1)} ${parentLastName[0].toUpperCase() + parentLastName.slice(1)}`
      : "Parent";

  const pageName =
    PAGE_NAMES[location.pathname] ||
    Object.entries(PAGE_NAMES).find(([key]) => location.pathname.startsWith(key + "/"))?.[1] ||
    "Parent Portal";

  return (
    <>
      {/* ── Student ID Card Modal ── */}
      {showIDCard && <StudentIDCardModal onClose={() => setShowIDCard(false)} />}

      <header
        className="font-body w-full sticky top-0 z-30
                   bg-white/80 dark:bg-slate-900/80
                   backdrop-blur-xl
                   border-b border-slate-200 dark:border-slate-700/50
                   flex justify-between items-center px-2.5 sm:px-4 h-12 sm:h-14
                   transition-colors duration-300 gap-1.5"
      >
        {/* Left: hamburger + page title */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleHamburgerClick}
            className="md:hidden w-7 h-7 sm:w-8 sm:h-8 -ml-1 flex items-center justify-center rounded-md
                       text-blue-700 dark:text-blue-300
                       hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-90
                       transition-all flex-shrink-0"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">menu</span>
          </button>

          <h1 className="font-headline font-bold tracking-tight text-blue-800 dark:text-blue-300 truncate
                         text-xs sm:text-sm md:text-lg min-w-0">
            <span className="md:hidden">{pageName}</span>
            <span className="hidden md:inline">The Academic Architect</span>
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">

          {/* ── ID Card button — child switcher se PEHLE ── */}
          <button
            type="button"
            onClick={() => setShowIDCard(true)}
            title="Download Student ID Card"
            className="flex items-center gap-1 px-2 py-1 rounded-md
                       border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800
                       hover:bg-blue-50 dark:hover:bg-slate-700
                       hover:border-blue-200 dark:hover:border-blue-800
                       hover:shadow-sm active:scale-95
                       text-slate-600 dark:text-slate-300
                       hover:text-blue-700 dark:hover:text-blue-300
                       transition-all text-2xs font-bold group"
          >
            <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
              badge
            </span>
            <span className="hidden sm:inline">ID Card</span>
          </button>

          {/* Child switcher */}
          {!loading && students.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setChildMenuOpen((v) => !v)}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md
                           border border-slate-200 dark:border-slate-700
                           bg-white dark:bg-slate-800
                           hover:bg-blue-50 dark:hover:bg-slate-700
                           hover:border-blue-200 dark:hover:border-blue-800
                           hover:shadow-sm
                           transition-all max-w-[120px] sm:max-w-[180px]"
              >
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-300 text-sm sm:text-base flex-shrink-0">
                  face
                </span>
                <span className="text-2xs sm:text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {activeChild?.name || "Select child"}
                </span>
                <span
                  className={`material-symbols-outlined text-slate-400 text-sm transition-transform flex-shrink-0 ${
                    childMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {childMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-40 animate-[pageFadeIn_0.15s_ease-out]">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        switchChild(s.id);
                        setChildMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs
                                 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors
                                 ${
                                   s.id === activeChild?.id
                                     ? "text-blue-700 dark:text-blue-300 font-semibold bg-blue-50/60 dark:bg-slate-700/60"
                                     : "text-slate-700 dark:text-slate-200"
                                 }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {s.id === activeChild?.id && (
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-300 text-sm flex-shrink-0">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parent name */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/parent/settings")}
              className="text-xs font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap
                         hover:underline hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
            >
              {displayName}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Search */}
          <span className="material-symbols-outlined text-blue-700 dark:text-blue-400 cursor-pointer text-base sm:text-lg hidden sm:block hover:scale-110 transition-transform">
            search
          </span>

          {/* Notifications */}
          <ParentNotificationBell />
        </div>
      </header>
    </>
  );
};

export default Navbar;