import React, { useMemo } from 'react';
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { useParent } from "../../context/ParentProvider";

// Shown on every section below that's still fabricated content with no real
// AI-generation endpoint behind it yet (Learning Efficiency, Behavioral
// Insights, Study Roadmap, Recommendations). Pulled out so it's obvious at a
// glance which sections are real vs. sample, and easy to delete in one place
// once each section actually gets wired up.
const SampleNote = ({ className = "" }) => (
  <p className={`text-3xs font-bold uppercase tracking-wide text-amber-600 ${className}`}>
    Sample insight — full analysis coming soon
  </p>
);

const AIInsightsRecommendations = () => {
  // FIX: this component previously had no useParent() call at all — every
  // field (name, grade/section, avatar, subject mastery %) was hardcoded to
  // a student ("Alex Rivera") that doesn't exist in this app's data. Wired
  // up the identity fields + Concept Mastery to real context, same gradesFlat
  // source used by GradesAssessmentHub.jsx / AIInsights.jsx / PerformanceChart.jsx.
  const { activeChild, enrollment, gradesFlat } = useParent();

  const displayName = activeChild?.name || "your child";
  const classSection = enrollment
    ? `${enrollment.class_level_name || ""}${enrollment.section_name ? ` • ${enrollment.section_name}` : ""}`.trim()
    : "—";

  // activeChild.profile_picture may be a plain URL or a storage path needing
  // a signed view URL (see Sidebar.jsx's useEffect for that pattern) — only
  // the plain-URL case is handled here; falls back to a generated avatar
  // otherwise rather than showing a stock photo of someone else's child.
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`;
  const avatarSrc =
    activeChild?.profile_picture && activeChild.profile_picture.startsWith("http")
      ? activeChild.profile_picture
      : fallbackAvatar;

  // Real subject mastery — same percentage math as GradesAssessmentHub.jsx,
  // sorted strongest-first. Replaces the 3 hardcoded subjects (none of which
  // exist anywhere else in this app's data).
  const conceptMastery = useMemo(() => {
    const grades = Array.isArray(gradesFlat) ? gradesFlat : [];
    return grades
      .filter((g) => g.marks_obtained != null && g.max_marks != null && parseFloat(g.max_marks) > 0)
      .map((g) => ({
        label: g.subject_name || "Unknown Subject",
        pct: Math.round((parseFloat(g.marks_obtained) / parseFloat(g.max_marks)) * 100),
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [gradesFlat]);

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <header className="flex flex-col gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-tertiary font-bold">
              <span
                className="material-symbols-outlined text-xs"
                data-icon="auto_awesome"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >auto_awesome</span>
              <span className="text-2xs tracking-widest uppercase">Intelligent Analysis</span>
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-on-surface font-headline leading-tight">
              AI Academic Insights
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
              Deep-dive into {displayName}'s cognitive progression and learning patterns powered by Academic Architect AI.
            </p>
          </div>

          {/* Student card + button row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="bg-surface-container-low px-3 py-2 rounded-md flex items-center gap-2.5 w-full sm:w-auto">
              <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                <img
                  alt={displayName}
                  className="w-full h-full object-cover"
                  src={avatarSrc}
                  onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">{displayName}</p>
                <p className="text-3xs text-on-surface-variant font-medium uppercase tracking-tighter">{classSection}</p>
              </div>
            </div>
            {/* NOTE: "Full Report" has no onClick — same decorative-button
                pattern as the other buttons already fixed elsewhere. Left
                alone for now since it wasn't part of the requested scope
                (real student + real subject mastery only). */}
            <button className="bg-gradient-to-r from-primary to-primary-container text-white px-4 py-2 rounded-md flex items-center justify-center gap-1.5 font-semibold text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity w-full sm:w-auto">
              <span className="material-symbols-outlined text-xs" data-icon="download">download</span>
              Full Report
            </button>
          </div>
        </header>

        {/* ── Bento Insights Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">

          {/* Learning Efficiency — BLOCKED ON BACKEND: no endpoint exists for
              session-timing / retention analysis. Still sample content. */}
          <div className="sm:col-span-1 lg:col-span-4 bg-surface-container-lowest p-4 sm:p-5 rounded-lg flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-lg" data-icon="speed">speed</span>
                <span className="bg-green-100 text-green-700 text-3xs px-1.5 py-0.5 rounded font-bold whitespace-nowrap">+12% vs last month</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold font-headline mb-1">Learning Efficiency</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {displayName} is absorbing concepts faster during morning sessions. Information retention in STEM subjects has peaked at 88%.
              </p>
              <SampleNote className="mt-2" />
            </div>
            <div className="mt-4 flex items-end gap-1">
              <div className="w-full bg-slate-100 h-16 sm:h-20 rounded-sm relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-primary h-[88%] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
              </div>
            </div>
          </div>

          {/* Concept Mastery — REAL DATA, from gradesFlat */}
          <div className="sm:col-span-1 lg:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-lg shadow-sm">
            <div className="flex items-start justify-between mb-4 gap-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-headline">Concept Mastery</h3>
                <p className="text-xs text-on-surface-variant">Subject-wise depth of understanding based on active assessment.</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="w-2 h-2 rounded-full bg-surface-variant"></span>
                <span className="w-2 h-2 rounded-full bg-surface-variant"></span>
              </div>
            </div>
            {conceptMastery.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-5 text-center">
                No assessment data available yet for {displayName}.
              </p>
            ) : (
              <div className="space-y-4">
                {conceptMastery.map(({ label, pct }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-3xs sm:text-2xs font-bold uppercase tracking-wider gap-2">
                      <span className="truncate">{label}</span>
                      <span className="text-primary flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Behavioral Insights — BLOCKED ON BACKEND: no sentiment/behavioral
              analysis endpoint exists. Still sample content. */}
          <div className="sm:col-span-1 lg:col-span-5 bg-primary-container text-white p-5 sm:p-6 rounded-lg relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <div className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur rounded-full text-3xs font-bold uppercase mb-3">
                Sentiment Analysis
              </div>
              <h3 className="text-base sm:text-lg font-bold font-headline mb-2">Behavioral Insights</h3>
              <p className="opacity-90 leading-relaxed mb-4 text-xs sm:text-sm">
                AI notes a high level of collaborative initiative. {displayName} frequently assists peers in group projects, showing strong leadership potential and emotional intelligence.
              </p>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-primary-container bg-surface-variant"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-primary-container bg-secondary"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-primary-container bg-tertiary"></div>
                </div>
                <span className="text-2xs font-medium">Top Collaborator this week</span>
              </div>
              <SampleNote className="text-amber-200" />
            </div>
            <span
              className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-6xl sm:text-7xl pointer-events-none"
              data-icon="psychology"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >psychology</span>
          </div>

          {/* Personalized Study Roadmap — BLOCKED ON BACKEND: no roadmap
              generation endpoint exists. Still sample content. */}
          <div className="sm:col-span-1 lg:col-span-7 bg-surface-container-lowest p-4 sm:p-5 rounded-lg shadow-sm">
            <div className="flex items-start justify-between gap-2.5 mb-4">
              <h3 className="text-sm sm:text-base font-bold font-headline">Personalized Study Roadmap</h3>
              <SampleNote className="flex-shrink-0 mt-1" />
            </div>
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-surface-container-low rounded-md">
                <div className="text-primary bg-white p-1.5 rounded-md shadow-sm flex-shrink-0">
                  <span className="material-symbols-outlined text-sm sm:text-base" data-icon="auto_stories">auto_stories</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">Focus: Science (Advanced Chemistry)</p>
                  <p className="text-3xs text-on-surface-variant mt-0.5">Bridge the gap between current mastery and semester goal.</p>
                </div>
                <span className="text-3xs font-bold text-tertiary flex-shrink-0 mt-0.5">NEXT WEEK</span>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-surface-container-low rounded-md">
                <div className="text-primary bg-white p-1.5 rounded-md shadow-sm flex-shrink-0">
                  <span className="material-symbols-outlined text-sm sm:text-base" data-icon="edit_note">edit_note</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">Creative Writing Workshop</p>
                  <p className="text-3xs text-on-surface-variant mt-0.5">Optional AI-recommended module to boost literacy scores.</p>
                </div>
                <span className="text-3xs font-bold text-primary flex-shrink-0 mt-0.5">ENROLLING</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Recommendations — BLOCKED ON BACKEND: no recommendation-
            generation endpoint exists. Still sample content, including the
            stock photos. ── */}
        <section>
          <div className="flex items-center justify-between gap-2.5 mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-tertiary text-lg"
                data-icon="lightbulb"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >lightbulb</span>
              <h3 className="text-base sm:text-lg font-bold font-headline">AI Recommendations</h3>
            </div>
            <SampleNote />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhsxlPX4h1LN4O48l5h8-XaX6_vCa0611qXiX7hQvm45VDXAQmuASxrMqsqROy9wazsQIq1Yrl-l_VM9iLodM_p5zypoub6lYOnw_QbQ0gmeIPOsTmEhcnDtWI7ETvtVfuzM6PokeGVXkjlpHEQ0b4GQNaNv6X7viVQld-IpwC4lr9dYP5u8_fKnseY77fVH_IIMqyXQAV7viaZiWDFC2gLGUQBGO5x-P7oE2xF0pMO2tX4ivDI8cPnccr3RYjRm5mSTDp_wUE8A",
                alt: "Math",
                tagColor: "text-primary",
                tag: "Skill Enhancement",
                title: "Advance Mathematical Logic",
                desc: `Based on ${displayName}'s quick grasp of Algebra, we suggest the 'Introduction to Calculus' bridge course starting next month.`,
              },
              {
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYc-hSp3GBC3kaWnYALUBIR-OqfzMA1CwI9eWRdGN0QSoOoBqJO2ONs9iqF2O4KUqxuRyPhRhN45WAdIyOcQLs5204RFRWlAJstjP7jNSWL_KTPmfL09lrQ4NIf187t9mU8RKnCsi4vaeGgRoIfEY2OLw9qNk4aUb_2mCFVsrEYQkqSU61oCHGvGEj6-8CVV0_1XI-9FHgJp0q2Mv_WtuswYiPxfaqMD151UmZlnU9Ckhs3UwaM7qy2hSYu8vrghHCulOHvsdCcw",
                alt: "Nature",
                tagColor: "text-tertiary",
                tag: "Wellness & Balance",
                title: "Rest Pattern Adjustment",
                desc: "Concentration levels dip on Wednesdays. Consider reducing extracurricular load mid-week to sustain high performance.",
              },
              {
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAinRwCn3yxeHNlt72_xBhcYZJSZse53elr_STwuQaTJmnlmRVkJIR04aLAHmyi9J75e5DtVfolnJlrhIossddxU6noRttA3WRzC1uV1btjUvpUwXAJ0tuqLonuSlcuNQUv1uSUAGM6RK20sTxvQfi5_5Vodu8s0qSezG4LtE4AbTIuxV2NXC7bjC92jLx6sieOgJx2S_m1asBNKksAazTmsQtWM5wXdAW5CcGzVfC1w86S6NFlZ65coE1TC5J3r45UPawieAyhMA",
                alt: "Students",
                tagColor: "text-secondary",
                tag: "Social Growth",
                title: "Peer Mentorship Role",
                desc: `${displayName} is ready to lead. We recommend the 'Junior Lab Assistant' program to build confidence and communication skills.`,
              },
            ].map(({ img, alt, tagColor, tag, title, desc }) => (
              <div key={title} className="bg-surface-container-lowest p-1 rounded-lg shadow-sm">
                <div className="p-3 sm:p-4">
                  <div className="w-full h-28 sm:h-32 rounded-md mb-3 bg-slate-200 overflow-hidden">
                    <img className="w-full h-full object-cover" src={img} alt={alt} />
                  </div>
                  <p className={`text-3xs font-bold ${tagColor} uppercase tracking-tighter mb-1`}>{tag}</p>
                  <h4 className="font-bold text-sm sm:text-base mb-1.5">{title}</h4>
                  <p className="text-2xs text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-3" />
      </div>
    </DashboardLayout>
  );
};

export default AIInsightsRecommendations;