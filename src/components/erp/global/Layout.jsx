import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

/*
  Global-admin shell.

  Previously this rendered a permanently `fixed w-64` sidebar with an
  unconditional `ml-64` on the content column, so on any viewport under
  ~1024px the sidebar covered a quarter of the screen and the content was
  pushed off the right edge with no way to dismiss it.

  It now follows the same pattern as the teacher shell: the sidebar is a
  push-column at lg and above, and an overlay drawer below that. The
  breakpoint is checked on resize rather than only at mount, so dragging a
  desktop window narrow doesn't leave the drawer stuck open over the content.
*/
export default function Layout({ children }) {
  const isDesktop = () =>
    typeof window !== "undefined" && window.innerWidth >= 1024;

  const [desktop, setDesktop] = useState(isDesktop);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const next = isDesktop();
      setDesktop(next);
      if (next) setDrawerOpen(false); // never leave the drawer open on desktop
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll while the mobile drawer is over the content.
  useEffect(() => {
    const open = drawerOpen && !desktop;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen, desktop]);

  // Escape closes the drawer.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebarVisible = desktop || drawerOpen;

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* Scrim — mobile only, click to dismiss */}
      {drawerOpen && !desktop && (
        <div
          className="fixed inset-0 z-40 bg-scrim/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setDrawerOpen(false)} />
      </div>

      <div className="lg:ml-64">
        <Header onToggleSidebar={() => setDrawerOpen((o) => !o)} />
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
