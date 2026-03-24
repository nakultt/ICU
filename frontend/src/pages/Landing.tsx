import { motion } from 'framer-motion';
import { Activity, ArrowRight, LockKeyhole, MonitorPlay, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Secure Communication',
    text: 'Hospital-grade encrypted video channels for ICU family sessions.',
    icon: LockKeyhole,
    tone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200',
  },
  {
    title: 'Fast Response Workflow',
    text: 'Instant escalation and real-time approvals with live nurse oversight.',
    icon: Zap,
    tone: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200',
  },
  {
    title: 'Fully Controlled Access',
    text: 'Staff-managed permissions for every room, schedule, and remote connection.',
    icon: ShieldCheck,
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  },
];

export default function Landing() {
  return (
    <div className="app-grid-bg relative min-h-screen overflow-hidden px-4 py-6 md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="soft-float absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="soft-float absolute right-4 top-10 h-64 w-64 rounded-full bg-teal-300/25 blur-3xl" style={{ animationDelay: '1.2s' }} />
        <div className="soft-float absolute bottom-12 left-1/3 h-60 w-60 rounded-full bg-amber-200/25 blur-3xl" style={{ animationDelay: '2.3s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="glass-card scan-glow rounded-[2rem] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200"
              >
                <Activity size={14} className="heartbeat" />
                ICUConnect (VisiCare)
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-black leading-tight text-slate-900 dark:text-slate-100 md:text-6xl"
              >
                Virtual ICU Visit & Monitoring System
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300"
              >
                Premium healthcare SaaS interface for secure family connectivity, nurse-supervised video visits,
                and centralized ICU communication control.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-300/45 transition hover:scale-[1.03]"
                >
                  Login
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/roles"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Start Visit
                  <MonitorPlay size={16} />
                </Link>
              </motion.div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + idx * 0.1 }}
                        className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70"
                    >
                        <div className={`mb-2 inline-flex rounded-xl p-2 ${feature.tone}`}>
                        <Icon size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{feature.text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="relative mx-auto w-full max-w-[500px]"
            >
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-cyan-300/40 blur-3xl" />
              <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-teal-300/35 blur-3xl" />
              <div className="absolute bottom-16 right-8 h-36 w-36 rounded-full bg-amber-200/30 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-cyan-100/90 via-white to-sky-100 p-6 shadow-2xl dark:border-slate-700 dark:from-cyan-900/40 dark:via-slate-900 dark:to-slate-800">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-100">Live ICU Session Queue</p>
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/50 dark:text-teal-200">
                    Active
                  </span>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <motion.div
                      key={item}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2 + item, repeat: Infinity, ease: 'easeInOut' }}
                      className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Bed A-10{item}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Family call request in progress</p>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
