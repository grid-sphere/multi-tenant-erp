import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import MainLayout from "../../components/erp/teacher/MainLayout";
import Card from "../../components/erp/teacher/Card";
import api from "../../services/axiosClient";

/**
 * Create an exam.
 *
 * This page used to be a static mockup — no state, no handlers, and a
 * "Publish Exam" button wired to nothing — so creating an exam silently did
 * nothing at all.
 *
 * It also carried Class and Section dropdowns, which the schema does not
 * support: an Exam is a school-wide testing event (name, academic year,
 * dates, published flag). Per-subject results hang off StudentGrade
 * afterwards, scoped to the student. Those dropdowns are gone rather than
 * left in place collecting values nothing could store.
 */
export default function CreateExamPage() {
  const navigate = useNavigate();

  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [yearsError, setYearsError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    academic_year: "",
    start_date: "",
    end_date: "",
    is_published: false,
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    api
      .get("/academics/academic-years/")
      .then(({ data }) => {
        if (cancelled) return;
        const list = data?.results || data || [];
        setYears(list);
        // Default to the active year so the common case needs no thought.
        const active = list.find((y) => y.is_active) || list[0];
        if (active) {
          setForm((f) => ({ ...f, academic_year: String(active.id) }));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setYearsError(
            e?.response?.data?.detail ||
              "Could not load academic years. An exam has to belong to one."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingYears(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Give the exam a name.";
    if (!form.academic_year) errors.academic_year = "Choose an academic year.";
    if (!form.start_date) errors.start_date = "Pick a start date.";
    if (!form.end_date) errors.end_date = "Pick an end date.";
    if (
      form.start_date &&
      form.end_date &&
      form.start_date > form.end_date
    ) {
      // The model raises this too, but catching it here avoids a round trip.
      errors.end_date = "The end date can't be before the start date.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (publish) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await api.post("/operations/exams/", {
        ...form,
        is_published: publish,
      });
      toast.success(publish ? "Exam published" : "Exam saved as draft");
      navigate(`/teacher/exams`, { state: { createdExamId: data.id } });
    } catch (e) {
      const payload = e?.response?.data;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        // Surface DRF field errors next to the fields they belong to.
        const mapped = {};
        Object.entries(payload).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toast.error(
        payload?.detail ||
          (payload && Object.values(payload)[0]) ||
          e?.message ||
          "Could not create the exam."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Create Exam">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => navigate("/teacher/exams")}
            className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Back to exams
          </button>
          <h2 className="mt-1 text-2xl font-bold text-on-surface">
            Create an exam
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            An exam is a school-wide testing period. Marks are recorded per
            student and subject once it has run.
          </p>
        </div>

        {yearsError && (
          <div className="rounded-lg border border-error bg-error/10 p-3 text-xs text-on-surface">
            {yearsError}
          </div>
        )}

        <Card className="p-6 space-y-5">
          <Field label="Exam name" error={fieldErrors.name} required>
            <input
              type="text"
              value={form.name}
              maxLength={100}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Mid-Term Examination"
              className="w-full bg-surface-container-low rounded-md px-4 py-3 text-sm text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Field
            label="Academic year"
            error={fieldErrors.academic_year}
            required
          >
            <select
              value={form.academic_year}
              disabled={loadingYears || !years.length}
              onChange={(e) => set("academic_year", e.target.value)}
              className="w-full bg-surface-container-low rounded-md px-4 py-3 text-sm text-on-surface border border-outline-variant disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {loadingYears && <option>Loading…</option>}
              {!loadingYears && !years.length && (
                <option value="">No academic years exist yet</option>
              )}
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.is_active ? " (current)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Starts" error={fieldErrors.start_date} required>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full bg-surface-container-low rounded-md px-4 py-3 text-sm text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </Field>
            <Field label="Ends" error={fieldErrors.end_date} required>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => set("end_date", e.target.value)}
                className="w-full bg-surface-container-low rounded-md px-4 py-3 text-sm text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </Field>
          </div>

          {fieldErrors.non_field_errors && (
            <p className="text-xs text-error">{fieldErrors.non_field_errors}</p>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => navigate("/teacher/exams")}
            disabled={saving}
            className="px-6 py-3 text-sm font-semibold rounded-md text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => submit(false)}
            disabled={saving || !years.length}
            className="px-6 py-3 text-sm font-bold rounded-md bg-surface-container-high text-primary hover:bg-surface-container-highest disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save as draft"}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={saving || !years.length}
            title="Published exams are visible to students and parents"
            className="px-8 py-3 text-sm font-bold rounded-md bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Publish exam"}
          </button>
        </div>

        <p className="text-xs text-on-surface-variant text-center">
          A draft stays hidden from students and parents until you publish it.
        </p>
      </div>
    </MainLayout>
  );
}

function Field({ label, error, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-on-surface-variant mb-1.5">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {children}
      {error && <span className="block mt-1 text-xs text-error">{error}</span>}
    </label>
  );
}
