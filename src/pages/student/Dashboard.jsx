import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { getMonthName } from "../../utils/calculations";
import { useStudent } from "../../context/StudentProvider";
import IDCardModal from "./IDCard";
import NoEnrollmentBanner from "../../components/erp/marking/NoEnrollmentBanner";

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />;
}

/* ─── Sparkline SVG (static trend line) ─────────────────────────────────── */
function Sparkline({ points = [], color = "#6366f1", height = 32 }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => h - ((v - min) / range) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Donut / ring chart, used for attendance split + weekly progress ──── */
function DonutChart({ segments = [], size = 56, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="currentColor" className="text-surface-container-high" strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        if (!seg.value) return null;
        const frac = seg.value / total;
        const dash = frac * circumference;
        const strokeDashoffset = -offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/* ─── Small original flat-illustration mascot for the hero banner ──────── */
function HeroMascot() {
  return (
    <svg viewBox="0 0 160 200" className="w-full h-full" aria-hidden="true">
      <ellipse cx="80" cy="190" rx="44" ry="7" fill="rgba(0,0,0,0.15)" />
      <path d="M40 198 L40 142 Q40 102 80 102 Q120 102 120 142 L120 198 Z" fill="#1e3a8a" />
      <rect x="60" y="150" width="40" height="22" rx="8" fill="#1d4ed8" opacity="0.6" />
      <path d="M106 132 Q128 122 130 98 Q131 90 124 88 Q118 87 116 94 Q114 102 106 110 Z" fill="#1e3a8a" />
      <circle cx="128" cy="92" r="10" fill="#f3c39a" />
      <rect x="123" y="83" width="10" height="14" rx="4" fill="#f3c39a" />
      <circle cx="80" cy="66" r="33" fill="#f3c39a" />
      <path d="M47 58 Q47 28 80 28 Q113 28 113 58 Q113 42 95 38 Q85 48 69 40 Q57 46 47 58Z" fill="#241c19" />
      <circle cx="68" cy="68" r="3" fill="#241c19" />
      <circle cx="92" cy="68" r="3" fill="#241c19" />
      <path d="M68 82 Q80 90 92 82" stroke="#241c19" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <MainLayout title="Dashboard">
      <div className="px-4 sm:px-8 py-6 space-y-6">
        <Skeleton className="h-36 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function DashboardError({ message, onRetry }) {
  return (
    <MainLayout title="Dashboard">
      <div className="px-8 py-16 flex flex-col items-center text-center gap-4">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-base font-bold text-on-surface">Couldn&apos;t load your dashboard</p>
        <p className="text-sm text-on-surface-variant max-w-md">{message}</p>
        <button onClick={onRetry} className="mt-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
          Try Again
        </button>
      </div>
    </MainLayout>
  );
}

/* ─── Upcoming Assignment Card ───────────────────────────────────────────── */
function AssignmentItem({ assignment }) {
  const due = assignment.due_date ? new Date(assignment.due_date) : null;
  const now = new Date();
  const daysLeft = due ? Math.ceil((due - now) / 86400000) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 2;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  const statusCls = isOverdue
    ? "text-red-600 bg-red-50"
    : isUrgent
    ? "text-amber-600 bg-amber-50"
    : "text-green-700 bg-green-50";

  const statusLabel = isOverdue
    ? "Overdue"
    : daysLeft === 0
    ? "Due Today"
    : daysLeft === 1
    ? "Due Tomorrow"
    : daysLeft !== null
    ? `${daysLeft}d left`
    : "No date";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low/50 transition-colors rounded-lg group">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-sm text-primary">assignment</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{assignment.title || assignment.assignment_title || "Assignment"}</p>
        <p className="text-2xs text-on-surface-variant truncate">
          {assignment.subject_name || assignment.subject || ""}
        </p>
      </div>
      <span className={`text-2xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusCls}`}>
        {statusLabel}
      </span>
    </div>
  );
}

const CIRCULAR_ACCENTS = [
  { bg: "bg-red-50", text: "text-red-500" },
  { bg: "bg-blue-50", text: "text-blue-500" },
  { bg: "bg-violet-50", text: "text-violet-500" },
];

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function Dashboard() {
  const {
    profile: student,
    dashboard: studentData,
    enrollment: enroll,
    academic,
    attendanceRecords,
    submissions,
    circulars,
    loading,
    error,
    reload,
  } = useStudent();

  const [showIDCard, setShowIDCard] = useState(false);
  const [calMonthOffset, setCalMonthOffset] = useState(0);

  const now       = useMemo(() => new Date(), []);
  const year      = now.getFullYear();
  const month     = now.getMonth();
  const monthWord = getMonthName(month);

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  // ── Calendar can be browsed independently of the "current month" stats ──
  const calDate   = useMemo(() => new Date(year, month + calMonthOffset, 1), [year, month, calMonthOffset]);
  const calYear   = calDate.getFullYear();
  const calMonth  = calDate.getMonth();
  const calMonthWord = getMonthName(calMonth);
  const calDaysCount = new Date(calYear, calMonth + 1, 0).getDate();
  const calDays       = Array.from({ length: calDaysCount }, (_, i) => i + 1);
  const calFirstDay   = new Date(calYear, calMonth, 1).getDay();
  const calEmptyDays  = Array.from({ length: calFirstDay }, (_, i) => i);

  const attendanceMap = useMemo(() => {
    if (!Array.isArray(attendanceRecords)) return {};
    return attendanceRecords.reduce((acc, r) => { acc[r.date] = r; return acc; }, {});
  }, [attendanceRecords]);

  // Distribution for the "current month" (drives the calendar-adjacent counts)
  const monthlyDist = useMemo(() => {
    const s = { Present: 0, Absent: 0, Late: 0 };
    if (!Array.isArray(attendanceRecords)) return s;
    attendanceRecords.forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month && s[r.status] !== undefined) s[r.status]++;
    });
    return s;
  }, [attendanceRecords, year, month]);

  // Distribution for whichever month is currently shown in the calendar
  const calMonthlyDist = useMemo(() => {
    const s = { Present: 0, Absent: 0, Late: 0 };
    if (!Array.isArray(attendanceRecords)) return s;
    attendanceRecords.forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth && s[r.status] !== undefined) s[r.status]++;
    });
    return s;
  }, [attendanceRecords, calYear, calMonth]);

  // Compute attendance streak
  const streak = useMemo(() => {
    if (!Array.isArray(attendanceRecords)) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rec = attendanceMap[key];
      if (rec && rec.status === "Present") count++;
      else if (i > 0) break;
    }
    return count;
  }, [attendanceRecords, attendanceMap]);

  const top4Subjects = useMemo(() => {
    const grades   = studentData?.grades?.results || [];
    const subjects = academic?.subs              || [];
    const seen = new Set();
    const uniqueSubjects = subjects.filter((sub) => {
      const key = sub.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return uniqueSubjects
      .map((sub) => ({
        subject: sub,
        gradeInfo:
          grades.find((g) => g.subject === sub.id) ||
          grades.find((g) => g.subject_name?.trim().toLowerCase() === sub.name.trim().toLowerCase()) ||
          null,
      }))
      .sort((a, b) => {
        if (a.gradeInfo && !b.gradeInfo) return -1;
        if (!a.gradeInfo && b.gradeInfo) return 1;
        if (a.gradeInfo && b.gradeInfo)
          return b.gradeInfo.marks_obtained / b.gradeInfo.max_marks - a.gradeInfo.marks_obtained / a.gradeInfo.max_marks;
        return 0;
      })
      .slice(0, 4);
  }, [studentData, academic]);

  // Upcoming assignments from dashboard raw
  const upcomingAssignments = useMemo(() => {
    const raw = studentData?.dashboardRaw?.upcoming_assignments || [];
    return raw.slice(0, 4);
  }, [studentData]);

  const nextForSubject = (subjectName) => {
    const match = upcomingAssignments.find(
      (a) => (a.subject_name || a.subject || "").toLowerCase() === subjectName.toLowerCase()
    );
    if (!match) return null;
    const due = match.due_date ? new Date(match.due_date) : null;
    return {
      title: match.title || match.assignment_title || "Assignment",
      dueLabel: due ? due.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "",
    };
  };

  // Recent circulars drive the notification badge
  const recentCircularsCount = useMemo(() => {
    if (!Array.isArray(circulars)) return 0;
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return circulars.filter((c) => c.created_at && new Date(c.created_at).getTime() >= cutoff).length;
  }, [circulars]);

  if (loading) return <DashboardSkeleton />;
  if (!student) return <DashboardError message={error || "Your profile couldn't be loaded."} onRetry={reload} />;

  const attendanceRate = Number(studentData?.attendanceSummary?.attendance_percentage ?? 0);
  const percentage = studentData?.reportCard?.overall_percentage != null
    ? Number(studentData.reportCard.overall_percentage).toFixed(1)
    : "0.0";

  const rank = studentData?.reportCard?.rank ?? studentData?.reportCard?.class_rank ?? null;
  const rankTotal = studentData?.reportCard?.class_size ?? studentData?.reportCard?.total_students ?? null;

  const percentageStatus =
    parseFloat(percentage) >= 75 ? { label: "EXCELLENT",    cls: "text-green-800 bg-green-100",  icon: "trending_up"  } :
    parseFloat(percentage) >= 60 ? { label: "GOOD",         cls: "text-blue-800 bg-blue-100",    icon: "thumb_up"     } :
    parseFloat(percentage) >= 45 ? { label: "SATISFACTORY", cls: "text-amber-800 bg-amber-100",  icon: "warning"      } :
                                   { label: "AT RISK",      cls: "text-red-800 bg-red-100",      icon: "priority_high" };

  const attendanceStatus =
    attendanceRate >= 80 ? { label: "ON TRACK",     cls: "text-green-800 bg-green-100"  } :
    attendanceRate >= 65 ? { label: "SATISFACTORY", cls: "text-amber-800 bg-amber-100"  } :
                           { label: "AT RISK",      cls: "text-red-800 bg-red-100"      };

  const attendanceGoal = 75;

  // Needed-days math uses ALL attendance records (not just the current month),
  // so it stays meaningful even early in a new month before this month has records.
  const totalDaysAll = attendanceRecords?.length || 0;
  const presentDaysAll = attendanceRecords?.filter(r => r.status === "Present").length || 0;

  let neededDays = 0;
  if (attendanceRate < attendanceGoal && totalDaysAll > 0) {
    neededDays = Math.ceil((attendanceGoal * totalDaysAll - 100 * presentDaysAll) / (100 - attendanceGoal));
    neededDays = Math.max(0, neededDays);
  }

  const attendanceGapMsg = attendanceRate >= attendanceGoal
    ? "You're smashing your attendance goal! 🎉"
    : neededDays === 0 && totalDaysAll === 0
    ? "Start attending classes to track your progress!"
    : `Only ${neededDays} more day${neededDays === 1 ? "" : "s"} of attendance to reach ${attendanceGoal}%`;

  const getSubjectIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("math"))                            return { icon: "calculate",     bg: "bg-blue-50   text-blue-600"   };
    if (n.includes("phys"))                            return { icon: "rocket_launch", bg: "bg-purple-50 text-purple-600" };
    if (n.includes("comp") || n.includes("code"))      return { icon: "code",          bg: "bg-orange-50 text-orange-600" };
    if (n.includes("eng")  || n.includes("lit"))       return { icon: "history_edu",   bg: "bg-indigo-50 text-indigo-600" };
    if (n.includes("chem"))                            return { icon: "science",        bg: "bg-green-50  text-green-600"  };
    if (n.includes("bio"))                             return { icon: "biotech",        bg: "bg-teal-50   text-teal-600"   };
    if (n.includes("hindi") || n.includes("sanskrit")) return { icon: "translate",      bg: "bg-rose-50   text-rose-600"   };
    if (n.includes("social") || n.includes("sst"))     return { icon: "public",         bg: "bg-amber-50  text-amber-600"  };
    return                                                    { icon: "menu_book",      bg: "bg-slate-100 text-slate-600"  };
  };

  const getGradeLetter = (obtained, max) => {
    const p = (obtained / max) * 100;
    if (p >= 90) return { letter: "A+", cls: "text-green-700  bg-green-100"  };
    if (p >= 80) return { letter: "A",  cls: "text-blue-700   bg-blue-100"   };
    if (p >= 70) return { letter: "B+", cls: "text-yellow-700 bg-yellow-100" };
    if (p >= 60) return { letter: "B",  cls: "text-orange-700 bg-orange-100" };
    return              { letter: "C",  cls: "text-red-700    bg-red-100"    };
  };

  const dayStatusCls = {
    Present: "bg-green-100  text-green-700  border-green-200",
    Absent:  "bg-red-100    text-red-700    border-red-200",
    Late:    "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const attendanceSparkline = totalDaysAll > 0
    ? [60, 65, attendanceRate - 5, attendanceRate - 2, attendanceRate + 1, attendanceRate - 1, attendanceRate]
    : [0, 0, 0, 0, 0, 0, 0];

  const gradeSparkline = parseFloat(percentage) > 0
    ? [55, 62, 68, parseFloat(percentage) - 4, parseFloat(percentage) - 1, parseFloat(percentage)]
    : [0, 0, 0, 0, 0, 0];

  // Today's attendance record (if marked yet) — feeds the Attendance quick-action badge
  const todayAttendanceRecord = attendanceMap[todayKey] || null;

  // ── Attendance ring is always driven by attendanceRate itself (the number
  //    printed next to it), so it never goes blank just because this month's
  //    day-by-day records haven't been logged yet. Color reflects status.
  const attendanceRingColor =
    attendanceRate >= attendanceGoal ? "#22c55e" : attendanceRate >= 50 ? "#f59e0b" : "#ef4444";

  const quickActions = [
    {
      icon: "badge", label: "ID Card", description: "View and download your digital ID card",
      action: () => setShowIDCard(true), to: null,
      accentBg: "bg-blue-50", accentText: "text-blue-600",
      badge: { label: "View", bg: "bg-blue-50", text: "text-blue-700" },
    },
    {
      icon: "support_agent", label: "Help Desk", description: "Get help and resolve your queries quickly",
      to: "/student/help",
      accentBg: "bg-violet-50", accentText: "text-violet-600",
      badge: { label: "Support", bg: "bg-violet-50", text: "text-violet-700" },
    },
    {
      icon: "account_balance_wallet", label: "Fees", description: "View fee details and payment history",
      to: "/student/fees",
      accentBg: "bg-green-50", accentText: "text-green-600",
      badge: { label: "Paid", bg: "bg-green-50", text: "text-green-700" },
    },
    {
      icon: "assignment", label: "Assignments", description: "View and submit your assignments",
      to: "/student/assignments",
      accentBg: "bg-amber-50", accentText: "text-amber-600",
      badge: upcomingAssignments.length > 0
        ? { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", count: upcomingAssignments.length }
        : { label: "All Done", bg: "bg-green-50", text: "text-green-700" },
    },
    {
      icon: "event_available", label: "Attendance", description: "Check your attendance records and overview",
      to: "/student/attendance",
      accentBg: "bg-blue-50", accentText: "text-blue-600",
      badge: { label: todayAttendanceRecord ? todayAttendanceRecord.status : "Today", bg: "bg-blue-50", text: "text-blue-700" },
    },
    {
      icon: "psychology", label: "AI Tutor", description: "Get AI-powered help for your studies",
      to: "/student/ai-tutor",
      accentBg: "bg-violet-50", accentText: "text-violet-600",
      badge: { label: "AI Powered", bg: "bg-violet-50", text: "text-violet-700", sparkle: true },
    },
  ];

  return (
    <>
      {showIDCard && <IDCardModal onClose={() => setShowIDCard(false)} />}

      <MainLayout
        title="Dashboard"
        headerActions={
          <button
            onClick={() => setShowIDCard(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-white text-on-surface-variant border border-outline-variant/30 transition-all duration-200 text-xs font-bold group"
          >
            <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">badge</span>
            <span className="hidden sm:inline">ID Card</span>
          </button>
        }
      >
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5">

          {/* Everything below is scoped by enrollment server-side, so without
              one the whole dashboard reads as an empty school rather than an
              unfinished account. */}
          <NoEnrollmentBanner context="classwork" />

          {/* ── HERO BANNER ── */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-800 p-6 sm:p-8 text-white">
            <span className="material-symbols-outlined absolute text-white/25 text-sm" style={{ top: "16%", left: "46%" }}>auto_awesome</span>
            <span className="material-symbols-outlined absolute text-white/20 text-xs" style={{ top: "62%", left: "40%" }}>auto_awesome</span>
            <span className="material-symbols-outlined absolute text-white/20 text-xs" style={{ top: "30%", left: "54%" }}>auto_awesome</span>

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-white/70 text-sm font-semibold mb-1">
                  {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-headline mb-2">
                  {greeting}, {student?.first_name}! 👋
                </h2>
                <p className="text-white/80 text-sm sm:text-base mb-4">
                  You&apos;re doing great in <span className="font-bold text-white">{enroll?.class_level_name}</span>.
                  Keep up the momentum!
                </p>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full pl-1.5 pr-3 py-1">
                  <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xs">
                      {attendanceRate >= attendanceGoal ? "celebration" : totalDaysAll > 0 ? "check_circle" : "info"}
                    </span>
                  </span>
                  <span className="text-xs font-semibold">{attendanceGapMsg}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-end">
                <div className="hidden sm:flex flex-col gap-2">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                    <span className="text-lg leading-none">🔥</span>
                    <div>
                      <p className="text-2xs text-white/70 uppercase tracking-wider">Attendance Streak</p>
                      <p className="text-lg font-black text-white leading-tight">{streak} days</p>
                    </div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                    <div>
                      <p className="text-2xs text-white/70 uppercase tracking-wider">Assignments Due</p>
                      <p className="text-lg font-black text-white leading-tight">{upcomingAssignments.length}</p>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block w-24 h-32 flex-shrink-0">
                  <HeroMascot />
                </div>

                <div className="bg-white/95 text-on-surface rounded-xl px-4 py-3 text-center flex-shrink-0 shadow-lg min-w-[92px]">
                  <p className="text-2xs text-on-surface-variant uppercase tracking-wider font-bold">Today</p>
                  <p className="text-sm font-black mt-1 whitespace-nowrap">
                    {upcomingAssignments.length > 0 ? `${upcomingAssignments.length} due` : "All clear!"}
                  </p>
                  <span className="mt-1.5 inline-flex w-6 h-6 rounded-full bg-green-100 text-green-600 items-center justify-center">
                    <span className="material-symbols-outlined text-sm">
                      {upcomingAssignments.length > 0 ? "pending_actions" : "check"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </section>

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Attendance */}
            <div className="bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant/10 hover:scale-[1.02] hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {/* Ring fill = attendanceRate itself, so it always matches the number beside it */}
                  <DonutChart
                    segments={[
                      { value: attendanceRate, color: attendanceRingColor },
                      { value: Math.max(0, 100 - attendanceRate), color: "#e5e7eb" },
                    ]}
                  />
                  <div>
                    <p className="text-2xs font-semibold text-on-surface-variant uppercase tracking-wider">Attendance</p>
                    <p className="text-2xl font-black font-headline text-on-surface leading-tight">
                      {attendanceRate}<span className="text-sm font-bold">%</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {totalDaysAll > 0 && <Sparkline points={attendanceSparkline} color="#3b82f6" />}
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${attendanceStatus.cls}`}>
                    {attendanceStatus.label}
                  </span>
                </div>
              </div>
              <div className="px-4 pb-2 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 text-2xs text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />{monthlyDist.Present} Present</span>
                <span className="flex items-center gap-1 text-2xs text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{monthlyDist.Absent} Absent</span>
                <span className="flex items-center gap-1 text-2xs text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{monthlyDist.Late} Late</span>
              </div>
              <div className="px-4 pb-4">
                <p className="text-2xs text-on-surface-variant mb-1.5">
                  {totalDaysAll === 0
                    ? "No attendance records yet. Start attending classes!"
                    : attendanceRate >= attendanceGoal
                      ? "You're doing great, keep it up!"
                      : attendanceGapMsg}
                </p>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (attendanceRate / attendanceGoal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Overall Percentage */}
            <div className="bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant/10 hover:scale-[1.02] hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-secondary-fixed text-secondary flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">grade</span>
                  </span>
                  <div>
                    <p className="text-2xs font-semibold text-on-surface-variant uppercase tracking-wider">Performance</p>
                    <p className="text-2xl font-black font-headline text-on-surface leading-tight">
                      {percentage}<span className="text-sm font-bold">%</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {parseFloat(percentage) > 0 && <Sparkline points={gradeSparkline} color="#8b5cf6" />}
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${percentageStatus.cls}`}>
                    {percentageStatus.label}
                  </span>
                </div>
              </div>
              <div className="px-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-2xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs">{percentageStatus.icon}</span>
                  Overall score
                </div>
                {rank != null && (
                  <p className="text-2xs text-on-surface-variant">
                    Rank <span className="font-bold text-on-surface">{rank}{rankTotal ? ` / ${rankTotal}` : ""}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Fees */}
            <div className="bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant/10 hover:scale-[1.02] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-green-50 text-green-700 flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </span>
                  <div>
                    <p className="text-2xs font-semibold text-on-surface-variant uppercase tracking-wider">Fees Status</p>
                    <p className="text-2xl font-black font-headline text-on-surface leading-tight">Paid</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-2xs text-green-600 font-semibold whitespace-nowrap">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" /> Active
                </span>
              </div>
              <div className="px-4 pb-4 mt-auto flex items-center justify-between gap-2">
                <div>
                  <p className="text-2xs text-on-surface-variant">Next Due</p>
                  <p className="text-xs font-bold text-on-surface">Oct 15, 2024</p>
                </div>
                <Link
                  to="/student/fees"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-white text-primary text-2xs font-bold transition-all duration-200"
                >
                  View Receipt
                  <span className="material-symbols-outlined text-xs">download</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ── UPCOMING ASSIGNMENTS ── */}
          {upcomingAssignments.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant/10">
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-amber-600">pending_actions</span>
                  </span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Upcoming Assignments</p>
                    <p className="text-2xs text-on-surface-variant">Due soon</p>
                  </div>
                </div>
                <Link to="/student/assignments" className="flex items-center gap-0.5 text-2xs font-bold text-primary hover:underline">
                  View All
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
              <div className="divide-y divide-surface-container-low/50 py-1">
                {upcomingAssignments.map((a, i) => (
                  <AssignmentItem key={a.id || i} assignment={a} />
                ))}
              </div>
            </div>
          )}

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
            <div className="xl:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

              {/* Attendance Calendar */}
              <div className="xl:h-full bg-surface-container-lowest rounded-xl p-4 custom-shadow border border-outline-variant/10 transition-all duration-200 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-on-surface">{calMonthWord} {calYear}</p>
                    <p className="text-2xs text-on-surface-variant">Attendance Overview</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCalMonthOffset(0)}
                      className="px-2.5 py-1 rounded-md text-2xs font-bold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setCalMonthOffset((o) => o - 1)}
                      aria-label="Previous month"
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setCalMonthOffset((o) => o + 1)}
                      aria-label="Next month"
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_right</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-0.5">
                    {["S","M","T","W","T","F","S"].map((d, i) => (
                      <div key={i} className="text-center text-[8px] font-bold text-outline pb-0.5">{d}</div>
                    ))}
                    {calEmptyDays.map((_, i) => <div key={`e-${i}`} />)}
                    {calDays.map((day) => {
                      const dateKey = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const record  = attendanceMap[dateKey];
                      const isToday = dateKey === todayKey;
                      return (
                        <div
                          key={day}
                          className={`aspect-square flex items-center justify-center rounded text-3xs font-semibold border transition-all hover:scale-110 ${
                            isToday
                              ? "bg-primary text-white border-primary shadow-sm"
                              : record
                                ? (dayStatusCls[record.status] ?? "bg-surface-container border-surface-container")
                                : "bg-surface-container-lowest border-surface-container text-on-surface-variant"
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-2 border-t border-surface-container-low flex-wrap">
                  {[
                    { color: "bg-green-400", label: "Present", count: calMonthlyDist.Present },
                    { color: "bg-red-400",   label: "Absent",  count: calMonthlyDist.Absent  },
                    { color: "bg-yellow-400",label: "Late",    count: calMonthlyDist.Late    },
                  ].map(({ color, label, count }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                      <span className="text-3xs font-semibold text-on-surface-variant">
                        {label} <span className="font-bold text-on-surface">{count}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/student/attendance"
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-container-low hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all duration-200"
                >
                  View Full Attendance
                </Link>
              </div>

              {/* My Subjects */}
              <div className="xl:h-full bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant/10 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-surface-container-low flex-shrink-0">
                  <div>
                    <p className="text-xs font-bold text-on-surface">My Subjects</p>
                    <p className="text-2xs text-on-surface-variant">Graded first</p>
                  </div>
                  <Link to="/student/grades" className="flex items-center gap-0.5 text-2xs font-bold text-primary hover:underline">
                    View More
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>
                <div className="flex-1 divide-y divide-surface-container-low overflow-hidden">
                  {top4Subjects.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-on-surface-variant">No subjects found.</div>
                  ) : (
                    top4Subjects.map(({ subject, gradeInfo }) => {
                      const { icon, bg } = getSubjectIcon(subject.name);
                      const subPct = gradeInfo
                        ? ((parseFloat(gradeInfo.marks_obtained) / parseFloat(gradeInfo.max_marks)) * 100).toFixed(1)
                        : null;
                      const grade = gradeInfo ? getGradeLetter(gradeInfo.marks_obtained, gradeInfo.max_marks) : null;
                      const next = nextForSubject(subject.name);
                      return (
                        <div key={subject.id} className="flex items-center gap-3 px-4 py-4 hover:bg-surface-container-low/40 transition-colors group/row">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${bg} group-hover/row:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-sm">{icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-on-surface truncate pr-1">{subject.name}</p>
                              {subPct ? (
                                <span className="text-xs text-on-surface-variant flex-shrink-0 font-semibold">{subPct}%</span>
                              ) : (
                                <span className="text-2xs text-outline flex-shrink-0">N/A</span>
                              )}
                            </div>
                            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-700"
                                style={{ width: `${subPct || 0}%` }}
                              />
                            </div>
                            {next && (
                              <p className="text-3xs text-on-surface-variant mt-1 truncate">
                                Next: {next.title}{next.dueLabel ? ` · ${next.dueLabel}` : ""}
                              </p>
                            )}
                          </div>
                          {grade ? (
                            <span className={`text-2xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${grade.cls}`}>{grade.letter}</span>
                          ) : (
                            <span className="text-2xs text-outline flex-shrink-0 w-6 text-center">—</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-2 border-t border-surface-container-low flex-shrink-0">
                  <Link to="/student/grades" className="w-full flex items-center justify-center gap-1 text-2xs font-bold text-primary hover:text-primary-container transition-colors py-0.5">
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                    View Full Report Card
                  </Link>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-4">

              {/* Quick Actions */}
              <section className="bg-surface-container-low rounded-xl p-4">
                <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {quickActions.map((item) => {
                    const cardCls = "group relative flex flex-col items-start bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant/10 p-2.5 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all duration-200 text-left";
                    const content = (
                      <>
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.accentBg} ${item.accentText}`}>
                            <span className="material-symbols-outlined text-base">{item.icon}</span>
                          </span>
                          <span className="material-symbols-outlined text-xs text-on-surface-variant opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                            arrow_forward
                          </span>
                        </div>
                        <p className="text-2xs font-bold text-on-surface leading-tight">{item.label}</p>
                        {item.badge && (
                          <span className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${item.badge.bg} ${item.badge.text}`}>
                            {item.badge.count != null ? `${item.badge.label} · ${item.badge.count}` : item.badge.label}
                          </span>
                        )}
                      </>
                    );
                    return item.action ? (
                      <button key={item.label} onClick={item.action} className={cardCls}>{content}</button>
                    ) : (
                      <Link key={item.label} to={item.to} className={cardCls}>{content}</Link>
                    );
                  })}
                </div>
              </section>

              {/* Circulars Preview */}
              <section className="bg-surface-container-lowest rounded-xl p-4 custom-shadow border border-outline-variant/10 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">campaign</span>
                    </span>
                    <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Circulars</h3>
                    {circulars?.length > 0 && (
                      <span className="text-[9px] font-bold w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        {circulars.length}
                      </span>
                    )}
                  </div>
                  <Link to="/student/circulars" className="group/all flex items-center gap-0.5 text-2xs font-bold text-primary hover:underline">
                    View all
                    <span className="material-symbols-outlined text-xs transition-transform duration-200 group-hover/all:translate-x-0.5">arrow_forward</span>
                  </Link>
                </div>
                {(!circulars || circulars.length === 0) ? (
                  <p className="text-xs text-on-surface-variant text-center py-3">No circulars yet.</p>
                ) : (
                  <div className="divide-y divide-surface-container-low">
                    {circulars.slice(0, 3).map((c, i) => {
                      const accent = CIRCULAR_ACCENTS[i % CIRCULAR_ACCENTS.length];
                      const isRecent = c.created_at && (Date.now() - new Date(c.created_at).getTime()) <= 3 * 24 * 60 * 60 * 1000;
                      return (
                        <Link
                          key={c.id}
                          to="/student/circulars"
                          className="group/circular relative flex items-start gap-2.5 py-2.5 pl-2.5 pr-1 -mx-1 rounded-lg hover:bg-surface-container-low/60 active:scale-[0.99] transition-all duration-150"
                        >
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-0.5 rounded-full bg-primary group-hover/circular:h-4/5 transition-all duration-200" />
                          <span className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover/circular:scale-110 ${accent.bg} ${accent.text}`}>
                            <span className="material-symbols-outlined text-sm">campaign</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-on-surface truncate group-hover/circular:text-primary transition-colors">{c.title}</p>
                              {isRecent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">New</span>
                              )}
                            </div>
                            <p className="text-2xs text-on-surface-variant mt-0.5">
                              {c.created_by_name || "School Administration"}
                              {c.created_at && ` · ${new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant opacity-0 -translate-x-1 group-hover/circular:opacity-100 group-hover/circular:translate-x-0 transition-all duration-200 flex-shrink-0 self-center">
                            chevron_right
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>
          </div>

        </div>
      </MainLayout>
    </>
  );
}