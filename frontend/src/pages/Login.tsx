import { motion } from 'framer-motion';
import { CircleAlert, CircleCheckBig, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken, setUserRole } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expectedRole = searchParams.get('role');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setState('loading');
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      const data = await api.auth.login(params);
      
      setToken(data.access_token);
      setUserRole(data.role);

      if (expectedRole && data.role !== expectedRole) {
        localStorage.removeItem('visicare_token');
        localStorage.removeItem('visicare_user_role');
        setState('error');
        setErrorMsg(`This account is not a ${expectedRole} account.`);
        return;
      }

      setState('success');
      
      setTimeout(() => {
        navigate(data.role === 'admin' || data.role === 'nurse' ? '/admin' : '/family');
      }, 500);
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Invalid credentials');
      }
      setState('error');
    }
  };

  return (
    <div className="app-grid-bg relative min-h-screen px-4 py-10 md:px-8 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/20 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500" />
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 inline-flex rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-4 text-cyan-700 ring-1 ring-cyan-200/70 shadow-[0_0_30px_rgba(8,145,178,0.15)] dark:text-cyan-300 dark:ring-cyan-900/40">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Welcome Back</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in to securely access VisiCare
            </p>
          </div>

          <form onSubmit={submitLogin} className="space-y-4">
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

            <button
              type="submit"
              disabled={state === 'loading' || state === 'success'}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-cyan-900/30 transition-all hover:scale-[1.02] hover:shadow-cyan-900/50 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
            >
              {state === 'loading' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          {state === 'error' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 inline-flex w-full items-center gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 border border-rose-500/20">
              <CircleAlert size={18} className="shrink-0" /> {errorMsg}
            </motion.div>
          )}
          
          {state === 'success' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 border border-emerald-500/20">
              <CircleCheckBig size={18} className="shrink-0" /> Authentication successful!
            </motion.div>
          )}

          <div className="mt-8 text-center border-t border-slate-200 pt-6 flex flex-col gap-2 dark:border-slate-700/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-cyan-700 hover:text-cyan-600 transition-colors dark:text-cyan-400 dark:hover:text-cyan-300">
                Register here
              </Link>
            </p>
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors pt-2">
              Back to landing
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
