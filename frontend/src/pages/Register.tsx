import { motion } from 'framer-motion';
import { CircleAlert, CircleCheckBig, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, setUserRole } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('family');
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submitRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');
    try {
      await api.auth.register({ email, password, full_name: fullName, role });
      
      // Auto-login after successful registration
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const data = await api.auth.login(params);
      
      setToken(data.access_token);
      setUserRole(data.role);
      setState('success');
      
      setTimeout(() => {
        navigate(data.role === 'admin' || data.role === 'nurse' ? '/admin' : '/family');
      }, 1000);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Registration failed');
      }
      setState('error');
    }
  };

  return (
    <div className="app-grid-bg relative min-h-screen px-4 py-10 md:px-8 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/20 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500" />
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-4 text-cyan-700 ring-1 ring-cyan-200/70 shadow-[0_0_30px_rgba(8,145,178,0.15)] dark:text-cyan-300 dark:ring-cyan-900/40">
              <UserPlus size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Create Account</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Join VisiCare to stay connected
            </p>
          </div>

          <form onSubmit={submitRegister} className="space-y-4">
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
            />
            
            <div className="flex gap-4 pt-2">
              <label className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border ${role === 'family' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 bg-slate-900/40 text-slate-400'} px-4 py-3 text-sm font-bold transition-all`}>
                <input type="radio" className="hidden" checked={role === 'family'} onChange={() => setRole('family')} />
                Family
              </label>
              <label className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border ${role === 'nurse' ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'border-slate-300 bg-slate-100/60 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400'} px-4 py-3 text-sm font-bold transition-all`}>
                <input type="radio" className="hidden" checked={role === 'nurse'} onChange={() => setRole('nurse')} />
                Staff / Nurse
              </label>
            </div>

            <button
              type="submit"
              disabled={state === 'loading' || state === 'success'}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-cyan-900/30 transition-all hover:scale-[1.02] hover:shadow-cyan-900/50 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
            >
              {state === 'loading' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Register Account'}
            </button>
          </form>

          {state === 'error' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 inline-flex w-full items-center gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 border border-rose-500/20">
              <CircleAlert size={18} className="shrink-0" /> {errorMsg}
            </motion.div>
          )}
          
          {state === 'success' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-600 border border-teal-500/20 dark:text-teal-400">
              <CircleCheckBig size={18} className="shrink-0" /> Registration successful! Redirecting...
            </motion.div>
          )}

          <div className="mt-8 text-center border-t border-slate-200 pt-6 dark:border-slate-700/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
