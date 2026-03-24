import { motion } from 'framer-motion';
import { BellRing, CircleCheckBig, HeartPulse, Video } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { getUserRole } from '../api';

const updates = [
  { id: 1, title: 'Call approved', detail: 'Your 08:30 visit request has been approved.', time: '2 min ago', icon: CircleCheckBig },
  { id: 2, title: 'Patient status updated', detail: 'Condition changed to stable after clinical review.', time: '18 min ago', icon: HeartPulse },
  { id: 3, title: 'Session reminder', detail: 'Video call starts in 25 minutes.', time: '1 hour ago', icon: Video },
];

export default function NotificationsPage() {
  const role = getUserRole();
  const shellRole = role === 'nurse' || role === 'admin' ? 'admin' : 'family';

  return (
    <AppShell role={shellRole}>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
        <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
          <BellRing size={18} /> Real-time Notifications
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Track visit approvals and patient condition updates from the ICU team.</p>

        <div className="mt-6 space-y-3">
          {updates.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/75"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                  </div>
                  <span className="text-xs text-slate-500">{item.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </AppShell>
  );
}
