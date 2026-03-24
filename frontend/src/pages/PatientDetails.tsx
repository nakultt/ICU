import { motion } from 'framer-motion';
import { FileText, NotebookTabs, Stethoscope } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { getUserRole } from '../api';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';

const doctorReports = [
  {
    checkup: 'Checkup 3',
    date: 'Today, 13:05',
    doctor: 'Dr. Meera Nair',
    specialty: 'Pulmonology',
    summary: 'Breathing pattern improved after oxygen flow adjustment.',
    plan: 'Continue present support and repeat respiratory assessment in 6 hours.',
  },
  {
    checkup: 'Checkup 2',
    date: 'Today, 10:30',
    doctor: 'Dr. Rahul Menon',
    specialty: 'Critical Care',
    summary: 'Vitals within expected range with improved response to medication.',
    plan: 'Maintain current medication dosage and monitor blood oxygen trends.',
  },
  {
    checkup: 'Checkup 1',
    date: 'Today, 08:10',
    doctor: 'Dr. Meera Nair',
    specialty: 'Pulmonology',
    summary: 'Initial morning review showed mild labored breathing, now stable.',
    plan: 'Observe closely and continue ICU monitoring protocol.',
  },
];

const timeline = [
  { time: '13:05', event: 'Family call completed', detail: 'Positive emotional response recorded after 12-minute session.' },
  { time: '10:30', event: 'Clinical note added', detail: 'Patient responsive to medication adjustment.' },
  { time: '08:10', event: 'Vitals reviewed by nurse', detail: 'Heart rate and oxygen levels within expected range.' },
];

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const role = getUserRole();
  const selectedFamilyPatientId = localStorage.getItem('visicare_family_patient_id');

  if (role === 'family' && !selectedFamilyPatientId) {
    return <Navigate to="/family" replace />;
  }

  if (role === 'family' && selectedFamilyPatientId && id && id !== selectedFamilyPatientId) {
    return <Navigate to={`/patient/${selectedFamilyPatientId}`} replace />;
  }

  return (
    <AppShell role="family">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Patient Overview</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">Aarav Sharma</h2>
            </div>
            <StatusBadge status="stable" />
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Bed A-12 · ICU Critical Care Unit</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-xs uppercase tracking-wider text-slate-500">Current Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Stable and under observation</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-xs uppercase tracking-wider text-slate-500">Last Updated</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Today, 13:05</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-xs uppercase tracking-wider text-slate-500">Primary Unit</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Critical Care</p>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-3xl p-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Doctor Reports by Checkup</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Most recent doctor update is shown first for quick understanding.</p>

          <div className="mt-5 space-y-4">
            {doctorReports.map((report) => (
              <div key={report.checkup} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100">{report.checkup}</p>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
                    {report.date}
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {report.doctor} · {report.specialty}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Report:</span> {report.summary}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Plan:</span> {report.plan}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-xs uppercase tracking-wider text-slate-500">Latest Report</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Pulmonary response improving</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-xs uppercase tracking-wider text-slate-500">Nurse Note</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Continue monitored oxygen support.</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <NotebookTabs size={15} /> Notes from Nurse
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Patient remains stable and responsive. Family interaction encouraged daily.</p>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <Stethoscope size={18} /> Care Timeline
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Most recent update appears first.</p>
          <div className="mt-6 space-y-4">
            {timeline.map((item) => (
              <div key={item.time} className="relative rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
                  <FileText size={14} /> {item.time}
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.event}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
