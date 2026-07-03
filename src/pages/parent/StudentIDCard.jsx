// src/pages/parent/StudentIDCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Downloadable Student ID Card for the Parent Portal.
// Matches the student panel's ID card design 1:1. Reacts to activeChild from
// ParentProvider — switching the child instantly shows the correct card.
//
// activeChild (from the dashboard bundle) doesn't carry DOB or the picture —
// those are fetched separately whenever the selected child changes:
//   - getChildDetail()  -> DOB, email, blood group etc.
//   - getChildPicture() -> pre-signed R2 URL (already signed, no proxy needed)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect } from "react";
import { useParent } from "../../context/ParentProvider";
import { getChildDetail, getChildPicture } from "../../services/parentAPIs";

// ── ID Card Visual ────────────────────────────────────────────────────────────

function IDCardVisual({ child, enrollment, avatarSrc, cardRef }) {
  const fullName = child?.name || "—";
  const classInfo = enrollment
    ? `${enrollment.class_level_name} – ${enrollment.section_name}`
    : "—";
  const rollNo = enrollment?.roll_number || "—";
  const enrollNo = child?.enrollment_number || "—";
  const email = child?.email || "—";
  const dob = child?.date_of_birth
    ? new Date(child.date_of_birth).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const academicYear = enrollment?.academic_year_name || "2026-27";
  const yearDisplay = academicYear.replace(/\s/g, "");

  return (
    <div
      ref={cardRef}
      style={{
        width: "340px",
        height: "500px",
        background: "linear-gradient(145deg, #0f172a 0%, #1a3a6a 50%, #1e40af 100%)",
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "24px 26px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: "absolute", top: "-80px", right: "-80px",
        width: "200px", height: "200px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.03)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "80px", left: "-60px",
        width: "150px", height: "150px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.02)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "200px", right: "-40px",
        width: "100px", height: "100px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.02)",
        pointerEvents: "none",
      }} />

      {/* ─── HEADER ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "16px",
        flexShrink: 0,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: "48px", height: "48px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontSize: "22px" }}>🏫</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "16px",
            letterSpacing: "0.3px",
            lineHeight: 1.2,
          }}>
            Academic Architect
          </div>
          <div style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "9px",
            letterSpacing: "3px",
            fontWeight: 600,
            marginTop: "2px",
          }}>
            STUDENT IDENTITY CARD
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: "6px",
          padding: "4px 10px",
          color: "rgba(255,255,255,0.4)",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.5px",
          border: "1px solid rgba(255,255,255,0.05)",
          whiteSpace: "nowrap",
        }}>
          {yearDisplay}
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        paddingTop: "20px",
        position: "relative",
        zIndex: 1,
        gap: "14px",
      }}>
        {/* Photo + Name section */}
        <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
          {/* Photo */}
          <div style={{
            width: "84px",
            height: "104px",
            borderRadius: "12px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
            flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Student"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ fontSize: "38px", color: "rgba(255,255,255,0.2)" }}>👤</span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: "2px" }}>
            {/* ─── NAME ─── */}
            <div style={{
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "20px",
              lineHeight: 1.3,
              marginBottom: "8px",
              letterSpacing: "0.5px",
            }}>
              {fullName}
            </div>

            {/* ─── GRADE ─── */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(99,179,237,0.12)",
              borderRadius: "6px",
              padding: "4px 14px",
              color: "#93c5fd",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              marginBottom: "16px",
              alignSelf: "flex-start",
            }}>
              {classInfo}
            </div>

            {/* ─── DETAILS GRID ─── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
              <div>
                <div style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "3px",
                }}>
                  Roll No
                </div>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: 600 }}>
                  {rollNo}
                </div>
              </div>
              <div>
                <div style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "3px",
                }}>
                  Enroll ID
                </div>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: 600 }}>
                  {enrollNo}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── EMAIL & DOB ─── */}
        <div style={{
          padding: "14px 18px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.04)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "auto",
        }}>
          <div>
            <div style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "7px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "3px",
            }}>
              Email
            </div>
            <div style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "11px",
              wordBreak: "break-all",
              lineHeight: 1.3,
            }}>
              {email}
            </div>
          </div>
          <div>
            <div style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "7px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "3px",
            }}>
              DOB
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 500 }}>
              {dob}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        position: "relative",
        zIndex: 1,
        marginTop: "4px",
      }}>
        <div style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: "8px",
          letterSpacing: "0.8px",
          fontWeight: 500,
        }}>
          VALID {yearDisplay}
        </div>

        {/* Barcode decoration */}
        <div style={{ display: "flex", gap: "1.5px", alignItems: "flex-end" }}>
          {[8, 12, 6, 14, 10, 7, 16, 9, 11, 5, 13, 8, 10, 12, 7, 9, 14, 6, 11, 10].map((h, i) => (
            <div key={i} style={{
              width: "2px",
              height: `${h}px`,
              background: "rgba(255,255,255,0.12)",
              borderRadius: "1px",
            }} />
          ))}
        </div>

        <div style={{
          color: "rgba(255,255,255,0.15)",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          fontFamily: "'Courier New', monospace",
        }}>
          #{String(child?.id ? child.id.toString().slice(-4).padStart(4, "0") : "0000")}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ID Card ──────────────────────────────────────────────────────

function SkeletonIDCardVisual() {
  return (
    <div
      style={{
        width: "340px",
        height: "500px",
        background: "linear-gradient(145deg, #0f172a 0%, #1a3a6a 50%, #1e40af 100%)",
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "24px 26px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.02)" }} />

      {/* Header skeleton */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "16px",
        flexShrink: 0,
      }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }} className="animate-pulse" />
        <div style={{ flex: 1 }}>
          <div style={{ width: "60%", height: "16px", background: "rgba(255,255,255,0.07)", borderRadius: "4px" }} className="animate-pulse" />
          <div style={{ width: "40%", height: "8px", marginTop: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} className="animate-pulse" />
        </div>
        <div style={{ width: "50px", height: "20px", background: "rgba(255,255,255,0.04)", borderRadius: "6px" }} className="animate-pulse" />
      </div>

      {/* Body skeleton */}
      <div style={{ flex: 1, paddingTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", gap: "18px" }}>
          <div style={{ width: "84px", height: "104px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.05)" }} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ width: "70%", height: "20px", background: "rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "8px" }} className="animate-pulse" />
            <div style={{ width: "50%", height: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", marginBottom: "16px" }} className="animate-pulse" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
              <div>
                <div style={{ width: "40%", height: "7px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "3px" }} className="animate-pulse" />
                <div style={{ width: "60%", height: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} className="animate-pulse" />
              </div>
              <div>
                <div style={{ width: "40%", height: "7px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "3px" }} className="animate-pulse" />
                <div style={{ width: "70%", height: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} className="animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div style={{
          padding: "14px 18px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "10px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "auto",
        }}>
          <div>
            <div style={{ width: "30%", height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "3px" }} className="animate-pulse" />
            <div style={{ width: "80%", height: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} className="animate-pulse" />
          </div>
          <div>
            <div style={{ width: "30%", height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", marginBottom: "3px" }} className="animate-pulse" />
            <div style={{ width: "60%", height: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} className="animate-pulse" />
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        paddingTop: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "4px",
      }}>
        <div style={{ width: "30%", height: "7px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} className="animate-pulse" />
        <div style={{ display: "flex", gap: "1.5px", alignItems: "flex-end" }}>
          {[8, 12, 6, 14, 10, 7, 16, 9, 11, 5, 13, 8, 10, 12, 7, 9, 14, 6, 11, 10].map((h, i) => (
            <div key={i} style={{ width: "2px", height: `${h}px`, background: "rgba(255,255,255,0.04)", borderRadius: "1px" }} className="animate-pulse" />
          ))}
        </div>
        <div style={{ width: "20%", height: "7px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} className="animate-pulse" />
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function StudentIDCardModal({ onClose }) {
  const { activeChild, enrollment, students, switchChild } = useParent();

  const cardRef = useRef(null);
  const [childDetail, setChildDetail] = useState(null); // extra fields: DOB, email
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fetch extra child fields (DOB, email) + signed profile picture URL
  // whenever the active child changes. The picture URL is already signed
  // (expires_in: 3600s from the API) — no separate view-url proxy call needed.
  useEffect(() => {
    if (!activeChild?.id) {
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setAvatarSrc(null);
    setMsg(null);

    const load = async () => {
      try {
        const [detailRes, pictureRes] = await Promise.allSettled([
          getChildDetail(activeChild.id),
          getChildPicture(activeChild.id),
        ]);

        if (cancelled) return;

        setChildDetail(detailRes.status === "fulfilled" ? detailRes.value : null);

        if (
          pictureRes.status === "fulfilled" &&
          pictureRes.value?.has_picture &&
          pictureRes.value?.url
        ) {
          setAvatarSrc(pictureRes.value.url);
        }
      } catch (err) {
        console.error("[StudentIDCard] failed to load child detail/picture:", err);
        if (!cancelled) setChildDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeChild?.id]);

  // Merge base child (name, enrollment_number) with detail fields (DOB, email)
  const mergedChild = activeChild
    ? { ...activeChild, ...childDetail }
    : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setMsg(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: 340,
        height: 500,
      });
      const link = document.createElement("a");
      const safeName = (activeChild?.name || "student").replace(/\s+/g, "_");
      link.download = `ID_Card_${safeName}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      setMsg({ type: "success", text: "ID card downloaded!" });
    } catch (err) {
      console.error("[StudentIDCard] download failed:", err);
      setMsg({ type: "error", text: "Download failed. Please try again." });
    } finally {
      setDownloading(false);
    }
  };

  const loading = detailLoading;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }}
      >
        {/* Panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700"
          style={{
            maxWidth: "480px", width: "100%",
            overflow: "hidden",
            animation: "idcard-in 0.22s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Student ID Card
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Preview &amp; download identity card
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm text-slate-500 dark:text-slate-400">close</span>
            </button>
          </div>

          {/* Child tabs — visible only if parent has multiple children */}
          {students.length > 1 && (
            <div className="flex gap-1 px-5 pt-3 pb-1 overflow-x-auto">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => switchChild(s.id)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    s.id === activeChild?.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {s.name.split(" ")[0]}
                </button>
              ))}
            </div>
          )}

          {/* Card Preview */}
          <div
            className="p-6 flex justify-center items-center"
            style={{ background: "#f0f2f5", minHeight: "540px" }}
          >
            {loading ? (
              <SkeletonIDCardVisual />
            ) : (
              <IDCardVisual
                child={mergedChild}
                enrollment={enrollment}
                avatarSrc={avatarSrc}
                cardRef={cardRef}
              />
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">
                {downloading ? "hourglass_empty" : "download"}
              </span>
              {downloading ? "Generating…" : "Download PNG"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Status message */}
          {msg && (
            <div className={`mx-5 mb-4 text-xs font-semibold flex items-center gap-1.5 ${
              msg.type === "success" ? "text-green-600" : "text-red-500"
            }`}>
              <span className="material-symbols-outlined text-sm">
                {msg.type === "success" ? "check_circle" : "error"}
              </span>
              {msg.text}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes idcard-in {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}