import { motion } from 'framer-motion';
import { Bell, CalendarDays, MessageSquareText, PhoneCall, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';

type Patient = {
  id: string;
  name: string;
  status: 'stable' | 'critical';
  bed: string;
  condition: string;
  updatedAt: string;
};

type Visit = {
  id: string;
  date: string;
  status: 'approved' | 'pending' | 'completed';
};

const patient: Patient = {
  id: 'p-001',
  name: 'Aarav Sharma',
  status: 'stable',
  bed: 'ICU-A12',
  condition: 'Post-operative observation',
  updatedAt: '3 min ago',
};

const visits: Visit[] = [
  { id: 'v-101', date: '2026-03-25 08:30', status: 'approved' },
  { id: 'v-102', date: '2026-03-24 19:30', status: 'completed' },
  { id: 'v-103', date: '2026-03-24 11:00', status: 'completed' },
  { id: 'v-104', date: '2026-03-26 16:00', status: 'pending' },
];

const alerts = [
  'Call approved for tomorrow at 08:30',
  'Nurse added a progress note',
  'Vitals stable over the last 6 hours',
];

export default function FamilyDashboard() {
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const completed = visits.filter((item) => item.status === 'completed').length;
    const upcoming = visits.filter((item) => item.status === 'approved').length;
    return { completed, upcoming, total: visits.length };
  }, []);

  return (
    <AppShell role="family">
      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-60 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
            <div className="flex flex-col justify-between gap-6 lg:flex-row">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Linked Patient</p>
                <h2 className="mt-1 text-3xl font-black text-slate-900 dark:text-slate-100">{patient.name}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusBadge status={patient.status} label={patient.status === 'stable' ? 'Stable' : 'Critical'} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Bed {patient.bed}</span>
                  <span className="text-xs font-medium text-slate-500">Updated {patient.updatedAt}</span>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Condition: {patient.condition}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Link
                  to="/call/live-session"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-300/35 transition hover:scale-[1.02]"
                  onClick={() => pushToast({ type: 'info', title: 'Starting secure session', message: 'Connecting to ICU room.' })}
                >
                  <Video size={17} /> Start Call
                </Link>
                <Link
                  to="/schedule"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <CalendarDays size={17} /> Schedule Visit
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => pushToast({ type: 'success', title: 'Message sent', message: 'Nursing desk has received your note.' })}
                >
                  <MessageSquareText size={17} /> Send Message
                </button>
              </div>
            </div>
          </motion.section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Visits Done', value: stats.completed },
              { label: 'Upcoming Calls', value: stats.upcoming },
              { label: 'Total Sessions', value: stats.total },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card rounded-3xl p-5"
              >
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-slate-100">{stat.value}</p>
              </motion.div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Call History</h3>
              <div className="mt-4 space-y-3">
                {visits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
                        <PhoneCall size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Session {visit.id}</p>
                        <p className="text-xs text-slate-500">{visit.date}</p>
                      </div>
                    </div>
                    <StatusBadge status={visit.status} />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-6">
              <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
                <Bell size={18} /> Notifications
              </h3>
              <div className="mt-4 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert} className="rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                    {alert}
                  </div>
                ))}
              </div>
              <Link to="/notifications" className="mt-4 inline-block text-sm font-bold text-cyan-700 dark:text-cyan-300">
                View all updates
              </Link>
            </motion.div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
