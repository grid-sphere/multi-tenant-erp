import React from "react";
import { TOOLS } from "./annotationTools";

/** Tool strip plus undo/redo and page controls. Shortcuts are shown in tooltips. */
export default function ToolPalette({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearPage,
  page,
  numPages,
  onPageChange,
  zoom,
  onZoomChange,
  syncState,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-outline-variant bg-surface-container-low">
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool) => {
          const active = tool.id === activeTool;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              disabled={disabled}
              title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut.toUpperCase()})` : ""}`}
              aria-label={tool.label}
              aria-pressed={active}
              className={`p-1.5 rounded-md transition-colors disabled:opacity-40
                ${active
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tool.icon}
              </span>
            </button>
          );
        })}
      </div>

      <Divider />

      {/* History */}
      <button
        onClick={onUndo}
        disabled={disabled || !canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]">undo</span>
      </button>
      <button
        onClick={onRedo}
        disabled={disabled || !canRedo}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]">redo</span>
      </button>
      <button
        onClick={onClearPage}
        disabled={disabled}
        title="Clear this page"
        aria-label="Clear annotations on this page"
        className="p-1.5 rounded-md text-on-surface-variant hover:bg-error/10 hover:text-error disabled:opacity-30"
      >
        <span className="material-symbols-outlined text-[18px]">ink_eraser</span>
      </button>

      <Divider />

      {/* Pages */}
      {numPages > 1 && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            aria-label="Previous page"
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>
          <span className="text-xs tabular-nums text-on-surface-variant px-1">
            {page + 1} / {numPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= numPages - 1}
            aria-label="Next page"
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
        </div>
      )}

      {/* Zoom */}
      <div className="flex items-center gap-0.5 ml-auto">
        <SyncDot state={syncState} />
        <button
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
          aria-label="Zoom out"
          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">zoom_out</span>
        </button>
        <span className="text-xs tabular-nums text-on-surface-variant w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}
          aria-label="Zoom in"
          className="p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
        </button>
      </div>
    </div>
  );
}

const Divider = () => <span className="w-px h-5 bg-outline-variant mx-1" />;

function SyncDot({ state }) {
  const map = {
    syncing: { cls: "bg-warning", label: "Saving annotations" },
    synced: { cls: "bg-success", label: "Annotations saved" },
    offline: { cls: "bg-warning", label: "Offline — will retry" },
    error: { cls: "bg-error", label: "Annotations not saved" },
  };
  const s = map[state];
  if (!s) return null;
  return (
    <span
      title={s.label}
      aria-label={s.label}
      className={`w-2 h-2 rounded-full mr-1 ${s.cls}`}
    />
  );
}
