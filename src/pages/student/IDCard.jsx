import React, { useRef, useState, useEffect } from "react";
import { useStudent } from "../../context/StudentProvider";
import { API_BASE_URL } from "../../services/api";

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchViewUrl(filePath) {
  if (!filePath) return null;
  const token = localStorage.getItem("access_token");
  const res = await fetch(
    `${API_BASE_URL}/api/v1/uploads/view-url/?file_path=${encodeURIComponent(filePath)}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.url || data.view_url || null;
}

// ─── ID Card Visual ──────────────────────────────────────────────────────────

function IDCardVisual({ student, enroll, avatarSrc, cardRef }) {
  const fullName = student?.name || `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim();
  const classInfo = enroll ? `${enroll.class_level_name} – ${enroll.section_name}` : "—";
  const rollNo = enroll?.roll_number ?? "—";
  const enrollNo = student?.enrollment_number ?? "—";
  const email = student?.email ?? "—";
  const dob = student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("en-IN", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  }) : "—";
  
  // Get academic year
  const academicYear = enroll?.academic_year_name || "2026-27";
  const yearDisplay = academicYear.replace(/\s/g, '');

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
        <div style={{ 
          display: "flex", 
          gap: "18px",
          alignItems: "flex-start",
        }}>
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
          <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            paddingTop: "2px",
          }}>
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
          #{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ID Card ──────────────────────────────────────────────────────

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

// ─── Modal ───────────────────────────────────────────────────────────────────

export default function IDCardModal({ onClose }) {
  const { profile: student, enrollment: enroll } = useStudent();

  const cardRef = useRef(null);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resolve avatar URL
  useEffect(() => {
    if (!student?.profile_picture) {
      setLoading(false);
      return;
    }
    if (student.profile_picture.startsWith("http")) {
      setAvatarSrc(student.profile_picture);
      setLoading(false);
      return;
    }
    fetchViewUrl(student.profile_picture).then(url => {
      if (url) setAvatarSrc(url);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [student?.profile_picture]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
      const name = student?.name || `${student?.first_name ?? "student"}`.trim();
      link.download = `ID_Card_${name.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      setMsg({ type: "success", text: "ID card downloaded successfully!" });
    } catch (err) {
      console.error("ID card download failed:", err);
      setMsg({ type: "error", text: "Download failed. Please try again." });
    } finally {
      setDownloading(false);
    }
  };

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
        {/* Modal Panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-surface-container-lowest rounded-2xl shadow-2xl"
          style={{
            maxWidth: "480px",
            width: "100%",
            overflow: "hidden",
            animation: "idcard-in 0.22s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base font-extrabold text-on-surface font-headline">Student ID Card</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Preview & download your identity card</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
            </button>
          </div>

          {/* Card Preview */}
          <div 
            className="p-6 flex justify-center items-center" 
            style={{ 
              background: "#f0f2f5",
              minHeight: "540px",
            }}
          >
            {loading ? (
              <SkeletonIDCardVisual />
            ) : (
              <IDCardVisual
                student={student}
                enroll={enroll}
                avatarSrc={avatarSrc}
                cardRef={cardRef}
              />
            )}
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-outline-variant/20 flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-base">
                {downloading ? "hourglass_empty" : "download"}
              </span>
              {downloading ? "Generating…" : "Download PNG"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
            >
              Close
            </button>
          </div>

          {/* Status */}
          {msg && (
            <div className={`mx-5 mb-4 text-xs font-semibold flex items-center gap-1.5 ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>
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