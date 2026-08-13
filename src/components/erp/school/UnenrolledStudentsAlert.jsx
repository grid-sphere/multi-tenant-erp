import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import markingApi from "../../../services/markingApi";

/**
 * Flags students who have no enrollment record.
 *
 * They are invisible to every scoped query — assignments filter by section,
 * exams by academic year — so their portal is silently empty and nothing a
 * teacher creates ever reaches them. Nothing in the admin UI surfaces that,
 * which makes it look like a broken app rather than missing setup.
 *
 * Renders nothing when everyone is enrolled, and stays silent on error: an
 * admin dashboard should not sprout a red box because a secondary check failed.
 */
export default function UnenrolledStudentsAlert() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    markingApi
      .getUnenrolledStudents()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data?.total_gaps) return null;

  const students = data.students || [];
  const teachers = data.teachers || [];

  return (
    <div className="rounded-xl border border-warning bg-warning/10 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-warning shrink-0">
          report
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface">
            Setup is incomplete for {data.total_gaps}{" "}
            {data.total_gaps === 1 ? "person" : "people"}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Until these are fixed, the app looks empty rather than broken to the
            people affected.
          </p>
        </div>
      </div>

      {students.length > 0 && (
        <GapList
          title={`${students.length} student${students.length === 1 ? "" : "s"} not enrolled in a class`}
          explanation="No assignment, exam or grade can reach them, and their portal stays empty."
          rows={students}
          secondary={(s) => s.enrollment_number}
          onFix={(s) => navigate(`/school-admin/students/edit/${s.id}`)}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      )}

      {teachers.length > 0 && (
        <GapList
          title={`${teachers.length} teacher${teachers.length === 1 ? "" : "s"} with no class or subject`}
          explanation="They cannot create assignments — the section and subject dropdowns are empty for them."
          rows={teachers}
          secondary={(t) => t.employee_id}
          onFix={() => navigate("/school-admin/teacher-assignment/create")}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      )}
    </div>
  );
}

function GapList({
  title,
  explanation,
  rows,
  secondary,
  onFix,
  expanded,
  setExpanded,
}) {
  const shown = expanded ? rows : rows.slice(0, 5);
  return (
    <div className="pl-9">
      <p className="text-xs font-bold text-on-surface">{title}</p>
      <p className="mt-0.5 text-xs text-on-surface-variant">{explanation}</p>
      <ul className="mt-2 space-y-1">
        {shown.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="min-w-0 truncate text-on-surface">
              {row.name}
              {secondary(row) ? (
                <span className="text-on-surface-variant"> · {secondary(row)}</span>
              ) : null}
            </span>
            <button
              onClick={() => onFix(row)}
              className="shrink-0 font-semibold text-primary hover:underline"
            >
              Fix
            </button>
          </li>
        ))}
      </ul>
      {rows.length > 5 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
