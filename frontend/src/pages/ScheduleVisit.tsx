import { motion } from 'framer-motion';
import { CalendarDays, Clock3 } from 'lucide-react';
import { useState } from 'react';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';

const slots = ['08:00', '08:30', '09:00', '14:00', '14:30', '19:00'];

export default function ScheduleVisit() {
  const [date, setDate] = useState('2026-03-25');
  const [slot, setSlot] = useState('08:30');
  const [requestStatus, setRequestStatus] = useState<'pending' | 'approved'>('pending');
  const { pushToast } = useToast();

  return (
    <AppShell role="family">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <CalendarDays size={18} /> Schedule a Visit
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Pick a date and an available slot. Nurse team will approve the request.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Slot</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {slots.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSlot(item)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                      slot === item
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRequestStatus('pending');
                pushToast({ type: 'info', title: 'Visit requested', message: `Request submitted for ${date} at ${slot}.` });
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
            >
              Request Approval
            </button>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <Clock3 size={18} /> Request Status
          </h2>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-sm text-slate-500">Requested slot</p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">{date} · {slot}</p>
            <div className="mt-3">
              <StatusBadge status={requestStatus} label="Awaiting nurse approval" />
            </div>
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
