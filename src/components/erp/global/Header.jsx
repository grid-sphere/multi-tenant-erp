import { useNavigate } from "react-router-dom";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 glass-effect border-b border-outline-variant">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Drawer toggle — only meaningful below lg, where the sidebar overlays */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="lg:hidden p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <button
          type="button"
          aria-label="Search"
          className="p-2 rounded-full hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">search</span>
        </button>

        <h1 className="text-lg sm:text-xl font-semibold truncate">
          Global Overview
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          onClick={() => navigate("/global-admin/notifications")}
          aria-label="Notifications"
          className="p-2 rounded-full hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-primary">
            notifications
          </span>
        </button>

        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">person</span>
        </div>
      </div>
    </header>
  );
}
