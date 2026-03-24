import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import AppShell from '../components/layout/AppShell';
import { useToast } from '../components/ui/ToastProvider';

type DoctorReport = {
  checkup: string;
  date: string;
  doctor: string;
  specialty: string;
  summary: string;
  plan: string;
};

type TimelineItem = {
  time: string;
  event: string;
  detail: string;
};

type PatientDetails = {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  current_status: string;
  status_note: string;
  primary_unit?: string;
  latest_report?: string;
  nurse_note?: string;
  nurse_notes?: string;
  doctor_reports?: DoctorReport[];
  care_timeline?: TimelineItem[];
};

type EditForm = {
  full_name: string;
  age: string;
  gender: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  current_status: string;
  status_note: string;
  primary_unit: string;
  latest_report: string;
  nurse_note: string;
  nurse_notes: string;
  doctor_reports_json: string;
  care_timeline_json: string;
};

const initialForm: EditForm = {
  full_name: '',
  age: '',
  gender: '',
  bed_number: '',
  ward: 'ICU',
  diagnosis: '',
  current_status: 'STABLE',
  status_note: '',
  primary_unit: 'Critical Care',
  latest_report: '',
  nurse_note: '',
  nurse_notes: '',
  doctor_reports_json: '[]',
  care_timeline_json: '[]',
};

export default function NursePatientEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [form, setForm] = useState<EditForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const patientId = useMemo(() => id || '', [id]);

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const patient = (await api.patients.getById(patientId)) as PatientDetails;
        setForm({
          full_name: patient.full_name || '',
          age: patient.age ? String(patient.age) : '',
          gender: patient.gender || '',
          bed_number: patient.bed_number || '',
          ward: patient.ward || 'ICU',
          diagnosis: patient.diagnosis || '',
          current_status: patient.current_status || 'STABLE',
          status_note: patient.status_note || '',
          primary_unit: patient.primary_unit || 'Critical Care',
          latest_report: patient.latest_report || '',
          nurse_note: patient.nurse_note || '',
          nurse_notes: patient.nurse_notes || '',
          doctor_reports_json: JSON.stringify(patient.doctor_reports || [], null, 2),
          care_timeline_json: JSON.stringify(patient.care_timeline || [], null, 2),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load patient';
        pushToast({ type: 'error', title: 'Load failed', message });
      } finally {
        setLoading(false);
      }
    };

    void loadPatient();
  }, [patientId, pushToast]);

  const parseArrayJson = (value: string, label: string) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        pushToast({
          type: 'error',
          title: `${label} must be a JSON array`,
          message: `Please correct ${label.toLowerCase()} and try again.`,
        });
        return null;
      }
      return parsed;
    } catch {
      pushToast({
        type: 'error',
        title: `Invalid ${label} JSON`,
        message: `Please fix ${label.toLowerCase()} format and try again.`,
      });
      return null;
    }
  };

  const savePatient = async () => {
    if (!patientId) return;
    if (!form.full_name.trim() || !form.bed_number.trim()) {
      pushToast({ type: 'error', title: 'Missing fields', message: 'Patient name and bed number are required.' });
      return;
    }

    const doctorReports = parseArrayJson(form.doctor_reports_json, 'Doctor Reports');
    if (!doctorReports) return;

    const careTimeline = parseArrayJson(form.care_timeline_json, 'Care Timeline');
    if (!careTimeline) return;

    try {
      setSaving(true);
      await api.patients.update(patientId, {
        full_name: form.full_name,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        bed_number: form.bed_number,
        ward: form.ward || 'ICU',
        diagnosis: form.diagnosis,
        current_status: form.current_status,
        status_note: form.status_note,
        primary_unit: form.primary_unit,
        latest_report: form.latest_report,
        nurse_note: form.nurse_note,
        nurse_notes: form.nurse_notes,
        doctor_reports: doctorReports,
        care_timeline: careTimeline,
      });
      pushToast({ type: 'success', title: 'Patient updated', message: 'Family report details were saved successfully.' });
      navigate('/admin/patients');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update patient';
      pushToast({ type: 'error', title: 'Save failed', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="admin">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Nurse Update View</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Edit Patient Details</h2>
          </div>
          <Link
            to="/admin/patients"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={15} /> Back to Patients
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading patient details...</p>
        ) : (
          <div className="space-y-3">
            <input
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Full name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.age}
                onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="Age"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                placeholder="Gender"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.bed_number}
                onChange={(e) => setForm((prev) => ({ ...prev, bed_number: e.target.value }))}
                placeholder="Bed number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={form.ward}
                onChange={(e) => setForm((prev) => ({ ...prev, ward: e.target.value }))}
                placeholder="Ward"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <textarea
              value={form.diagnosis}
              onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Diagnosis / condition"
              className="h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.current_status}
                onChange={(e) => setForm((prev) => ({ ...prev, current_status: e.target.value.toUpperCase() }))}
                placeholder="Current status"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={form.primary_unit}
                onChange={(e) => setForm((prev) => ({ ...prev, primary_unit: e.target.value }))}
                placeholder="Primary unit"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <input
              value={form.status_note}
              onChange={(e) => setForm((prev) => ({ ...prev, status_note: e.target.value }))}
              placeholder="Current status summary"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={form.latest_report}
              onChange={(e) => setForm((prev) => ({ ...prev, latest_report: e.target.value }))}
              placeholder="Latest report headline"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={form.nurse_note}
              onChange={(e) => setForm((prev) => ({ ...prev, nurse_note: e.target.value }))}
              placeholder="Nurse note"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <textarea
              value={form.nurse_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, nurse_notes: e.target.value }))}
              placeholder="Notes from nurse"
              className="h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Doctor Reports (JSON Array)</label>
            <textarea
              value={form.doctor_reports_json}
              onChange={(e) => setForm((prev) => ({ ...prev, doctor_reports_json: e.target.value }))}
              className="h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Care Timeline (JSON Array)</label>
            <textarea
              value={form.care_timeline_json}
              onChange={(e) => setForm((prev) => ({ ...prev, care_timeline_json: e.target.value }))}
              className="h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/patients')}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void savePatient()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        )}
      </motion.section>
    </AppShell>
  );
}
