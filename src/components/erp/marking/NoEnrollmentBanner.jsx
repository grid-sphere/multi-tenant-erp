import React from "react";
import { useStudent } from "../../../context/StudentProvider";

/**
 * Warns a student that they are not on a class list.
 *
 * Assignments, exams and grades are all scoped by enrollment on the server —
 * `AssignmentViewSet` filters by section and `ExamViewSet` by academic year,
 * both returning nothing when there is no enrollment record. Without this
 * banner those pages just look empty, which reads as "my teacher hasn't set
 * anything" rather than "my account is not finished".
 *
 * Renders nothing at all in the normal case.
 */
export default function NoEnrollmentBanner({ context = "work" }) {
  const { enrollment, loading } = useStudent();

  if (loading || enrollment) return null;

  return (
    <div className="rounded-lg border border-warning bg-warning/10 p-4 flex items-start gap-3">
      <span className="material-symbols-outlined text-warning shrink-0">
        report
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-on-surface">
          You're not on a class list yet
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Your account hasn't been added to a class and section, so no {context}{" "}
          can reach you. Ask the school office to enroll you — nothing here will
          fill in until they do.
        </p>
      </div>
    </div>
  );
}
