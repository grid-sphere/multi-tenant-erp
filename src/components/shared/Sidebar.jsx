import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useStudent } from '../../context/StudentProvider';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/student' },
  { icon: 'menu_book', label: 'My Subjects', path: '/student/subjects' },
  { icon: 'assignment', label: 'Assignments', path: '/student/assignments' },
  // Its own route rather than a query string on /student/assignments: NavLink
  // matches on pathname only, so a query-string variant would light up both
  // entries at once. This one lands pre-filtered to work still due.
  { icon: 'upload_file', label: 'Submit Work', path: '/student/submit' },
  { icon: 'description', label: 'Grades & Report Card', path: '/student/grades' },
  { icon: 'event_available', label: 'Attendance', path: '/student/attendance' },
  { icon: 'calendar_month', label: 'Timetable', path: '/student/timetable' },
  { icon: 'event_busy', label: 'Leave Portal', path: '/student/leave' },
  { icon: 'psychology', label: 'AI Tutor', path: '/student/ai-tutor' },
  { icon: 'gavel', label: 'Grievance', path: '/student/grievance' },
  { icon: 'account_balance_wallet', label: 'Fees', path: '/student/fees' },
  { icon: 'support_agent', label: 'Help Desk', path: '/student/help' },
];

const bottomItems = [
  { to: '/student/profile', icon: 'person', label: 'Profile' },
  { to: '/student/settings', icon: 'settings', label: 'Settings' },
];

/* ── Single nav row: icon badge + label + active rail + collapsed tooltip ── */
function NavItem({ to, icon, label, isExpanded, onClick, end }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className="sidebar-row block">
      {({ isActive }) => (
        <span
          className={`group relative flex items-center w-full h-full rounded-lg
            transition-all duration-200 text-sm font-semibold
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
            ${isExpanded ? 'gap-3 px-3' : 'justify-center px-2'}
            ${isActive
              ? 'text-primary bg-primary/[0.08]'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
            }`}
        >
          {/* active rail */}
          <span
            className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary
              transition-all duration-200 ${isActive ? 'h-6 opacity-100' : 'h-0 opacity-0'}`}
          />

          {/* icon badge */}
          <span
            className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0
              transition-all duration-200
              ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-transparent group-hover:bg-primary/10 group-hover:scale-105'
              }`}
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </span>

          {/* label */}
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300
              ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}
          >
            {label}
          </span>

          {/* collapsed-state tooltip */}
          {!isExpanded && (
            <span
              className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap
                         rounded-md bg-surface-container-highest custom-shadow px-2.5 py-1.5
                         text-xs font-bold text-on-surface opacity-0 scale-95
                         transition-all duration-150 group-hover:opacity-100 group-hover:scale-100"
            >
              {label}
            </span>
          )}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { profile: student, enrollment: enroll } = useStudent();
  const navigate = useNavigate();

  // ── Load sidebar state from localStorage (persist across re-renders) ──
  const [isExpanded, setIsExpanded] = useState(() => {
    const stored = localStorage.getItem('student_sidebar_expanded');
    return stored !== null ? stored === 'true' : true;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const { first_name = '', last_name = '', enrollment_number = '' } = student || {};
  const { class_level_name = '', section_name = '' } = enroll || {};

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${first_name} ${last_name}`.trim() || "S")}&background=3b82f6&color=fff`;

  // ── Fetch signed avatar URL ──────────────────────────────────────────────
  useEffect(() => {
    if (!student?.profile_picture) {
      setAvatarUrl(null);
      return;
    }
    if (student.profile_picture.startsWith("http")) {
      setAvatarUrl(student.profile_picture);
      return;
    }
    const token = localStorage.getItem("access_token");
    fetch(
      `${API_BASE_URL}/api/v1/uploads/view-url/?file_path=${encodeURIComponent(student.profile_picture)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then((r) => r.json())
      .then((d) => setAvatarUrl(d.url || d.view_url || null))
      .catch(() => setAvatarUrl(null));
  }, [student?.profile_picture]);

  // ── Responsive sidebar ──
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1280;
      setIsMobile(mobile);
      if (mobile) {
        // On mobile, always collapse
        setIsExpanded(false);
        window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: false } }));
      } else {
        // On desktop, restore saved state (or default to true)
        const stored = localStorage.getItem('student_sidebar_expanded');
        const expanded = stored !== null ? stored === 'true' : true;
        setIsExpanded(expanded);
        window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded } }));
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = () => {
    setIsExpanded(prev => {
      const next = !prev;
      // Save to localStorage so it persists
      localStorage.setItem('student_sidebar_expanded', String(next));
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: next } }));
      return next;
    });
  };

  const close = () => {
    if (isMobile) {
      setIsExpanded(false);
      // Save the collapsed state
      localStorage.setItem('student_sidebar_expanded', 'false');
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { expanded: false } }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  return (
    <>
      <style>{`
        .sidebar-topbar {
          height: clamp(48px, 6vh, 64px);
        }
        .sidebar-profile {
          padding-top:    clamp(8px, 1.4vh, 16px);
          padding-bottom: clamp(8px, 1.4vh, 16px);
        }
        /* Every row (11 nav items + divider + 2 bottom items + logout)
           shares the remaining vertical space equally. */
        .sidebar-row {
          flex: 1 1 0;
          min-height: 0;
        }
        .sidebar-divider-row {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .sidebar-row, .sidebar-row * { transition: none !important; }
        }
      `}</style>

      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-surface-container-low border-r border-outline-variant/30
          shadow-[2px_0_16px_-6px_rgba(0,0,0,0.08)]
          transition-all duration-300 ease-in-out overflow-hidden
          ${isMobile
            ? `w-72 ${isExpanded ? 'translate-x-0' : '-translate-x-full'}`
            : `${isExpanded ? 'w-72' : 'w-16'} translate-x-0`
          }
        `}
      >
        {/* ── TOP BAR ── */}
        <div className="sidebar-topbar flex items-center px-3 flex-shrink-0 border-b border-outline-variant/20">
          <button
            onClick={toggle}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container
                       active:scale-90 transition-all duration-200 flex-shrink-0
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-2xl transition-transform duration-300">
              {isExpanded ? 'menu_open' : 'menu'}
            </span>
          </button>
          <div className={`flex items-center overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-secondary mr-2 flex-shrink-0" />
            <span className="text-lg font-headline font-bold text-primary whitespace-nowrap">
              Academic Architect
            </span>
          </div>
        </div>

        {/* ── PROFILE SECTION ── */}
        <Link
          to="/student/profile"
          onClick={close}
          className={`sidebar-profile group flex items-center border-b border-outline-variant/20 flex-shrink-0
                     transition-colors duration-200 hover:bg-surface-container/50
                     ${isExpanded ? 'gap-3 px-4' : 'justify-center px-3'}`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-br from-primary to-secondary
                            transition-transform duration-200 group-hover:scale-105">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface-container-highest">
                <img
                  src={avatarUrl || fallbackAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface-container-low" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 min-w-0 flex-1 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <p className="font-bold text-sm text-on-surface whitespace-nowrap truncate">
              {first_name} {last_name}
            </p>
            <p className="text-xs text-on-surface-variant whitespace-nowrap truncate">
              {class_level_name && section_name
                ? `${class_level_name} - ${section_name}`
                : "No class assigned"}
            </p>
            <p className="text-[10px] text-primary font-bold whitespace-nowrap truncate">
              ID: {enrollment_number}
            </p>
          </div>
          {isExpanded && (
            <span className="material-symbols-outlined text-base text-on-surface-variant opacity-0
                             group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0">
              chevron_right
            </span>
          )}
        </Link>

        {/* ── NAV ITEMS — single flex column, every row flex-1 so the whole
              block always exactly fills the remaining height, no scroll,
              no leftover blank space, text/icons stay normal size ── */}
        <nav className="flex-1 flex flex-col px-2 min-h-0 overflow-hidden">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              to={item.path}
              end={item.path === '/student'}
              icon={item.icon}
              label={item.label}
              isExpanded={isExpanded}
              onClick={close}
            />
          ))}

          <div className="sidebar-divider-row">
            <div className="w-full border-t border-outline-variant/20" />
          </div>

          {bottomItems.map(({ to, icon, label }) => (
            <NavItem
              key={label}
              to={to}
              icon={icon}
              label={label}
              isExpanded={isExpanded}
              onClick={close}
            />
          ))}

          <button
            onClick={handleLogout}
            className={`sidebar-row group relative flex items-center rounded-lg
                        transition-all duration-200 text-sm font-semibold text-error
                        hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40
                        ${isExpanded ? 'gap-3 px-3' : 'justify-center px-2'}`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0
                             transition-all duration-200 group-hover:bg-error/15 group-hover:scale-105">
              <span className="material-symbols-outlined text-xl">logout</span>
            </span>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
              Log Out
            </span>
            {!isExpanded && (
              <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap
                               rounded-md bg-surface-container-highest custom-shadow px-2.5 py-1.5
                               text-xs font-bold text-error opacity-0 scale-95
                               transition-all duration-150 group-hover:opacity-100 group-hover:scale-100">
                Log Out
              </span>
            )}
          </button>
        </nav>
      </aside>

      {isMobile && !isExpanded && (
        <button
          onClick={toggle}
          aria-label="Open menu"
          className="fixed top-4 left-4 z-50 w-11 h-11 flex items-center justify-center
                     rounded-xl bg-primary text-white shadow-lg custom-shadow
                     hover:shadow-xl active:scale-90 transition-all duration-200"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      )}
    </>
  );
}