import api from "./axiosClient";

/**
 * Finance module API — talks to the `finance` Django app
 * (mounted at /api/v1/finance/).
 */
export const financeApi = {
  // ── Student Fees ──────────────────────────────────────────────
  // The backend list endpoint doesn't currently support server-side
  // filtering/search (no filterset_fields configured on StudentFeeViewSet),
  // so pass no query params here — filtering/search is done client-side,
  // same pattern as Students.jsx / TeacherAssignment.jsx / ParentStudentMapping.jsx.
  getStudentFees: (page = 1) =>
    api.get(`finance/student-fees/?page=${page}`).then((res) => res.data),

  getStudentFeeDetail: (id) =>
    api.get(`finance/student-fees/${id}/`).then((res) => res.data),

  // ── Fee Structures (used to populate class/year context if needed) ──
  getFeeStructures: (page = 1) =>
    api.get(`finance/fee-structures/?page=${page}`).then((res) => res.data),

  // ── Bulk Upload ───────────────────────────────────────────────
  // Backend only accepts .xlsx/.xls (not .csv) — see FeeExcelParser.
  bulkUploadFees: (file, { updateExisting = true, batchSize = 50 } = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("update_existing", String(updateExisting));
    formData.append("batch_size", String(batchSize));
    return api
      .post("finance/student-fees/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  // ── Add Payment (individual student) ─────────────────────────
  // POST /api/v1/finance/student-fees/{feeId}/add-payment/
  // payload: { amount, payment_method, payment_date, reference_number, notes }
  // Returns the updated StudentFeeDetail (including refreshed transactions list).
  addPayment: (feeId, payload) =>
    api
      .post(`finance/student-fees/${feeId}/add-payment/`, payload)
      .then((res) => res.data),

  // ── Transactions ──────────────────────────────────────────────
  // Note: StudentFeeDetailSerializer already embeds the last 10 transactions
  // for a given fee record, so the detail page doesn't need this. This is
  // here for a possible future "full transaction history" view — the
  // backend's FeeTransactionViewSet only supports filtering by `student`,
  // `payment_method`, and `status` (not by student_fee).
  getStudentTransactions: (studentId, page = 1) =>
    api
      .get(`finance/transactions/?student=${studentId}&page=${page}`)
      .then((res) => res.data),
};