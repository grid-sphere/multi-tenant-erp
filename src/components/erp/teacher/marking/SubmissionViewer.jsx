import React, { useEffect, useState } from "react";

/**
 * Renders the submitted document.
 *
 * Phase 1 embeds the file directly — the browser's own PDF viewer for PDFs, an
 * <img> for images. Phase 2 replaces the PDF branch with a pdf.js canvas plus
 * an SVG annotation overlay; the surrounding chrome (zoom, toolbar, error and
 * expiry handling) is built here so that swap touches one branch only.
 */

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic)$/i;
const PDF_EXT = /\.pdf$/i;

export default function SubmissionViewer({ viewUrl, filePath, onReload }) {
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [viewUrl]);

  const isImage = filePath ? IMAGE_EXT.test(filePath) : false;
  const isPdf = filePath ? PDF_EXT.test(filePath) : !isImage;

  if (!viewUrl) {
    return (
      <Empty
        icon="draft"
        title="No file to mark"
        body="This student submitted without attaching a file."
      />
    );
  }

  if (failed) {
    return (
      <Empty
        icon="link_off"
        title="Could not load the document"
        body="The signed link may have expired. Reloading will request a fresh one."
        action={
          <button
            onClick={onReload}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
          >
            Reload
          </button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Viewer toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-outline-variant bg-surface-container-low shrink-0">
        <span className="text-xs text-on-surface-variant truncate">
          {filePath ? filePath.split("/").pop() : "Submission"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {isImage && (
            <>
              <ToolbarButton
                icon="zoom_out"
                label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              />
              <span className="text-xs tabular-nums text-on-surface-variant w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <ToolbarButton
                icon="zoom_in"
                label="Zoom in"
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              />
            </>
          )}
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in a new tab"
            className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[18px]">
              open_in_new
            </span>
          </a>
        </div>
      </div>

      {/* Document */}
      <div className="flex-1 min-h-0 overflow-auto bg-surface-container">
        {isPdf ? (
          <object
            data={viewUrl}
            type="application/pdf"
            className="w-full h-full min-h-[600px]"
            aria-label="Submitted PDF"
          >
            {/* Browsers without an inline PDF viewer land here */}
            <Empty
              icon="picture_as_pdf"
              title="Inline preview unavailable"
              body="This browser cannot display PDFs inline."
              action={
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90"
                >
                  Open the PDF
                </a>
              }
            />
          </object>
        ) : (
          <div className="p-4 flex justify-center">
            <img
              src={viewUrl}
              alt="Student submission"
              onError={() => setFailed(true)}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              className="max-w-full rounded-lg shadow-md transition-transform duration-150"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant"
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function Empty({ icon, title, body, action }) {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
      <span className="material-symbols-outlined text-5xl text-outline">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold text-on-surface">{title}</p>
      <p className="mt-1 text-xs text-on-surface-variant max-w-xs">{body}</p>
      {action}
    </div>
  );
}
