import React, { useCallback, useEffect, useRef, useState } from "react";

import AnnotationLayer from "./AnnotationLayer";
import ToolPalette from "./ToolPalette";
import usePdfDocument from "../../../../hooks/usePdfDocument";
import { SHORTCUT_TO_TOOL, TOOL_SELECT } from "./annotationTools";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic)$/i;
const PDF_EXT = /\.pdf$/i;

/**
 * The document with an annotation overlay on top.
 *
 * PDFs render through pdf.js one page at a time; images render as a plain
 * <img>. Both branches end up handing the overlay the same thing — a rendered
 * box of a known pixel size — so AnnotationLayer never learns which it is.
 */
export default function AnnotatableDocument({
  viewUrl,
  filePath,
  annotations,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearPage,
  onDocumentMeta,
  onPagesRenderer,
  syncState,
  disabled,
  onReload,
}) {
  const [activeTool, setActiveTool] = useState(TOOL_SELECT);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1.4);
  const [box, setBox] = useState(null); // rendered size in CSS pixels
  const [imageFailed, setImageFailed] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const metaSent = useRef(false);

  const isImage = filePath ? IMAGE_EXT.test(filePath) : false;
  const isPdf = filePath ? PDF_EXT.test(filePath) : !isImage;

  const {
    numPages,
    loading,
    error,
    unavailable,
    renderPage,
    renderPagesToImages,
    getDocumentMeta,
  } = usePdfDocument(isPdf ? viewUrl : null);

  // Hand the page rasteriser up so the marking screen can send pages to a
  // vision model without pdf.js leaking into the page component.
  useEffect(() => {
    if (!onPagesRenderer) return;
    onPagesRenderer(isPdf && numPages ? renderPagesToImages : null);
  }, [onPagesRenderer, isPdf, numPages, renderPagesToImages]);

  // Render the current PDF page whenever it, or the zoom, changes.
  useEffect(() => {
    let cancelled = false;
    if (!isPdf || !numPages || !canvasRef.current) return undefined;

    renderPage(page + 1, canvasRef.current, zoom)
      .then((size) => {
        if (!cancelled && size) setBox(size);
      })
      .catch(() => {
        /* cancellation and render errors are surfaced by the hook */
      });

    return () => {
      cancelled = true;
    };
  }, [isPdf, numPages, page, zoom, renderPage]);

  // Capture page geometry once, so the overlay can be reconstructed later.
  useEffect(() => {
    if (!isPdf || !numPages || metaSent.current || !onDocumentMeta) return;
    metaSent.current = true;
    getDocumentMeta().then((meta) => meta && onDocumentMeta(meta));
  }, [isPdf, numPages, getDocumentMeta, onDocumentMeta]);

  useEffect(() => {
    setPage(0);
    metaSent.current = false;
    setImageFailed(false);
  }, [viewUrl]);

  // Keyboard shortcuts. Ignored while a field has focus so typing a comment
  // does not swap the tool out from under the teacher.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) onRedo?.();
        else onUndo?.();
        return;
      }
      if (e.key === "Escape") {
        onSelect?.(null);
        setActiveTool(TOOL_SELECT);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        onRemove?.(selectedId);
        return;
      }
      const mapped = SHORTCUT_TO_TOOL[e.key.toLowerCase()];
      if (mapped && !e.ctrlKey && !e.metaKey && !e.altKey) setActiveTool(mapped);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUndo, onRedo, onRemove, onSelect, selectedId]);

  const handleImageLoad = useCallback(() => {
    const el = imgRef.current;
    if (el) setBox({ width: el.clientWidth, height: el.clientHeight });
  }, []);

  if (!viewUrl) {
    return (
      <Empty
        icon="draft"
        title="No file to mark"
        body="This student submitted without attaching a file."
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ToolPalette
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClearPage={() => onClearPage?.(page)}
        page={page}
        numPages={isPdf ? numPages : 1}
        onPageChange={setPage}
        zoom={zoom}
        onZoomChange={setZoom}
        syncState={syncState}
        disabled={disabled || (isPdf && (loading || !numPages))}
      />

      <div className="flex-1 min-h-0 overflow-auto bg-surface-container p-4">
        {isPdf && loading && (
          <div className="h-full flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
          </div>
        )}

        {isPdf && error && (
          <Empty
            icon={unavailable ? "cloud_off" : "link_off"}
            title={
              unavailable
                ? "Could not load the PDF viewer"
                : "Could not open the PDF"
            }
            body={
              unavailable
                ? "pdf.js is fetched when you open a PDF. Check your connection, then try again."
                : "The signed link may have expired. Reloading will request a fresh one."
            }
            action={
              <div className="mt-3 flex gap-2 justify-center">
                <button
                  onClick={onReload}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
                >
                  {unavailable ? "Try again" : "Reload"}
                </button>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                >
                  Open the file
                </a>
              </div>
            }
          />
        )}

        {isImage && imageFailed && (
          <Empty
            icon="broken_image"
            title="Could not load the image"
            body="The signed link may have expired."
            action={
              <button
                onClick={onReload}
                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
              >
                Reload
              </button>
            }
          />
        )}

        {!error && !imageFailed && (
          <div className="flex justify-center">
            <div className="relative shadow-md" style={box ? { width: box.width } : undefined}>
              {isPdf ? (
                <canvas ref={canvasRef} className="block rounded-sm" />
              ) : (
                <img
                  ref={imgRef}
                  src={viewUrl}
                  alt="Student submission"
                  onLoad={handleImageLoad}
                  onError={() => setImageFailed(true)}
                  style={{ width: `${zoom * 100}%` }}
                  className="block rounded-sm"
                />
              )}

              {box && (
                <AnnotationLayer
                  width={box.width}
                  height={box.height}
                  page={page}
                  annotations={annotations}
                  activeTool={activeTool}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onAdd={onAdd}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  disabled={disabled}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ icon, title, body, action }) {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
      <span className="material-symbols-outlined text-5xl text-outline">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-on-surface">{title}</p>
      <p className="mt-1 text-xs text-on-surface-variant max-w-xs">{body}</p>
      {action}
    </div>
  );
}
