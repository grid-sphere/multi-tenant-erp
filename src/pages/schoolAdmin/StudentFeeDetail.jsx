import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SchoolLayout from "../../components/erp/school/SchoolLayout";
import { financeApi } from "../../services/financeApi";

/* ─────────────────────────────────────────────
   Skeleton Loader
───────────────────────────────────────────── */
function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`rounded-md ${className}`}
      style={{
        background: "linear-gradient(90deg, color-mix(in srgb, var(--color-outline-variant) 16%, var(--color-surface-container-lowest)) 25%, color-mix(in srgb, var(--color-outline-variant) 28%, var(--color-surface-container-lowest)) 50%, color-mix(in srgb, var(--color-outline-variant) 16%, var(--color-surface-container-lowest)) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
        ...style,
      }}
    />
  );
}

function FeeDetailSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8 animate-pulse">
      <Skeleton style={{ width: 120, height: 20 }} />
      <Skeleton style={{ width: 240, height: 32, marginTop: 20 }} />
      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant/10 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-outline-variant/10 rounded-lg">
              <Skeleton style={{ width: 24, height: 24 }} />
              <Skeleton style={{ width: 120, height: 14, marginTop: 8 }} />
              <Skeleton style={{ width: 160, height: 10, marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Status Badge (shared style with StudentFees.jsx)
───────────────────────────────────────────── */
const STATUS_STYLES = {
  Paid: "bg-success/20 text-success",
  Partial: "bg-secondary/20 text-secondary",
  Pending: "bg-outline-variant/20 text-outline",
  Overdue: "bg-error/20 text-error",
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs uppercase font-extrabold ${cls} px-3 py-1.5 rounded-full whitespace-nowrap`}>
      {status}
    </span>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">{icon}</span>
        <h3 className="text-sm font-headline font-bold text-on-surface">{title}</h3>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

function formatCurrency(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const FEE_COMPONENTS = [
  { key: "tuition_fee", label: "Tuition Fee", icon: "school" },
  { key: "transport_fee", label: "Transport Fee", icon: "directions_bus" },
  { key: "library_fee", label: "Library Fee", icon: "menu_book" },
  { key: "lab_fee", label: "Lab Fee", icon: "science" },
  { key: "sports_fee", label: "Sports Fee", icon: "sports_soccer" },
  { key: "miscellaneous", label: "Miscellaneous", icon: "more_horiz" },
];

const PAYMENT_METHOD_LABELS = {
  Cash: "Cash",
  Cheque: "Cheque",
  Bank_Transfer: "Bank Transfer",
  Online: "Online Payment",
  Card: "Credit/Debit Card",
  Other: "Other",
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function StudentFeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeApi.getStudentFeeDetail(id);
      setFee(data);
    } catch (err) {
      setError("Failed to load fee record.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SchoolLayout title="Fee Details">
        <FeeDetailSkeleton />
      </SchoolLayout>
    );
  }

  if (error || !fee) {
    return (
      <SchoolLayout title="Fee Details">
        <div className="px-4 sm:px-6 md:px-8 py-8">
          <button
            onClick={() => navigate("/school-admin/finance/student-fees")}
            className="flex items-center gap-1.5 text-primary text-sm font-bold hover:underline mb-4"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Fee Management
          </button>
          <div className="p-4 bg-error/10 text-error rounded-xl border border-error/20 text-sm font-body">
            {error || "Fee record not found."}
          </div>
        </div>
      </SchoolLayout>
    );
  }

  const paidPct = fee.total_fee > 0 ? Math.min(100, (Number(fee.amount_paid) / Number(fee.total_fee)) * 100) : 0;

  return (
    <SchoolLayout title="Fee Details">
      <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">

        {/* Back link */}
        <button
          onClick={() => navigate("/school-admin/finance/student-fees")}
          className="flex items-center gap-1.5 text-primary text-sm font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Fee Management
        </button>

        {/* Error banner (non-blocking, e.g. partial refresh failure) */}
        {error && (
          <div className="p-3 bg-error/10 text-error rounded-xl border border-error/20 text-sm font-body">
            {error}
          </div>
        )}

        {/* Header Card */}
        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-headline font-black text-lg border border-primary/20">
                {(fee.student_name || "ST").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-headline font-extrabold text-on-surface">{fee.student_name || "Unknown Student"}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
                  {fee.enrollment_number || "No enrollment number"} · {fee.student_email || "No email"}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {fee.class_level_name} · {fee.academic_year_name}
                </p>
              </div>
            </div>
            <StatusBadge status={fee.status} />
          </div>

          {/* Payment progress */}
          <div className="mt-6">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Payment Progress</span>
              <span className="text-xs font-semibold text-on-surface-variant">{paidPct.toFixed(0)}% paid</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${paidPct}%`,
                  background: fee.status === "Paid" ? "var(--color-success)" : "var(--color-primary)",
                }}
              />
            </div>
          </div>

          {/* Summary numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-outline-variant/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Fee</p>
              <p className="text-lg font-headline font-black text-on-surface mt-0.5">{formatCurrency(fee.total_fee)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Amount Paid</p>
              <p className="text-lg font-headline font-black text-success mt-0.5">{formatCurrency(fee.amount_paid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Balance Due</p>
              <p className="text-lg font-headline font-black mt-0.5" style={{ color: Number(fee.balance_due) > 0 ? "var(--color-error)" : "var(--color-on-surface)" }}>
                {formatCurrency(fee.balance_due)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Due Date</p>
              <p className="text-lg font-headline font-black text-on-surface mt-0.5">{fee.due_date || "N/A"}</p>
            </div>
          </div>
        </div>


        {/* Transaction History */}
        <SectionCard title="Recent Transactions" icon="history">
          {(!fee.transactions || fee.transactions.length === 0) ? (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">payments</span>
              <p className="text-sm font-medium">No transactions recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/10">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Method</th>
                    <th className="py-2 pr-4">Transaction ID</th>
                    <th className="py-2 pr-4 text-center">Status</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {fee.transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 pr-4 text-on-surface-variant">{t.payment_date}</td>
                      <td className="py-3 pr-4 text-on-surface-variant">{PAYMENT_METHOD_LABELS[t.payment_method] || t.payment_method}</td>
                      <td className="py-3 pr-4 font-mono text-[11px] text-on-surface-variant">{t.transaction_id}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                          t.status === "Completed" ? "bg-success/20 text-success" :
                          t.status === "Failed" ? "bg-error/20 text-error" :
                          t.status === "Refunded" ? "bg-secondary/20 text-secondary" :
                          "bg-outline-variant/20 text-outline"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-on-surface">{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <style>{`
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </SchoolLayout>
  );
}