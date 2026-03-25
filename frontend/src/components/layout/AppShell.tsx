import { Activity, Bell, CalendarDays, FileText, LayoutDashboard, LogOut, Shield, Stethoscope, UserRound, Video, MessageSquareText, Sparkles, Bot } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { getUserName, getUserRole } from '../../api';

type AppShellProps = {
  children: ReactNode;
  role: 'family' | 'admin';
};

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/monitoring', label: 'ICU Monitor', icon: Activity },
  { to: '/admin/patients', label: 'Manage Patients', icon: UserRound },
  { to: '/admin/report', label: 'Patient Reports', icon: FileText },
  { to: '/notifications', label: 'Nurse Alerts', icon: Bell },
  { to: '/call/live-session', label: 'Video Call', icon: Video },
];

export default function AppShell({ children, role }: AppShellProps) {
  const location = useLocation();
  const selectedFamilyPatientId = localStorage.getItem('visicare_family_patient_id');
  const baseFamilyLinks = [
    { to: '/family', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/notifications', label: 'My Notifications', icon: Bell },
  ];
  
  const extendedFamilyLinks = [
    { to: '/schedule', label: 'Schedule Visit', icon: CalendarDays },
    {
      to: `/patient/${selectedFamilyPatientId}`,
      label: 'Patient Report',
      icon: UserRound,
    },
    { to: '/family/live-monitor', label: 'Live Monitor', icon: Activity },
    { to: '/family/report', label: 'Reports (PDF)', icon: FileText },
    { to: `/family/dashboard/ai-summary/${selectedFamilyPatientId}`, label: 'AI Summary', icon: Sparkles },
    { to: `/family/dashboard/ai-chat/${selectedFamilyPatientId}`, label: 'Ask AI', icon: Bot },
    { to: `/call/${selectedFamilyPatientId}`, label: 'Video Call', icon: Video },
    { to: '/messages', label: 'Family Messages', icon: MessageSquareText },
  ];

  const familyLinks = selectedFamilyPatientId 
    ? [...baseFamilyLinks, ...extendedFamilyLinks] 
    : baseFamilyLinks;

  const links = role === 'family' ? familyLinks : adminLinks;
  const signedRole = (getUserRole() || role).toUpperCase();
  const signedName = getUserName() || (role === 'family' ? 'Family User' : 'Nurse User');
  const isDashboardPage = location.pathname === '/admin' || location.pathname === '/family';

  const handleLogout = () => {
    localStorage.removeItem('visicare_token');
    localStorage.removeItem('visicare_user_role');
    localStorage.removeItem('visicare_user_name');
    localStorage.removeItem('visicare_family_patient_id');
    window.location.href = '/login';
  };

  return (
    <div className="app-grid-bg relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="glass-card m-4 flex flex-col rounded-3xl p-5 lg:sticky lg:top-4 lg:m-4 lg:h-[calc(100vh-2rem)] lg:w-72 lg:p-6">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="heartbeat brand-gradient rounded-2xl p-2.5 shadow-md">
              {role === 'family' ? <Shield size={18} /> : <Stethoscope size={18} />}
            </div>
            <div>
              <p className="brand-heading text-lg font-black dark:text-slate-100">ICUConnect</p>
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
                    `nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'nav-link-active dark:bg-cyan-900/40 dark:text-cyan-200'
                        : 'dark:text-slate-300 dark:hover:bg-slate-800/70'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</p>
              <ThemeToggle />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/75">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Profile</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <UserRound size={14} />
                <span>{signedName}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">{signedRole}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 px-4 pb-6 lg:pl-0">
          {isDashboardPage && (
            <header className="glass-card sticky top-4 z-30 mt-4 mx-auto flex w-full max-w-[1180px] items-center justify-between rounded-3xl px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {role === 'family' ? 'Family Access' : 'Hospital Command Center'}
                </p>
                <h1 className="brand-heading text-xl font-black dark:text-slate-100">Welcome to ICUConnect</h1>
                <p className="mt-1 inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-bold tracking-wider text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200">
                  Signed in as {signedRole}
                </p>
              </div>
            </header>
          )}

          <main className={`mx-auto w-full max-w-[1180px] pb-6 ${isDashboardPage ? 'pt-6' : 'pt-2'}`}>{children}</main>
        </div>
      </div>
    </div>
  );
}
