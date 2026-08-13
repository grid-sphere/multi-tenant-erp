import { STAMP_GLYPH } from "../components/erp/teacher/marking/annotationTools";

/**
 * Burns annotations into a copy of the submitted document, producing the PDF
 * the student receives.
 *
 * pdf-lib is injected as a <script> at call time rather than imported. A bare
 * import would be resolved by webpack at BUILD time, so a missing package
 * would break the whole app's compile — the same trap that bit the pdf.js
 * loader. Injecting keeps the bundler out of it and confines any failure to
 * this one action.
 *
 * To self-host, drop pdf-lib.min.js into public/pdfjs/ and set
 * REACT_APP_PDFLIB_URL=/pdfjs/pdf-lib.min.js in the frontend .env.
 */

const PDFLIB_URL =
  process.env.REACT_APP_PDFLIB_URL ||
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

let pdfLibPromise = null;

function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (!pdfLibPromise) {
    pdfLibPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PDFLIB_URL;
      script.async = true;
      script.onload = () =>
        window.PDFLib
          ? resolve(window.PDFLib)
          : reject(new Error("pdf-lib loaded but did not register itself."));
      script.onerror = () =>
        reject(new Error(`Could not load pdf-lib from ${PDFLIB_URL}`));
      document.head.appendChild(script);
    }).catch((e) => {
      pdfLibPromise = null;
      throw e;
    });
  }
  return pdfLibPromise;
}

const hexToRgb = (PDFLib, hex, fallback = "#b91c1c") => {
  const value = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : fallback;
  return PDFLib.rgb(
    parseInt(value.slice(1, 3), 16) / 255,
    parseInt(value.slice(3, 5), 16) / 255,
    parseInt(value.slice(5, 7), 16) / 255
  );
};

const IMAGE_EXT = /\.(png|jpe?g)$/i;

/**
 * @param {string} sourceUrl  signed URL of the original submission
 * @param {string} filePath   used only to tell PDF from image
 * @param {Array}  annotations normalised 0..1 annotations
 * @returns {Promise<Blob>} the flattened PDF
 */
export async function flattenAnnotations(sourceUrl, filePath, annotations) {
  const PDFLib = await loadPdfLib();
  const { PDFDocument, StandardFonts, degrees } = PDFLib;

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch the submission (${response.status}).`);
  }
  const bytes = await response.arrayBuffer();

  const isImage = filePath ? IMAGE_EXT.test(filePath) : false;

  let pdf;
  if (isImage) {
    // Images have no pages of their own, so wrap the picture in a one-page
    // document before stamping.
    pdf = await PDFDocument.create();
    const embed = /\.png$/i.test(filePath)
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    const page = pdf.addPage([embed.width, embed.height]);
    page.drawImage(embed, { x: 0, y: 0, width: embed.width, height: embed.height });
  } else {
    pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  }

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  for (const a of annotations) {
    const page = pages[a.page];
    if (!page) continue; // annotation for a page that no longer exists

    const { width: pw, height: ph } = page.getSize();

    // Screen space has y increasing downward; PDF space has it increasing
    // upward. Every y below is flipped for that reason.
    const toPdf = (nx, ny) => ({ x: nx * pw, y: ph - ny * ph });

    const colour = hexToRgb(PDFLib, a.payload?.color);

    if (a.kind === "ink" || a.kind === "highlight") {
      const points = a.payload?.points || [];
      const isHighlight = a.kind === "highlight";
      for (let i = 1; i < points.length; i += 1) {
        const from = toPdf(points[i - 1][0], points[i - 1][1]);
        const to = toPdf(points[i][0], points[i][1]);
        page.drawLine({
          start: from,
          end: to,
          thickness: a.payload?.strokeWidth || (isHighlight ? 14 : 2.5),
          color: colour,
          opacity: a.payload?.opacity ?? (isHighlight ? 0.35 : 1),
          lineCap: PDFLib.LineCapStyle.Round,
        });
      }
      continue;
    }

    if (a.kind === "text") {
      const topLeft = toPdf(a.x, a.y);
      const boxW = a.w * pw;
      const boxH = a.h * ph;
      page.drawRectangle({
        x: topLeft.x,
        y: topLeft.y - boxH,
        width: boxW,
        height: boxH,
        color: PDFLib.rgb(1, 1, 1),
        opacity: 0.9,
        borderColor: colour,
        borderWidth: 1,
      });
      drawWrapped(page, bodyFont, a.payload?.text || "", {
        x: topLeft.x + 4,
        top: topLeft.y - 12,
        maxWidth: Math.max(10, boxW - 8),
        size: 10,
        colour,
      });
      continue;
    }

    // Stamps
    const at = toPdf(a.x, a.y);
    const size = 0.035 * pw;
    const glyph = STAMP_GLYPH[a.kind] || "•";
    page.drawText(glyph, {
      x: at.x,
      y: at.y - size * 0.35,
      size,
      font,
      color: colour,
      rotate: degrees(0),
    });

    if (a.kind === "comment" && a.payload?.text) {
      drawWrapped(page, bodyFont, a.payload.text, {
        x: at.x + size * 0.9,
        top: at.y - size * 0.1,
        maxWidth: Math.min(240, pw - at.x - size),
        size: 9,
        colour,
      });
    }
  }

  const out = await pdf.save();
  return new Blob([out], { type: "application/pdf" });
}

/** Naive word wrap — pdf-lib draws a single line at a time. */
function drawWrapped(page, font, text, { x, top, maxWidth, size, colour }) {
  const words = String(text).split(/\s+/);
  let line = "";
  let y = top;

  const flush = () => {
    if (!line) return;
    page.drawText(line, { x, y, size, font, color: colour });
    y -= size * 1.25;
    line = "";
  };

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      flush();
      line = word;
    } else {
      line = candidate;
    }
  }
  flush();
}

export default flattenAnnotations;
