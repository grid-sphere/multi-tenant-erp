// src/components/erp/parent/Navbar.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParent } from "../../../context/ParentProvider";
import StudentIDCardModal from "../../../pages/parent/StudentIDCard";

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
        className="w-full sticky top-0 z-30
                   bg-white/80 dark:bg-slate-900/80
                   backdrop-blur-xl
                   border-b border-slate-200 dark:border-slate-700/50
                   flex justify-between items-center px-3 sm:px-6 h-14 sm:h-16
                   transition-colors duration-300 gap-2"
      >
        {/* Left: hamburger + page title */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleHamburgerClick}
            className="md:hidden w-8 h-8 sm:w-9 sm:h-9 -ml-1 flex items-center justify-center rounded-lg
                       text-blue-700 dark:text-blue-300
                       hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-90
                       transition-all flex-shrink-0"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
          </button>

          <h1 className="font-bold tracking-tight text-blue-800 dark:text-blue-300 font-headline truncate
                         text-sm sm:text-base md:text-xl min-w-0">
            <span className="md:hidden">{pageName}</span>
            <span className="hidden md:inline">The Academic Architect</span>
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">

          {/* ── ID Card button — child switcher se PEHLE ── */}
          <button
            type="button"
            onClick={() => setShowIDCard(true)}
            title="Download Student ID Card"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                       border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800
                       hover:bg-blue-50 dark:hover:bg-slate-700
                       hover:border-blue-200 dark:hover:border-blue-800
                       hover:shadow-sm active:scale-95
                       text-slate-600 dark:text-slate-300
                       hover:text-blue-700 dark:hover:text-blue-300
                       transition-all text-xs font-bold group"
          >
            <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">
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
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg
                           border border-slate-200 dark:border-slate-700
                           bg-white dark:bg-slate-800
                           hover:bg-blue-50 dark:hover:bg-slate-700
                           hover:border-blue-200 dark:hover:border-blue-800
                           hover:shadow-sm
                           transition-all max-w-[140px] sm:max-w-[200px]"
              >
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-300 text-base sm:text-lg flex-shrink-0">
                  face
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {activeChild?.name || "Select child"}
                </span>
                <span
                  className={`material-symbols-outlined text-slate-400 text-base transition-transform flex-shrink-0 ${
                    childMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {childMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1.5 z-40 animate-[pageFadeIn_0.15s_ease-out]">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        switchChild(s.id);
                        setChildMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm
                                 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors
                                 ${
                                   s.id === activeChild?.id
                                     ? "text-blue-700 dark:text-blue-300 font-semibold bg-blue-50/60 dark:bg-slate-700/60"
                                     : "text-slate-700 dark:text-slate-200"
                                 }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {s.id === activeChild?.id && (
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-300 text-base flex-shrink-0">
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
          <div className="hidden lg:flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/parent/settings")}
              className="text-sm font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap
                         hover:underline hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
            >
              {displayName}
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Search */}
          <span className="material-symbols-outlined text-blue-700 dark:text-blue-400 cursor-pointer text-lg sm:text-xl hidden sm:block hover:scale-110 transition-transform">
            search
          </span>

          {/* Notifications */}
          <button
            onClick={() => navigate("/parent/notifications")}
            className="relative text-slate-600 dark:text-slate-300
                       hover:text-blue-600 dark:hover:text-blue-300
                       hover:scale-110 active:scale-95
                       transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">notifications</span>
          </button>
        </div>
      </header>
    </>
  );
};

export default Navbar;