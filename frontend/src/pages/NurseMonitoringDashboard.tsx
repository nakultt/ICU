import { motion } from 'framer-motion';
import { Activity, FileText, Pill, PlusCircle, Save, Stethoscope, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { api, getUserName } from '../api';
import { useToast } from '../components/ui/ToastProvider';
import type { PatientMonitoringLog, PatientStatus } from '../types/icuMonitoring';
import { monitoringStore } from '../utils/icuMonitoringStore';

type Patient = {
  id: string;
  full_name: string;
  bed_number?: string;
  ward?: string;
};

type FormState = {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number;
  sugarLevel: number;
  oxygen: number;
  status: PatientStatus;
  clinicalObservedAt: string;
  doctorName: string;
  doctorDesignation: string;
  doctorNotes: string;
  nurseName: string;
  medicineName: string;
  medicineDose: string;
  medicineRoute: string;
  administeredAt: string;
  careStep: string;
  careStepTime: string;
  reportTitle: string;
  reportSummary: string;
  reportFileName: string;
};

const nowInputValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const initialForm: FormState = {
  heartRate: 84,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  temperature: 98.6,
  sugarLevel: 110,
  oxygen: 97,
  status: 'stable',
  clinicalObservedAt: nowInputValue(),
  doctorName: '',
  doctorDesignation: '',
  doctorNotes: '',
  nurseName: '',
  medicineName: '',
  medicineDose: '',
  medicineRoute: 'tablet',
  administeredAt: nowInputValue(),
  careStep: '',
  careStepTime: nowInputValue(),
  reportTitle: '',
  reportSummary: '',
  reportFileName: '',
};

export default function NurseMonitoringDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [, setRefreshKey] = useState(0);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const signedInNurseName = useMemo(() => getUserName() || 'Nurse', []);
  const [form, setForm] = useState<FormState>({ ...initialForm, nurseName: signedInNurseName });
  const { pushToast } = useToast();

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientList = (await api.patients.list()) as Patient[];
        setPatients(patientList);
        if (patientList.length > 0) {
          const remembered = localStorage.getItem('visicare_nurse_monitoring_patient');
          const fallback = remembered && patientList.some((item) => item.id === remembered) ? remembered : patientList[0].id;
          setSelectedPatientId(fallback);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load patients';
        pushToast({ type: 'error', title: 'Load failed', message });
      }
    };
    void loadPatients();
  }, [pushToast]);

  useEffect(() => {
    if (!selectedPatientId) return;
    localStorage.setItem('visicare_nurse_monitoring_patient', selectedPatientId);
  }, [selectedPatientId]);

  const logs: PatientMonitoringLog[] = selectedPatientId ? monitoringStore.listByPatient(selectedPatientId) : [];

  const selectedPatient = useMemo(
    () => patients.find((item) => item.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  const resetForm = () => {
    setForm({
      ...initialForm,
      doctorName: selectedPatient ? `Dr. ${selectedPatient.full_name.split(' ')[0]}` : '',
      nurseName: signedInNurseName,
    });
    setEditingLogId(null);
  };

  const fillForEdit = (log: PatientMonitoringLog) => {
    const latestMedicine = log.medicines[0];
    const latestStep = log.careSteps[0];
    const latestReport = log.reports[0];

    setForm({
      heartRate: log.vitals.heartRate,
      bloodPressureSystolic: log.vitals.bloodPressureSystolic,
      bloodPressureDiastolic: log.vitals.bloodPressureDiastolic,
      temperature: log.vitals.temperature,
      sugarLevel: log.vitals.sugarLevel,
      oxygen: log.vitals.oxygen ?? 97,
      status: log.status,
      clinicalObservedAt: log.createdAt.slice(0, 16),
      doctorName: log.doctor.name,
      doctorDesignation: log.doctor.designation,
      doctorNotes: log.doctorNotes,
      nurseName: log.nurseName || signedInNurseName,
      medicineName: latestMedicine?.name ?? '',
      medicineDose: latestMedicine?.dose ?? '',
      medicineRoute: latestMedicine?.route ?? 'tablet',
      administeredAt: latestMedicine ? latestMedicine.administeredAt.slice(0, 16) : nowInputValue(),
      careStep: latestStep?.description ?? '',
      careStepTime: latestStep ? latestStep.recordedAt.slice(0, 16) : nowInputValue(),
      reportTitle: latestReport?.title ?? '',
      reportSummary: latestReport?.summary ?? '',
      reportFileName: latestReport?.fileName ?? '',
    });
    setEditingLogId(log.id);
  };

  const saveLog = () => {
    if (!selectedPatient) {
      pushToast({ type: 'error', title: 'Patient required', message: 'Select a patient first.' });
      return;
    }
    if (!form.clinicalObservedAt) {
      pushToast({ type: 'error', title: 'Missing date/time', message: 'Clinical observation date and time are required.' });
      return;
    }
    if (!form.doctorName.trim() || !form.doctorNotes.trim()) {
      pushToast({ type: 'error', title: 'Missing doctor details', message: 'Doctor name and notes are required in clinical inputs.' });
      return;
    }
    if (!form.nurseName.trim()) {
      pushToast({ type: 'error', title: 'Missing nurse details', message: 'Nurse name is required for medicines, steps, and reports.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const logId = editingLogId ?? monitoringStore.newId();

    const nextLog: PatientMonitoringLog = {
      id: logId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.full_name,
      nurseName: form.nurseName.trim(),
      createdAt: new Date(form.clinicalObservedAt).toISOString(),
      updatedAt: nowIso,
      status: form.status,
      vitals: {
        heartRate: Number(form.heartRate),
        bloodPressureSystolic: Number(form.bloodPressureSystolic),
        bloodPressureDiastolic: Number(form.bloodPressureDiastolic),
        temperature: Number(form.temperature),
        sugarLevel: Number(form.sugarLevel),
        oxygen: Number(form.oxygen),
      },
      doctor: {
        name: form.doctorName.trim(),
        designation: form.doctorDesignation.trim() || 'ICU Duty Doctor',
      },
      doctorNotes: form.doctorNotes.trim(),
      medicines: form.medicineName.trim()
        ? [{
            id: monitoringStore.newId(),
            name: form.medicineName.trim(),
            dose: form.medicineDose.trim() || 'As prescribed',
            route: form.medicineRoute.trim() || 'tablet',
            administeredAt: new Date(form.administeredAt).toISOString(),
          }]
        : [],
      careSteps: form.careStep.trim()
        ? [{
            id: monitoringStore.newId(),
            description: form.careStep.trim(),
            recordedAt: new Date(form.careStepTime).toISOString(),
          }]
        : [],
      reports: form.reportTitle.trim()
        ? [{
            id: monitoringStore.newId(),
            title: form.reportTitle.trim(),
            summary: form.reportSummary.trim() || 'Clinical report update',
            fileName: form.reportFileName.trim() || undefined,
            createdAt: nowIso,
          }]
        : [],
    };

    monitoringStore.upsert(nextLog);
    setRefreshKey((prev) => prev + 1);
    pushToast({
      type: 'success',
      title: editingLogId ? 'Log updated' : 'Log added',
      message: 'Patient monitoring data saved successfully.',
    });
    resetForm();
  };

  const deleteLog = (logId: string) => {
    monitoringStore.remove(logId);
    setRefreshKey((prev) => prev + 1);
    if (editingLogId === logId) resetForm();
    pushToast({ type: 'success', title: 'Log deleted', message: 'Monitoring entry removed.' });
  };

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="glass-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                <Stethoscope size={22} /> Nurse Monitoring Dashboard
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Add complete patient vitals, medicines, doctor notes, and every micro step with date-time.
              </p>
            </div>
            <div className="min-w-[260px]">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name} {patient.bed_number ? `• Bed ${patient.bed_number}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Patient Vitals + Clinical Inputs</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Heart Rate
                <input type="number" value={form.heartRate} onChange={(e) => setForm((prev) => ({ ...prev, heartRate: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Blood Pressure (Systolic)
                <input type="number" value={form.bloodPressureSystolic} onChange={(e) => setForm((prev) => ({ ...prev, bloodPressureSystolic: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Blood Pressure (Diastolic)
                <input type="number" value={form.bloodPressureDiastolic} onChange={(e) => setForm((prev) => ({ ...prev, bloodPressureDiastolic: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Temperature (F)
                <input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((prev) => ({ ...prev, temperature: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sugar Level
                <input type="number" value={form.sugarLevel} onChange={(e) => setForm((prev) => ({ ...prev, sugarLevel: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Oxygen (optional)
                <input type="number" value={form.oxygen} onChange={(e) => setForm((prev) => ({ ...prev, oxygen: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
                Patient Status
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as PatientStatus }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="stable">Stable</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
                Clinical Observation Date & Time
                <input type="datetime-local" value={form.clinicalObservedAt} onChange={(e) => setForm((prev) => ({ ...prev, clinicalObservedAt: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" required />
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Doctor Name
                <input type="text" value={form.doctorName} onChange={(e) => setForm((prev) => ({ ...prev, doctorName: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Dr. Ananya Patel" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Doctor Designation
                <input type="text" value={form.doctorDesignation} onChange={(e) => setForm((prev) => ({ ...prev, doctorDesignation: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Consultant Intensivist" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
                Doctor Notes
                <textarea value={form.doctorNotes} onChange={(e) => setForm((prev) => ({ ...prev, doctorNotes: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Patient responded well after oxygen adjustment..." />
              </label>
            </div>

            <button
              type="button"
              onClick={saveLog}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
            >
              {editingLogId ? <Save size={16} /> : <PlusCircle size={16} />} {editingLogId ? 'Update Clinical Inputs' : 'Add Clinical Inputs'}
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-3xl p-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Medicines, Steps, Reports</h3>
            <div className="mt-4 space-y-3">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nurse Name (from login)
                <input type="text" value={form.nurseName} readOnly className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" required />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Medicine Given
                <input type="text" value={form.medicineName} onChange={(e) => setForm((prev) => ({ ...prev, medicineName: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Paracetamol / Cetirizine / Insulin" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dose
                  <input type="text" value={form.medicineDose} onChange={(e) => setForm((prev) => ({ ...prev, medicineDose: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="500 mg" />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Route
                  <input type="text" value={form.medicineRoute} onChange={(e) => setForm((prev) => ({ ...prev, medicineRoute: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="tablet / injected" />
                </label>
              </div>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Medicine Time
                <input type="datetime-local" value={form.administeredAt} onChange={(e) => setForm((prev) => ({ ...prev, administeredAt: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Care Step (small updates)
                <textarea value={form.careStep} onChange={(e) => setForm((prev) => ({ ...prev, careStep: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Changed glucose dosage and injected insulin at 10:05" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step Time
                <input type="datetime-local" value={form.careStepTime} onChange={(e) => setForm((prev) => ({ ...prev, careStepTime: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>

              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Report Title
                <input type="text" value={form.reportTitle} onChange={(e) => setForm((prev) => ({ ...prev, reportTitle: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Morning ICU Summary" />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Report Summary
                <textarea value={form.reportSummary} onChange={(e) => setForm((prev) => ({ ...prev, reportSummary: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Hemodynamics stable. Continue observation." />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Report File Name
                <input type="text" value={form.reportFileName} onChange={(e) => setForm((prev) => ({ ...prev, reportFileName: e.target.value }))} placeholder="example_daily_summary_2026-03-24.pdf" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
              </label>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={saveLog} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
                {editingLogId ? <Save size={16} /> : <PlusCircle size={16} />} {editingLogId ? 'Update' : 'Add'}
              </button>
              <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Activity size={16} /> Reset
              </button>
              {editingLogId ? (
                <button type="button" onClick={() => deleteLog(editingLogId)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">
                  <Trash2 size={16} /> Delete
                </button>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Select row to edit
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <section className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Patient Monitoring Logs</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700">
                  <th className="px-3 py-2">Date & Time</th>
                  <th className="px-3 py-2">Vitals</th>
                  <th className="px-3 py-2">Medicine</th>
                  <th className="px-3 py-2">Doctor Notes</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>No logs yet for this patient.</td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-200/70 dark:border-slate-800">
                    <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-200">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-200">
                      <p>HR {log.vitals.heartRate} bpm</p>
                      <p>BP {log.vitals.bloodPressureSystolic}/{log.vitals.bloodPressureDiastolic}</p>
                      <p>Temp {log.vitals.temperature} F</p>
                      <p>Sugar {log.vitals.sugarLevel} mg/dL</p>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-200">
                      {log.medicines.length > 0 ? (
                        <p className="inline-flex items-center gap-2"><Pill size={14} />{log.medicines[0].name} ({log.medicines[0].dose})</p>
                      ) : (
                        <span className="text-slate-500">No medicine</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-200">
                      <p className="font-semibold">{log.doctor.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nurse: {log.nurseName || 'N/A'}</p>
                      <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{log.doctorNotes}</p>
                      {log.careSteps[0] && <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">Step: {log.careSteps[0].description}</p>}
                      {log.reports[0] && <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"><FileText size={12} />{log.reports[0].title}</p>}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => fillForEdit(log)} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white">Update</button>
                        <button type="button" onClick={() => deleteLog(log.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
