import { motion } from 'framer-motion';
import { FileText, NotebookTabs, Stethoscope } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';

const timeline = [
  { time: '08:10', event: 'Vitals reviewed by nurse', detail: 'Heart rate and oxygen levels within expected range.' },
  { time: '10:30', event: 'Clinical note added', detail: 'Patient responsive to medication adjustment.' },
  { time: '13:05', event: 'Family call completed', detail: 'Positive emotional response recorded after 12-minute session.' },
];

export default function PatientDetails() {
  return (
    <AppShell role="family">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Aarav Sharma</h2>
            <StatusBadge status="stable" />
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Bed A-12 · ICU Critical Care Unit</p>

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

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <Stethoscope size={18} /> Care Timeline
          </h2>
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
