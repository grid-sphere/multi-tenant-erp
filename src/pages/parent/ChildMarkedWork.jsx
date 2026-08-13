import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import MarkedScriptView from "../../components/erp/marking/MarkedScriptView";

/**
 * Parent's view of their child's returned work.
 *
 * Access is decided server-side from the parent-student mapping, so this page
 * carries no permission logic of its own — a parent without academic access
 * gets a 403 the component renders as a plain "no access" notice.
 */
export default function ChildMarkedWork() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <MarkedScriptView
          submissionId={submissionId}
          onBack={() => navigate("/parent/assignments")}
        />
      </div>
    </DashboardLayout>
  );
}
