import { motion } from 'framer-motion';
import { CircleAlert, CircleCheckBig, ShieldCheck } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [state, setState] = useState<'idle' | 'error' | 'success'>('idle');

  const role = useMemo(() => {
    const queryRole = new URLSearchParams(location.search).get('role');
    return queryRole === 'admin' ? 'admin' : 'family';
  }, [location.search]);

  const submitLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phone.length < 8) {
      setState('error');
      return;
    }
    setState('success');
    setStep('otp');
  };

  const submitOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otp !== '123456') {
      setState('error');
      return;
    }
    setState('success');
    navigate(role === 'admin' ? '/admin' : '/family');
  };

  return (
    <div className="app-grid-bg relative min-h-screen px-4 py-10 md:px-8">
      <div className="relative z-10 mx-auto max-w-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2rem] p-8 md:p-10">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Secure Login</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {step === 'login'
                ? `Authenticate as ${role === 'admin' ? 'Hospital Staff' : 'Family Member'}`
                : 'Enter one-time verification code'}
            </p>
          </div>

          {step === 'login' ? (
            <form onSubmit={submitLogin} className="space-y-4">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-300/30 transition hover:scale-[1.01]"
              >
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="123456"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.35em] text-slate-900 outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-300/30 transition hover:scale-[1.01]"
              >
                Verify & Continue
              </button>
            </form>
          )}

          {state === 'error' && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-900/50 dark:text-rose-200">
              <CircleAlert size={16} /> Invalid details. Use OTP 123456 for demo.
            </div>
          )}
          {state === 'success' && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-200">
              <CircleCheckBig size={16} /> Verification step completed.
            </div>
          )}

          <Link to="/" className="mt-6 block text-center text-sm font-semibold text-cyan-700 dark:text-cyan-300">
            Back to landing
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
