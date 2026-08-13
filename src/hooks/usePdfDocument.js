import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads a PDF with pdf.js and renders one page at a time to a canvas.
 *
 * WHY pdf.js IS LOADED AT RUNTIME RATHER THAN BUNDLED
 *
 * An earlier version used `import("pdfjs-dist/build/pdf")`. That looks lazy,
 * but webpack resolves the specifier of a dynamic import at BUILD time, so a
 * missing package is a hard compile error that takes the whole app down —
 * a try/catch around it never runs. Marking is one screen; it should not be
 * able to break the build for every other route.
 *
 * Injecting a <script> tag keeps the bundler out of it entirely: pdf.js loads
 * only when a teacher opens a PDF, a network failure is a caught runtime
 * error, and no install step is required.
 *
 * To self-host instead of using the CDN, drop pdf.min.js and pdf.worker.min.js
 * into public/pdfjs/ and set REACT_APP_PDFJS_BASE=/pdfjs in the .env.
 */

const PDFJS_VERSION = "3.11.174";
const PDFJS_BASE =
  process.env.REACT_APP_PDFJS_BASE ||
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

const LIB_URL = `${PDFJS_BASE}/pdf.min.js`;
const WORKER_URL = `${PDFJS_BASE}/pdf.worker.min.js`;

let pdfjsPromise = null;

function loadPdfJs() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
    return Promise.resolve(window.pdfjsLib);
  }

  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-pdfjs="1"]`);
      const script = existing || document.createElement("script");

      const onLoad = () => {
        if (!window.pdfjsLib) {
          reject(new Error("pdf.js loaded but did not register itself."));
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
        resolve(window.pdfjsLib);
      };

      script.addEventListener("load", onLoad);
      script.addEventListener("error", () =>
        reject(new Error(`Could not load pdf.js from ${LIB_URL}`))
      );

      if (!existing) {
        script.src = LIB_URL;
        script.async = true;
        script.dataset.pdfjs = "1";
        document.head.appendChild(script);
      } else if (window.pdfjsLib) {
        onLoad();
      }
    }).catch((e) => {
      // Reset so a retry can succeed once the network recovers.
      pdfjsPromise = null;
      throw e;
    });
  }
  return pdfjsPromise;
}

/**
 * Open a PDF without a hook.
 *
 * The extraction logic below is a pure function of a pdf.js document, but the
 * hook can only hold one at a time — and React forbids calling it in a loop.
 * Processing a batch of files therefore needs a plain function. The hook
 * delegates to the same code, so there is one implementation, not two.
 *
 * Callers own the returned document and must call `.destroy()` on it.
 */
export async function openPdfDocument(url) {
  const pdfjs = await loadPdfJs();
  return pdfjs.getDocument({ url }).promise;
}

/**
 * Render pages to PNG data URLs, for sending to a vision model or OCR.
 *
 * Done in the browser rather than server-side because pdf.js is already loaded
 * and the alternative is a poppler or PyMuPDF dependency on the backend. Scale
 * is deliberately modest — handwriting is legible well below print DPI, and
 * every extra pixel costs upload time and model tokens.
 */
export async function renderDocumentToImages(
  doc,
  { scale = 1.6, maxPages = 10, onProgress } = {}
) {
  if (!doc) return [];
  const count = Math.min(doc.numPages, maxPages);
  const images = [];

  for (let i = 1; i <= count; i += 1) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;

    images.push(canvas.toDataURL("image/png"));
    onProgress?.(i, count);
  }
  return images;
}

/**
 * Pull the embedded text layer out of a PDF.
 *
 * Digitally-created PDFs — anything exported from Word, a browser, or an
 * exam-paper generator — already carry their text. Reading it is exact,
 * instant, free and entirely offline, which beats both OCR and a vision model.
 * Scans and photos have no text layer and come back empty, which is how the
 * caller knows to fall back.
 */
export async function extractDocumentTextLayer(
  doc,
  { maxPages = 100, onProgress } = {}
) {
  if (!doc) return { pages: [], hasText: false, characterCount: 0 };

  const count = Math.min(doc.numPages, maxPages);
  const pages = [];

  for (let i = 1; i <= count; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // pdf.js hands back positioned fragments, not lines. Group by vertical
    // position so the output keeps the original line breaks instead of
    // collapsing into one run-on paragraph.
    const lines = new Map();
    content.items.forEach((item) => {
      if (!item.str) return;
      const y = Math.round(item.transform[5]);
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push({ x: item.transform[4], str: item.str });
    });

    const text = [...lines.entries()]
      .sort((a, b) => b[0] - a[0]) // PDF y grows upward
      .map(([, parts]) =>
        parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.str)
          .join("")
          .trim()
      )
      .filter(Boolean)
      .join("\n");

    pages.push({ page: i, text });
    onProgress?.(i, count);
  }

  const total = pages.reduce((n, p) => n + p.text.length, 0);
  return {
    pages,
    // A handful of stray characters means a scan with a junk text layer, not a
    // real one — treat that as "no text" so OCR takes over.
    hasText: total > 40,
    characterCount: total,
  };
}

export function usePdfDocument(url) {
  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  const renderTaskRef = useRef(null);
  const docRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setDoc(null);
      setNumPages(0);
      return undefined;
    }

    setLoading(true);
    setError(null);
    setUnavailable(false);

    loadPdfJs()
      .then((pdfjs) => pdfjs.getDocument({ url }).promise)
      .then((loaded) => {
        if (cancelled) {
          loaded.destroy();
          return;
        }
        docRef.current = loaded;
        setDoc(loaded);
        setNumPages(loaded.numPages);
      })
      .catch((e) => {
        if (cancelled) return;
        // Distinguish "the viewer itself could not load" from "this PDF is
        // broken" — they need different advice.
        const libFailed = /pdf\.js/i.test(e?.message || "");
        setUnavailable(libFailed);
        setError(
          libFailed
            ? "Could not load the PDF viewer. Check your connection and try again."
            : e?.message || "Could not open this PDF."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, [url]);

  /**
   * Draw `pageNumber` (1-based) into `canvas` at `scale`.
   * Returns the CSS pixel size of the rendered page, which the annotation
   * overlay is sized against.
   */
  const renderPage = useCallback(
    async (pageNumber, canvas, scale = 1.4) => {
      if (!doc || !canvas) return null;

      // Scrolling fast queues renders faster than they complete; cancelling the
      // outstanding one avoids two tasks writing to the same canvas.
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const context = canvas.getContext("2d");
      const transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      try {
        const task = page.render({ canvasContext: context, viewport, transform });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e) {
        if (e?.name !== "RenderingCancelledException") throw e;
        return null;
      } finally {
        renderTaskRef.current = null;
      }

      return {
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
        rotation: viewport.rotation,
      };
    },
    [doc]
  );

  const renderPagesToImages = useCallback(
    (options) => renderDocumentToImages(doc, options),
    [doc]
  );

  const extractTextLayer = useCallback(
    (options) => extractDocumentTextLayer(doc, options),
    [doc]
  );

  /** Page boxes at scale 1, stored on the session so the overlay is reproducible. */
  const getDocumentMeta = useCallback(async () => {
    if (!doc) return null;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      pages.push({
        w: viewport.width,
        h: viewport.height,
        rotation: viewport.rotation,
      });
    }
    return { pages };
  }, [doc]);

  return {
    doc,
    numPages,
    loading,
    error,
    unavailable,
    renderPage,
    renderPagesToImages,
    extractTextLayer,
    getDocumentMeta,
  };
}

export default usePdfDocument;
