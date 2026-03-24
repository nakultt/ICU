import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const roles = [
  {
    title: 'Hospital Staff',
    description: 'Approve visits, monitor sessions, and manage ICU operations.',
    icon: Stethoscope,
    path: '/login?role=admin',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'Family Member',
    description: 'Connect to your loved one through secure nurse-supervised visits.',
    icon: UsersRound,
    path: '/login?role=family',
    gradient: 'from-teal-500 to-cyan-600',
  },
];

export default function RoleSelection() {
  return (
    <div className="app-grid-bg relative min-h-screen px-4 py-10 md:px-8">
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="glass-card rounded-[2rem] p-8 md:p-10">
          <h1 className="text-center text-3xl font-black text-slate-900 dark:text-slate-100 md:text-4xl">Choose Your Access Role</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
            Select your role to continue into ICUConnect with the right workflow and permissions.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {roles.map((role, idx) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={role.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="group rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/75"
                >
                  <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-r ${role.gradient} p-3 text-white shadow-lg`}>
                    <Icon size={22} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{role.title}</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{role.description}</p>
                  <Link
                    to={role.path}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition group-hover:bg-cyan-700 dark:bg-slate-100 dark:text-slate-900 dark:group-hover:bg-cyan-300"
                  >
                    Continue
                    <ArrowRight size={15} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
