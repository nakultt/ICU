import { Bell, CalendarDays, ChevronDown, LayoutDashboard, LogOut, Shield, Stethoscope, UserRound, Video, MessageSquareText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import ThemeToggle from '../ui/ThemeToggle';

type AppShellProps = {
  children: ReactNode;
  role: 'family' | 'admin';
};

const familyLinks = [
  { to: '/family', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/patient/p-001', label: 'Patient Details', icon: UserRound },
  { to: '/call/live-session', label: 'Video Call', icon: Video },
  { to: '/messages', label: 'Messages', icon: MessageSquareText },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/patient/p-001', label: 'Patient Details', icon: UserRound },
  { to: '/call/live-session', label: 'Video Call', icon: Video },
  { to: '/messages', label: 'Messages', icon: MessageSquareText },
];

export default function AppShell({ children, role }: AppShellProps) {
  const links = role === 'family' ? familyLinks : adminLinks;
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="app-grid-bg relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="glass-card m-4 rounded-3xl p-5 lg:sticky lg:top-4 lg:m-4 lg:h-[calc(100vh-2rem)] lg:w-72 lg:p-6">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="heartbeat rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 p-2.5 text-white shadow-md">
              {role === 'family' ? <Shield size={18} /> : <Stethoscope size={18} />}
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100">ICUConnect</p>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">VisiCare Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</p>
            <ThemeToggle />
          </div>
        </aside>

        <div className="flex-1 px-4 pb-4 lg:pl-0">
          <header className="glass-card sticky top-4 z-30 mt-4 flex items-center justify-between rounded-3xl px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {role === 'family' ? 'Family Access' : 'Hospital Command Center'}
              </p>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Welcome to ICUConnect</h1>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <UserRound size={16} />
                Profile
                <ChevronDown size={14} />
              </button>
              {openMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                    <UserRound size={14} /> My Account
                  </button>
                  <button 
                    onClick={() => {
                       localStorage.removeItem('token');
                       localStorage.removeItem('role');
                       window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </motion.div>
              )}
            </div>
          </header>

          <main className="pb-4 pt-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
