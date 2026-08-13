import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../layouts/MainLayout";
import MarkedScriptView from "../../components/erp/marking/MarkedScriptView";

/** Student's view of their returned, marked work. */
export default function MarkedWork() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  return (
    <MainLayout title="Marked Work">
      <div className="p-4 md:p-6">
        <MarkedScriptView
          submissionId={submissionId}
          onBack={() => navigate("/student/assignments")}
        />
      </div>
    </MainLayout>
  );
}
