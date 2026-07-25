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

function SectionCard({ title, icon, children, action }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">{icon}</span>
          <h3 className="text-sm font-headline font-bold text-on-surface">{title}</h3>
        </div>
        {action}
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

const INITIAL_PAYMENT_FORM = {
  amount: "",
  payment_method: "Cash",
  payment_date: new Date().toISOString().slice(0, 10),
  reference_number: "",
  notes: "",
};

/* ─────────────────────────────────────────────
   Add Payment Modal
───────────────────────────────────────────── */
function AddPaymentModal({ fee, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_PAYMENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = Number(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
      setFormError("Enter a valid amount greater than zero.");
      return;
    }
    if (amountNum > Number(fee.balance_due)) {
      setFormError(`Amount exceeds balance due (${formatCurrency(fee.balance_due)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await financeApi.addPayment(fee.id, form);
      onSuccess(updated);
    } catch (err) {
      setFormError(
        err?.response?.data?.error || "Failed to record payment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-md border border-outline-variant/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-headline font-bold text-on-surface">Add Payment</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="text-xs text-error bg-error/10 p-2.5 rounded-lg border border-error/20">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-on-surface-variant">
              Amount &nbsp;
              <span className="font-normal">(Balance due: {formatCurrency(fee.balance_due)})</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm bg-surface-container-lowest text-on-surface"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant">Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm bg-surface-container-lowest text-on-surface"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant">Payment Date</label>
            <input
              type="date"
              required
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm bg-surface-container-lowest text-on-surface"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant">Reference Number (optional)</label>
            <input
              type="text"
              value={form.reference_number}
              onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm bg-surface-container-lowest text-on-surface"
              placeholder="e.g. cheque no., UTR no."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant/30 text-sm bg-surface-container-lowest text-on-surface resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-3 py-2 text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-xs font-bold bg-primary text-on-primary px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function StudentFeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);

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

  const handlePaymentSuccess = (updatedFee) => {
    setFee(updatedFee);
    setShowAddPayment(false);
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
            <div className="flex items-center gap-3">
              <StatusBadge status={fee.status} />
              <button
                onClick={() => setShowAddPayment(true)}
                disabled={Number(fee.balance_due) <= 0}
                title={Number(fee.balance_due) <= 0 ? "This fee is fully paid" : "Add a payment"}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add Payment
              </button>
            </div>
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

        {showAddPayment && (
          <AddPaymentModal
            fee={fee}
            onClose={() => setShowAddPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}

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