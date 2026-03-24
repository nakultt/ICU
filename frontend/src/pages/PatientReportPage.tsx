import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { Download, FileText, ShieldPlus, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { api, getUserRole } from '../api';
import type { PatientMonitoringLog } from '../types/icuMonitoring';

type TimelineEntry = {
  id: string;
  createdAt?: string;
  time?: string;
  kind: string;
  title?: string;
  note: string;
  detail?: string;
  authorName?: string;
  authorRole?: string;
  by?: string;
};

type DoctorReport = {
  id: string;
  title: string;
  summary: string;
  createdAt?: string;
  time?: string;
  doctorName?: string;
  attachmentName?: string;
  fileName?: string;
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value?: string) => {
  const date = parseDate(value);
  return date ? date.toLocaleString() : null;
};

type Patient = {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  diagnosis?: string;
  current_status?: string;
  status_note?: string;
  bed_number?: string;
  ward?: string;
  care_timeline?: TimelineEntry[];
  doctor_reports?: DoctorReport[];
};

const writeLine = (doc: jsPDF, text: string, y: number) => {
  if (y > 280) {
    doc.addPage();
    return 18;
  }
  doc.text(text, 14, y);
  return y + 6;
};

const writeSectionHeader = (doc: jsPDF, title: string, y: number) => {
  let nextY = y;
  if (nextY > 270) {
    doc.addPage();
    nextY = 18;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 14, nextY);
  doc.line(14, nextY + 2, 196, nextY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  return nextY + 8;
};

export default function PatientReportPage() {
  const role = getUserRole();
  const shellRole = role === 'nurse' || role === 'admin' ? 'admin' : 'family';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [logs, setLogs] = useState<PatientMonitoringLog[]>([]);

  useEffect(() => {
    const loadPatients = async () => {
      const patientList = (await api.patients.list()) as Patient[];
      setPatients(patientList);

      const linked = localStorage.getItem('visicare_family_patient_id');
      const selected = linked && patientList.some((item) => item.id === linked) ? linked : patientList[0]?.id || '';
      setSelectedPatientId(selected);
    };
    void loadPatients();
  }, []);

  useEffect(() => {
    const loadPatientDetails = async () => {
      if (!selectedPatientId) {
        setSelectedPatient(null);
        setLogs([]);
        return;
      }

      const [patientDetails, monitoringLogs] = await Promise.all([
        api.patients.getById(selectedPatientId) as Promise<Patient>,
        api.patients.getMonitoringLogs(selectedPatientId) as Promise<PatientMonitoringLog[]>,
      ]);

      setSelectedPatient(patientDetails);
      setLogs(monitoringLogs);
    };

    void loadPatientDetails();
  }, [selectedPatientId]);

  const reports = useMemo(
    () => {
      const fromLogs = logs.flatMap((log) => log.reports || []);
      const fromDoctorReports = (selectedPatient?.doctor_reports || []).map((report) => ({
        id: report.id,
        title: report.title || 'Doctor Report',
        summary: report.summary || '--',
        fileName: report.attachmentName || report.fileName,
        createdAt: report.createdAt || report.time || '',
      }));

      const merged = [...fromLogs, ...fromDoctorReports];
      const uniqueById = new Map(merged.map((item) => [item.id, item]));
      return Array.from(uniqueById.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    },
    [logs, selectedPatient],
  );

  const careTimeline = useMemo(
    () =>
      [...(selectedPatient?.care_timeline || [])].sort((a, b) => {
        const left = a.createdAt || a.time || '';
        const right = b.createdAt || b.time || '';
        return right.localeCompare(left);
      }),
    [selectedPatient],
  );

  const doctorLogs = useMemo(
    () => [...logs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [logs],
  );

  const handleDownloadPdf = () => {
    if (!selectedPatient) return;

    const doc = new jsPDF();
    let y = 16;

    doc.setFillColor(14, 116, 144);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('ICUConnect - Comprehensive Patient Clinical Report', 14, 15);

    doc.setTextColor(20, 24, 35);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = 30;

    y = writeSectionHeader(doc, '1. Patient Information', y);
    y = writeLine(doc, `Patient Name: ${selectedPatient.full_name}`, y);
    y = writeLine(doc, `Age / Gender: ${selectedPatient.age ?? '--'} / ${selectedPatient.gender ?? '--'}`, y);
    y = writeLine(doc, `Bed / Ward: ${selectedPatient.bed_number || '--'} / ${selectedPatient.ward || '--'}`, y);
    y = writeLine(doc, `Diagnosis: ${selectedPatient.diagnosis || '--'}`, y);
    y = writeLine(doc, `Current Status: ${(selectedPatient.current_status || '--').toUpperCase()}`, y);
    y = writeLine(doc, `Latest Status Note: ${selectedPatient.status_note || '--'}`, y);
    y = writeLine(doc, `Report Generated: ${new Date().toLocaleString()}`, y);

    y += 3;
    y = writeSectionHeader(doc, '2. Daily Clinical Logs', y);
    if (logs.length === 0) {
      y = writeLine(doc, 'No monitoring logs available for this patient.', y);
    }

    logs.forEach((log, index) => {
      y = writeLine(doc, `${index + 1}) ${new Date(log.createdAt).toLocaleString()} | Status: ${log.status.toUpperCase()}`, y);
      y = writeLine(doc, `Doctor: ${log.doctor.name} (${log.doctor.designation})`, y);
      y = writeLine(doc, `Nurse: ${log.nurseName || 'N/A'}`, y);
      y = writeLine(doc, `Doctor Clinical Note: ${log.doctorNotes}`, y);
      y = writeLine(
        doc,
        `Vitals -> HR ${log.vitals.heartRate} bpm | BP ${log.vitals.bloodPressureSystolic}/${log.vitals.bloodPressureDiastolic} mmHg | Temp ${log.vitals.temperature}F | Sugar ${log.vitals.sugarLevel} mg/dL | O2 ${log.vitals.oxygen ?? '--'}%`,
        y,
      );

      if (log.medicines.length > 0) {
        y = writeLine(doc, 'Medicines Administered:', y);
        log.medicines.forEach((medicine) => {
          y = writeLine(
            doc,
            `- ${medicine.name} ${medicine.dose} via ${medicine.route} at ${new Date(medicine.administeredAt).toLocaleString()}`,
            y,
          );
        });
      }

      if (log.careSteps.length > 0) {
        y = writeLine(doc, 'Nursing Care Steps:', y);
        log.careSteps.forEach((step) => {
          y = writeLine(doc, `- ${step.description} (${new Date(step.recordedAt).toLocaleString()})`, y);
        });
      }

      if (log.reports.length > 0) {
        y = writeLine(doc, 'Attached/Recorded Reports:', y);
        log.reports.forEach((report) => {
          y = writeLine(doc, `- ${report.title} | ${report.summary}`, y);
          if (report.fileName) {
            y = writeLine(doc, `  File Name: ${report.fileName}`, y);
          }
        });
      }

      y += 3;
    });

    y = writeSectionHeader(doc, '3. Report Sign-Off', y);
    y = writeLine(doc, 'Prepared by ICUConnect digital reporting module.', y);
    y = writeLine(doc, 'This document includes doctor entries, nurse logs, medicine records, care-step history, and vitals timeline.', y);
    y = writeLine(doc, 'For official hospital records, verify with treating physician and ICU nursing desk.', y);

    doc.save(`${selectedPatient.full_name.replace(/\s+/g, '_')}_ICU_Clinical_Report.pdf`);
  };

  return (
    <AppShell role={shellRole}>
      <div className="space-y-6">
        <section className="glass-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Family Report Center</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">Patient Report Timeline</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Complete doctor entries, medicine updates, and vitals history with date and time.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.full_name}</option>
                ))}
              </select>
              <button type="button" onClick={handleDownloadPdf} className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-sm font-bold text-white">
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
            <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100"><Stethoscope size={18} /> Doctor Notes Timeline</h3>
            <div className="mt-4 space-y-5">
              {doctorLogs.length === 0 && careTimeline.length === 0 && <p className="text-sm text-slate-500">No logs available for selected patient.</p>}

              {careTimeline.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Patient Vitals + Clinical Inputs</p>
                  {careTimeline.map((entry) => (
                    <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{entry.kind || entry.title || 'Clinical Timeline'}</p>
                        {formatDateTime(entry.createdAt || entry.time) && (
                          <span className="text-xs font-semibold text-slate-500">{formatDateTime(entry.createdAt || entry.time)}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{entry.note || entry.detail || '--'}</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        <p><span className="font-bold text-slate-700 dark:text-slate-300">Recorded By:</span> {entry.authorName || entry.by || 'Staff'}</p>
                        {(entry.authorRole || entry.by) && <p><span className="font-bold text-slate-700 dark:text-slate-300">Role:</span> {entry.authorRole || 'Nurse'}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {doctorLogs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Doctor Notes</p>
                  {doctorLogs.map((log) => (
                    <article key={log.id} className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{log.doctor.name} • {log.doctor.designation}</p>
                        {formatDateTime(log.createdAt) && <span className="text-xs font-semibold text-slate-500">{formatDateTime(log.createdAt)}</span>}
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{log.doctorNotes}</p>
                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <p className="rounded-xl border border-cyan-300/40 bg-cyan-100/40 px-3 py-2 font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200">
                          Vitals: HR {log.vitals.heartRate} • BP {log.vitals.bloodPressureSystolic}/{log.vitals.bloodPressureDiastolic} • Temp {log.vitals.temperature}F • Sugar {log.vitals.sugarLevel}
                        </p>
                        <p className={`rounded-xl border px-3 py-2 font-black uppercase tracking-wide ${log.status === 'critical' ? 'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-200' : 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'}`}>
                          Status: {log.status}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass-card rounded-3xl p-6">
              <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100"><FileText size={18} /> Reports Timeline</h3>
              <div className="mt-4 space-y-3">
                {reports.length === 0 && <p className="text-sm text-slate-500">No reports uploaded yet.</p>}
                {reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{report.title}</p>
                      {formatDateTime(report.createdAt) && <p className="text-xs font-semibold text-slate-500">{formatDateTime(report.createdAt)}</p>}
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{report.summary}</p>
                    {report.fileName && <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">File: {report.fileName}</p>}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-6">
              <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100"><ShieldPlus size={18} /> Family Visibility</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Every nursing step, medicine administration event, glucose changes, and doctor report entry appears here with precise timestamps.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
