import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import MainLayout from "../../components/erp/teacher/MainLayout";
import markingApi from "../../services/markingApi";
import {
  openPdfDocument,
  renderDocumentToImages,
} from "../../hooks/usePdfDocument";

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const ACCEPT_ATTR =
  "application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp";
// Matches the OCR service's own limit, so an oversized file is refused here
// rather than after a 25MB upload through the tunnel.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 20;

const extensionOf = (name) => {
  const lower = (name || "").toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot === -1 ? "" : lower.slice(dot);
};

function describeFileProblem(file) {
  const extension = extensionOf(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return `"${file.name}" can't be read. Use a PDF, JPG, PNG or WEBP.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 25 MB per file.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  return null;
}

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Detect a vision model inventing text.
 *
 * DeepSeek-OCR is a vision-language model, not a classical OCR engine. Given a
 * page it cannot read — faint pencil, a blank half, a photo of a shadow — it
 * does not return nothing. It generates fluent, plausible prose that was never
 * on the paper. Real observed output: "BIPI model is a high-level business
 * process model and a detailed view of loved business processes."
 *
 * Silent invention is the worst failure mode here, because the text reads
 * perfectly well and a teacher marking from it has no reason to doubt it. Two
 * signals catch most of it:
 *
 *   1. The same text coming back for different pages. Genuine pages differ;
 *      a model falling into the same attractor repeats itself.
 *   2. Boilerplate vocabulary that belongs to the model's training data rather
 *      than to a school script.
 *
 * Neither is proof, so this warns rather than discards — the text may still be
 * partly right, and the teacher can see the original.
 */
const HALLUCINATION_PHRASES = [
  "business process model",
  "high-level business process",
  "is used for business process modeling",
  "lorem ipsum",
];

function assessPages(pages) {
  const texts = pages
    .map((p) => (p.text || "").trim().toLowerCase())
    .filter((t) => t.length > 40);

  const repeated =
    texts.length > 1 && new Set(texts).size < texts.length
      ? "The same text came back for more than one page."
      : null;

  const joined = texts.join(" ");
  const phrase = HALLUCINATION_PHRASES.find((p) => joined.includes(p));

  if (repeated) return repeated;
  if (phrase)
    return `The output contains stock phrasing ("${phrase}") that often means the model invented it.`;
  return null;
}

/**
 * Paper Checking — turn a PDF or photo of a script into editable text with
 * DeepSeek-OCR, one engine only.
 *
 * DeepSeek-OCR is a vision-language model, not a classical OCR engine. Given
 * a page it cannot read — faint pencil, a blank half, a photo of a shadow —
 * it does not return nothing; it invents fluent, plausible text that was
 * never on the paper. `assessPages` above catches the common signatures of
 * that (repeated text across pages, stock phrasing) and the result is
 * flagged rather than trusted silently.
 *
 * Which backend actually runs the model — the local ocr-service on this
 * machine, or a remote Colab GPU behind a Cloudflare tunnel — is held in
 * OCR_SERVICE_MODE / OCR_SERVICE_URL in the backend .env. `localOcr.mode`
 * words the UI correctly either way, and the Connect box below lets a
 * teacher update those two keys straight from here (handleConnect /
 * handleUseLocalService) instead of editing .env by hand.
 *
 * Files are processed one at a time: a single GPU serves one page at a time
 * anyway, and a sequential queue means a failure on file 3 leaves the results
 * from 1 and 2 intact.
 */
export default function TranscribePage() {
  const navigate = useNavigate();

  const [localOcr, setLocalOcr] = useState(null);

  // Lets a teacher paste a fresh Colab/Cloudflare tunnel URL in here instead
  // of editing the backend .env and restarting Django every time the tunnel
  // rotates. Starts open when the service isn't reachable; otherwise it's a
  // collapsed "change" link next to the status banner.
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectUrl, setConnectUrl] = useState("");
  const [connecting, setConnecting] = useState(false);

  const [queue, setQueue] = useState([]); // { id, file, url, isPdf, pageCount }
  const [rejected, setRejected] = useState([]);
  const [dragging, setDragging] = useState(false);

  const [busy, setBusy] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [progressNote, setProgressNote] = useState("");
  const [job, setJob] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const [results, setResults] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const pollRef = useRef(null);
  const abandonPollRef = useRef(null);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);
  const urlsRef = useRef(new Set());
  const measuredRef = useRef(new Set());

  const localUnavailable = !localOcr?.available;
  // Django reports whether it proxies to a local CPU service or a remote GPU.
  // The two differ in what they accept, how long they take, and what to do
  // when they are down, so most of the copy below branches on it.
  const isRemoteOcr = localOcr?.mode === "remote";

  const active = results.find((r) => r.id === activeId) || null;
  const totalPages = queue.reduce((n, e) => n + (e.pageCount || 1), 0);

  useEffect(() => {
    markingApi
      .getLocalOcrStatus()
      .then(setLocalOcr)
      .catch(() => setLocalOcr({ available: false }));
  }, []);

  // Open the connect box automatically when the remote GPU can't be reached —
  // a dead tunnel is the single most common reason this screen breaks, and
  // the fix is almost always pasting the new one in here.
  useEffect(() => {
    if (localOcr && !localOcr.available && localOcr.mode === "remote") {
      setConnectOpen(true);
    }
  }, [localOcr]);

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    },
    []
  );

  // A visible clock is the difference between "slow" and "broken" when a run
  // legitimately takes ten minutes.
  useEffect(() => {
    if (!busy) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
      return undefined;
    }
    const startedAt = Date.now();
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000
    );
    return () => clearInterval(timerRef.current);
  }, [busy]);

  // Page counts need pdf.js. Read them in the background so the list appears
  // immediately. `measuredRef` stops the effect re-entering itself, since it
  // writes to the state it depends on.
  useEffect(() => {
    const pending = queue.filter(
      (e) => e.isPdf && e.pageCount == null && !measuredRef.current.has(e.id)
    );
    if (!pending.length) return;
    pending.forEach((e) => measuredRef.current.add(e.id));

    (async () => {
      for (const entry of pending) {
        let doc = null;
        let count = 0;
        try {
          doc = await openPdfDocument(entry.url);
          count = doc.numPages;
        } catch {
          // Informational only — a genuinely broken PDF fails loudly later.
          count = 0;
        } finally {
          doc?.destroy();
        }
        setQueue((current) =>
          current.map((e) => (e.id === entry.id ? { ...e, pageCount: count } : e))
        );
      }
    })();
  }, [queue]);

  // ── file selection ──────────────────────────────────────────────────────

  /**
   * Validate and add files.
   *
   * Does its work before calling setQueue rather than inside the updater:
   * creating object URLs and collecting messages are side effects, and React
   * may invoke an updater twice in development, which would leak a URL and
   * duplicate every message.
   */
  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming || []);
      if (!list.length) return;

      const problems = [];
      const accepted = [];

      for (const file of list) {
        if (queue.length + accepted.length >= MAX_FILES) {
          problems.push(
            `Only ${MAX_FILES} files at a time — "${file.name}" was skipped.`
          );
          continue;
        }
        const problem = describeFileProblem(file);
        if (problem) {
          problems.push(problem);
          continue;
        }
        const duplicate = (e) =>
          e.file.name === file.name && e.file.size === file.size;
        if (queue.some(duplicate) || accepted.some(duplicate)) {
          problems.push(`"${file.name}" is already in the list.`);
          continue;
        }

        const url = URL.createObjectURL(file);
        urlsRef.current.add(url);
        accepted.push({
          id: `${file.name}-${file.size}-${Date.now()}-${accepted.length}`,
          file,
          url,
          isPdf: extensionOf(file.name) === ".pdf",
          pageCount: null,
        });
      }

      if (accepted.length) setQueue((current) => [...current, ...accepted]);
      setRejected(problems);
    },
    [queue]
  );

  const removeFile = (id) => {
    setQueue((current) => {
      const entry = current.find((e) => e.id === id);
      if (entry) {
        URL.revokeObjectURL(entry.url);
        urlsRef.current.delete(entry.url);
      }
      return current.filter((e) => e.id !== id);
    });
    setResults((current) => current.filter((r) => r.id !== id));
    setActiveId((current) => (current === id ? null : current));
  };

  const clearAll = () => {
    queue.forEach((entry) => {
      URL.revokeObjectURL(entry.url);
      urlsRef.current.delete(entry.url);
    });
    setQueue([]);
    setResults([]);
    setActiveId(null);
    setRejected([]);
  };

  // ── conversion ──────────────────────────────────────────────────────────

  const imageAsDataUrl = useCallback(
    (blob) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }),
    []
  );

  const combine = (pages) =>
    pages.length > 1
      ? pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n")
      : pages[0]?.text || "";

  const asResult = (pages, meta) => {
    const text = combine(pages);
    return {
      pages,
      text,
      page_count: pages.length,
      character_count: text.length,
      ...meta,
    };
  };

  /**
   * Poll a queued OCR job until it settles, resolving with its pages.
   *
   * Polling rather than one long request: inference takes ~50s a page on a GPU
   * and minutes on a CPU, and a held-open request is the first thing any proxy
   * in between will time out.
   */
  const pollUntilFinished = (created) =>
    new Promise((resolve, reject) => {
      const stop = () => {
        clearInterval(pollRef.current);
        pollRef.current = null;
        abandonPollRef.current = null;
      };

      // Cancelling must settle this promise, not just stop the timer. An
      // unsettled promise would leave the batch loop awaiting forever.
      abandonPollRef.current = () => {
        stop();
        resolve(null);
      };

      pollRef.current = setInterval(async () => {
        try {
          const state = await markingApi.getLocalOcrJob(created.job_id);
          setJob(state);
          setProgressNote(state.note || "");

          if (state.status === "done") {
            stop();
            resolve(state.pages || []);
          } else if (state.status === "failed") {
            stop();
            reject(new Error(state.error || "The OCR job failed."));
          } else if (state.status === "cancelled") {
            stop();
            resolve(null);
          }
        } catch (e) {
          stop();
          reject(e);
        }
      }, 3000);
    });

  /** Convert one file. Returns a result object, or null if cancelled. */
  const convertOne = async (entry) => {
    const { file, url, isPdf } = entry;

    // Remote GPU: send the original file and let Django split it. First,
    // because it needs no pdf.js at all — and rendering here would push
    // megabytes of PNG per page through the tunnel instead of a compact PDF.
    if (isRemoteOcr) {
      setProgressNote("Uploading to the GPU service…");
      const created = await markingApi.createLocalOcrUploadJob(file);
      setJob({ ...created, status: "queued" });
      setProgressNote(created.estimate || "");
      const pages = await pollUntilFinished(created);
      setJob(null);
      if (!pages) return null;
      return asResult(pages, {
        method: "local-ocr",
        suspect: assessPages(pages),
        notice:
          "Read by DeepSeek-OCR on a remote GPU. The file was sent from this " +
          "server, never from your browser.",
      });
    }

    // Local DeepSeek-OCR service on this network — needs rendered page
    // images rather than the original file.
    let doc = null;
    try {
      if (isPdf) {
        setProgressNote("Opening the PDF…");
        doc = await openPdfDocument(url);
      }

      const images = isPdf
        ? await renderDocumentToImages(doc, {
            maxPages: 30,
            scale: 2.2, // OCR benefits from more pixels
            onProgress: (done, total) =>
              setProgressNote(`Rendering page ${done} of ${total}…`),
          })
        : [await imageAsDataUrl(file)];

      if (!images.length) throw new Error("Nothing to read in that file.");

      setProgressNote("Queued with the local OCR service…");
      // Explicit rather than relying on the API's own default — this page
      // offers DeepSeek-OCR only, never the faster TrOCR fallback the local
      // service also supports.
      const created = await markingApi.createLocalOcrJob(images, {
        engine: "deepseek",
      });
      setJob({ ...created, status: "queued" });
      setProgressNote(created.estimate || "");
      const pages = await pollUntilFinished(created);
      setJob(null);
      if (!pages) return null;
      return asResult(pages, {
        method: "local-ocr",
        suspect: assessPages(pages),
        notice: "Read locally by DeepSeek-OCR. Nothing left your network.",
      });
    } finally {
      doc?.destroy();
    }
  };

  /**
   * A string, always.
   *
   * DRF field errors arrive as {"file": ["too big"]}, so the first value can
   * be an array. Passing that to React renders the items run together, and
   * passing an Error object crashes the render outright.
   */
  const errorText = (e) => {
    const data = e?.response?.data;
    const candidate =
      data?.detail ?? (data ? Object.values(data)[0] : null) ?? e?.message;
    if (Array.isArray(candidate)) return candidate.join(" ");
    if (typeof candidate === "string") return candidate;
    return "Could not convert that file.";
  };

  /**
   * Point the backend at a fresh Colab/Cloudflare tunnel. Django probes it
   * before saving, so a bad paste fails right here with a reason instead of
   * surfacing later as "the OCR service is broken".
   */
  const handleConnect = async () => {
    const url = connectUrl.trim();
    if (!url || connecting) return;
    setConnecting(true);
    try {
      const status = await markingApi.connectLocalOcr(url);
      setLocalOcr(status);
      setConnectUrl("");
      setConnectOpen(false);
      toast.success("Connected — pointed at the new tunnel");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setConnecting(false);
    }
  };

  /** Switch the backend .env back to the local CPU service on this machine. */
  const handleUseLocalService = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const status = await markingApi.resetLocalOcr();
      setLocalOcr(status);
      toast.success("Switched to the local OCR service");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setConnecting(false);
    }
  };

  const convertAll = async () => {
    if (!queue.length || busy) return;

    setBusy(true);
    setResults([]);
    setActiveId(null);
    cancelledRef.current = false;

    const toastId = toast.loading(
      queue.length === 1 ? "Reading…" : `Reading 1 of ${queue.length}…`
    );
    const collected = [];

    for (let i = 0; i < queue.length; i += 1) {
      if (cancelledRef.current) break;
      const entry = queue[i];
      setCurrentId(entry.id);

      if (queue.length > 1) {
        toast.loading(`Reading ${i + 1} of ${queue.length}: ${entry.file.name}`, {
          id: toastId,
        });
      }

      try {
        const result = await convertOne(entry);
        if (!result) continue; // cancelled
        const withFile = { ...result, id: entry.id, name: entry.file.name };
        collected.push(withFile);
        setResults((current) => [...current, withFile]);
        setActiveId((current) => current ?? entry.id);
      } catch (e) {
        const failure = {
          id: entry.id,
          name: entry.file.name,
          error: errorText(e),
        };
        collected.push(failure);
        setResults((current) => [...current, failure]);
        setActiveId((current) => current ?? entry.id);
      } finally {
        setJob(null);
        setProgressNote("");
      }
    }

    setCurrentId(null);
    setBusy(false);

    const ok = collected.filter((r) => !r.error);
    const bad = collected.length - ok.length;
    const suspect = ok.filter((r) => r.suspect).length;

    if (!collected.length) {
      toast("Cancelled", { id: toastId });
    } else if (suspect) {
      toast(
        `Done, but ${suspect} result${suspect === 1 ? "" : "s"} may be invented — check against the original`,
        { id: toastId, icon: "⚠️" }
      );
    } else if (!bad) {
      const characters = ok.reduce((n, r) => n + (r.character_count || 0), 0);
      toast.success(
        collected.length === 1
          ? `Done · ${characters.toLocaleString()} characters`
          : `Done · ${ok.length} files, ${characters.toLocaleString()} characters`,
        { id: toastId }
      );
    } else if (!ok.length) {
      toast.error(
        collected.length === 1
          ? "Could not read that file"
          : "None of the files could be read",
        { id: toastId }
      );
    } else {
      toast(`${ok.length} read, ${bad} failed`, { id: toastId, icon: "⚠️" });
    }
  };

  const cancelRun = async () => {
    cancelledRef.current = true;
    abandonPollRef.current?.();
    if (job?.job_id) {
      try {
        await markingApi.cancelLocalOcrJob(job.job_id);
      } catch {
        /* the job may already have finished */
      }
    }
    setJob(null);
    setCurrentId(null);
    setProgressNote("");
  };

  // ── output ──────────────────────────────────────────────────────────────

  const saveText = (text, filename) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadActive = () =>
    saveText(
      active.text,
      `${(active.name || "transcript").replace(/\.[^.]+$/, "")}.txt`
    );

  const downloadAll = () => {
    const readable = results.filter((r) => !r.error);
    saveText(
      readable.map((r) => `===== ${r.name} =====\n\n${r.text}`).join("\n\n\n"),
      `transcripts-${readable.length}-files.txt`
    );
  };

  const copyActive = async () => {
    try {
      await navigator.clipboard.writeText(active.text);
      toast.success("Copied");
    } catch {
      toast.error("Your browser blocked the clipboard. Select and copy instead.");
    }
  };

  const editActive = (text) =>
    setResults((current) =>
      current.map((r) =>
        r.id === activeId ? { ...r, text, character_count: text.length } : r
      )
    );

  return (
    <MainLayout title="Paper Checking">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Back
          </button>
          <h2 className="mt-1 text-2xl font-bold text-on-surface">
            Paper Checking
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Reads PDFs or photos of scripts with DeepSeek-OCR and gives you
            editable text. Drop in several at once.
          </p>
        </div>

        {/* Status */}
        <div
          className={`rounded-lg border p-3 flex items-center gap-2.5 ${
            localOcr?.available
              ? "border-outline-variant bg-surface-container-lowest"
              : "border-warning bg-warning/10"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] shrink-0 ${
              localOcr?.available ? "text-success" : "text-warning"
            }`}
          >
            {localOcr?.available ? "check_circle" : "cloud_off"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-on-surface">
              {localOcr?.available
                ? `DeepSeek-OCR connected${
                    isRemoteOcr
                      ? ` — ${localOcr.device_name || "remote GPU"}`
                      : localOcr.on_gpu
                        ? " — on GPU"
                        : " — running locally"
                  }`
                : "DeepSeek-OCR not connected"}
            </p>
            {localOcr?.available && localOcr?.speed_note && (
              <p className="text-xs text-on-surface-variant">
                {localOcr.speed_note}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setConnectOpen((v) => !v)}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            {connectOpen ? "Cancel" : isRemoteOcr ? "Change" : "Connect"}
          </button>
        </div>

        {connectOpen && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Connect a remote GPU
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Paste the https://….trycloudflare.com address the Colab
                notebook printed. It's checked before it's saved, so a stale
                or mistyped link is caught right here. This updates the
                backend .env for you and takes effect immediately — no manual
                edit or restart needed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={connectUrl}
                onChange={(e) => setConnectUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConnect();
                }}
                placeholder="https://xxxx-xxxx-xxxx.trycloudflare.com"
                disabled={connecting}
                autoFocus
                className="flex-1 min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting || !connectUrl.trim()}
                className="px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-semibold disabled:opacity-50 shrink-0"
              >
                {connecting ? "Connecting…" : "Connect"}
              </button>
            </div>
            {isRemoteOcr && (
              <button
                type="button"
                onClick={handleUseLocalService}
                disabled={connecting}
                className="self-start text-xs text-on-surface-variant hover:underline disabled:opacity-50"
              >
                Switch to the local CPU service instead
              </button>
            )}
          </div>
        )}

        {localUnavailable && !connectOpen && (
          <div className="rounded-lg border border-warning bg-warning/10 p-4">
            <p className="text-sm font-semibold text-on-surface">
              {isRemoteOcr
                ? "The remote OCR service isn't reachable"
                : "The local OCR service isn't running"}
            </p>

            {isRemoteOcr ? (
              <>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Colab runtimes and Cloudflare tunnels both expire, and
                  re-running the cloudflared cell issues a new URL even in the
                  same session.
                </p>
                <button
                  type="button"
                  onClick={() => setConnectOpen(true)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Paste the new tunnel URL
                </button>
              </>
            ) : (
              <>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Start it in a separate terminal:
                </p>
                <pre className="mt-2 text-xs bg-surface-container rounded p-2 overflow-x-auto">
{`cd "erp project/ocr-service"
python download_model.py     # ~250MB, first time only
python main.py`}
                </pre>
                <button
                  type="button"
                  onClick={() => setConnectOpen(true)}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Or connect a remote GPU instead
                </button>
              </>
            )}

            {localOcr?.detail && (
              <p className="mt-2 text-xs text-on-surface-variant">
                {localOcr.detail}
              </p>
            )}
            {localOcr?.probed && (
              <p className="mt-1 text-xs text-outline break-all">
                Tried: {localOcr.probed}
              </p>
            )}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer?.files);
          }}
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-outline-variant bg-surface-container-lowest"
          }`}
        >
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
            upload_file
          </span>
          <p className="mt-1 text-sm font-semibold text-on-surface">
            Drag files here
          </p>
          <p className="text-xs text-on-surface-variant">
            PDF, JPG, PNG or WEBP · up to 25 MB each · {MAX_FILES} at a time
          </p>
          <label className="mt-3 inline-block cursor-pointer px-4 py-2 rounded-lg text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high">
            Browse files
            <input
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                // Let the same file be re-picked after being removed.
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {rejected.length > 0 && (
          <div className="rounded-lg border border-error bg-error/10 p-3 space-y-0.5">
            {rejected.map((problem) => (
              <p key={problem} className="text-xs text-error">
                {problem}
              </p>
            ))}
          </div>
        )}

        {/* Selected files */}
        {queue.length > 0 && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-outline-variant bg-surface-container-low">
              <span className="text-xs font-semibold text-on-surface">
                {queue.length} file{queue.length === 1 ? "" : "s"}
                {totalPages > queue.length && ` · ${totalPages} pages`}
                {isRemoteOcr && totalPages > 0 && (
                  <span className="font-normal text-on-surface-variant">
                    {" "}
                    · about {Math.round((totalPages * 55) / 60) || 1} min on the GPU
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAll}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                  Clear all
                </button>
                <button
                  onClick={convertAll}
                  disabled={busy || localUnavailable}
                  className="px-5 py-1.5 rounded-lg text-xs font-bold bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                >
                  {busy
                    ? "Working…"
                    : `Convert ${queue.length === 1 ? "to text" : "all"}`}
                </button>
              </div>
            </div>

            <ul className="divide-y divide-outline-variant">
              {queue.map((entry) => {
                const result = results.find((r) => r.id === entry.id);
                return (
                  <FileRow
                    key={entry.id}
                    entry={entry}
                    state={
                      currentId === entry.id
                        ? "working"
                        : result?.error
                          ? "failed"
                          : result?.suspect
                            ? "suspect"
                            : result
                              ? "done"
                              : "pending"
                    }
                    busy={busy}
                    onRemove={() => removeFile(entry.id)}
                  />
                );
              })}
            </ul>
          </div>
        )}

        {/* Live progress */}
        {busy && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">
                  {job?.stage === "loading_model"
                    ? "Loading the OCR model…"
                    : job?.status === "queued"
                      ? "Waiting for the OCR service…"
                      : job?.total > 0
                        ? `Reading page ${Math.min((job.progress || 0) + 1, job.total)} of ${job.total}`
                        : "Working…"}
                  {elapsed > 0 && (
                    <span className="ml-2 font-normal tabular-nums text-on-surface-variant">
                      {Math.floor(elapsed / 60)}m {elapsed % 60}s
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {progressNote || job?.note || "Working…"}
                </p>
              </div>
              <button
                onClick={cancelRun}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high shrink-0"
              >
                Cancel
              </button>
            </div>

            {job?.total > 0 && job.stage !== "loading_model" && (
              <div className="mt-2 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${((job.progress || 0) / job.total) * 100}%` }}
                />
              </div>
            )}

            {elapsed > 150 && (
              <p className="mt-2 text-xs text-warning">
                {job?.stage === "loading_model"
                  ? "Still downloading. The model is several GB and this only " +
                    "happens on the first run."
                  : isRemoteOcr
                    ? "Still going. Roughly 50 seconds a page on the GPU, so a " +
                      "long script legitimately takes minutes."
                    : "Still going. Without a GPU a page takes 1–5 minutes, so " +
                      "this is expected rather than stuck."}
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
            {results.length > 1 && (
              <div className="flex gap-1 px-3 pt-3 overflow-x-auto border-b border-outline-variant bg-surface-container-low">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveId(r.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg whitespace-nowrap max-w-[14rem] truncate ${
                      r.id === activeId
                        ? "bg-surface-container-lowest text-on-surface"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    title={r.name}
                  >
                    {r.error && <span className="text-error mr-1">•</span>}
                    {!r.error && r.suspect && (
                      <span className="text-warning mr-1">•</span>
                    )}
                    {r.name}
                  </button>
                ))}
              </div>
            )}

            {active?.error ? (
              <div className="p-4">
                <p className="text-sm font-bold text-on-surface">
                  {active.name} couldn't be read
                </p>
                <p className="mt-1 text-xs text-error">{active.error}</p>
              </div>
            ) : active ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-2 min-w-0">
                    <MethodTag method={active.method} />
                    <span className="truncate">
                      {active.page_count} page
                      {active.page_count === 1 ? "" : "s"} ·{" "}
                      {active.character_count.toLocaleString()} characters
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyActive}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        content_copy
                      </span>
                      Copy
                    </button>
                    {results.filter((r) => !r.error).length > 1 && (
                      <button
                        onClick={downloadAll}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          folder_zip
                        </span>
                        All as one .txt
                      </button>
                    )}
                    <button
                      onClick={downloadActive}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        download
                      </span>
                      Download .txt
                    </button>
                  </div>
                </div>

                {/* The model invented text. Loud, because it reads perfectly
                    well and there is otherwise nothing to notice. */}
                {active.suspect && (
                  <div className="m-4 rounded-lg border border-warning bg-warning/10 p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-warning shrink-0">
                        warning
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface">
                          This may not be what's on the page
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {active.suspect} A vision model asked to read a page
                          it can't make out will write fluent text that was
                          never there, rather than returning nothing. Compare it
                          against the original before marking from it.
                        </p>
                        <p className="mt-2 text-xs text-on-surface-variant">
                          A sharper, better-lit scan usually fixes it.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {active.notice && !active.suspect && (
                  <p className="px-4 pt-3 text-xs text-warning">
                    {active.notice}
                  </p>
                )}

                <textarea
                  value={active.text}
                  onChange={(e) => editActive(e.target.value)}
                  rows={20}
                  spellCheck={false}
                  aria-label={`Converted text from ${active.name}`}
                  className="w-full px-4 py-3 text-sm font-mono bg-transparent text-on-surface resize-y focus:outline-none"
                />
                <p className="px-4 pb-3 text-xs text-on-surface-variant">
                  Edit anything above before downloading — corrections are saved
                  into the file.
                </p>
              </>
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const ICONS = {
  ".pdf": "picture_as_pdf",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
};

function FileRow({ entry, state, busy, onRemove }) {
  const extension = extensionOf(entry.file.name);
  const badge = {
    pending: null,
    working: { label: "Reading…", cls: "text-primary" },
    done: { label: "Done", cls: "text-success" },
    suspect: { label: "Check it", cls: "text-warning" },
    failed: { label: "Failed", cls: "text-error" },
  }[state];

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span
        className={`material-symbols-outlined text-[20px] shrink-0 ${
          state === "working"
            ? "text-primary animate-pulse"
            : "text-on-surface-variant"
        }`}
      >
        {ICONS[extension] || "draft"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-on-surface truncate" title={entry.file.name}>
          {entry.file.name}
        </p>
        <p className="text-xs text-on-surface-variant">
          {formatSize(entry.file.size)}
          {entry.isPdf && entry.pageCount > 0 && (
            <> · {entry.pageCount} page{entry.pageCount === 1 ? "" : "s"}</>
          )}
          {extension && <> · {extension.slice(1).toUpperCase()}</>}
        </p>
      </div>

      {badge && (
        <span className={`text-xs font-semibold shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      )}

      <button
        onClick={onRemove}
        disabled={busy}
        aria-label={`Remove ${entry.file.name}`}
        className="shrink-0 p-1 rounded text-on-surface-variant hover:text-error hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </li>
  );
}

function MethodTag({ method }) {
  // Only one engine is offered on this page, so this is really just a
  // constant label — kept as a component in case a second route returns.
  if (method !== "local-ocr") return null;
  return (
    <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary">
      DeepSeek-OCR
    </span>
  );
}
