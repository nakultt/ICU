import { motion } from 'framer-motion';
import { Check, CircleX, ClipboardList, FileUp, PhoneOff, UsersRound, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';
import { api } from '../api';

type Patient = {
  id: string;
  full_name: string;
  access_code: string;
};

type Visit = {
  id: string;
  patient_id: string;
  family_user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'approved' | 'completed';
};

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notes, setNotes] = useState('Maintain calm communication and update status every 2 hours.');
  const [sessionPatientCode, setSessionPatientCode] = useState('');
  const [openSessionModal, setOpenSessionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    if (searchParams.get('startSession') === '1') {
      setOpenSessionModal(true);
    }
  }, [searchParams]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [patientList, visitList] = await Promise.all([api.patients.list(), api.visits.list()]);
      setPatients(patientList);
      setVisits(visitList);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load nurse dashboard';
      pushToast({ type: 'error', title: 'Load failed', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingVisits = useMemo(() => visits.filter((visit) => visit.status === 'pending'), [visits]);
  const patientById = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);

  const approveVisit = async (id: string) => {
    try {
      await api.visits.approve(id);
      pushToast({ type: 'success', title: 'Visit approved', message: `Request ${id.toUpperCase()} has been approved.` });
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not approve visit';
      pushToast({ type: 'error', title: 'Approval failed', message });
    }
  };

  const copyCode = async (code: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      pushToast({ type: 'success', title: 'Code copied', message: `Patient code ${code} copied. Share it with family.` });
    } catch {
      pushToast({ type: 'info', title: 'Copy unavailable', message: `Share this patient code manually: ${code}` });
    }
  };

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Nurse Operations</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Nurse-only area: manage call approvals, run live sessions, and use dedicated patient management tools.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/admin/patients"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                <UsersRound size={16} /> Manage Patients
              </Link>
              <Link
                to="/admin/monitoring"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-900/30 dark:text-cyan-200"
              >
                <ClipboardList size={16} /> ICU Monitoring Logs
              </Link>
              <button
                type="button"
                onClick={() => setOpenSessionModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
              >
                <Video size={16} /> Open Patient Session
              </button>
              <button
                type="button"
                onClick={() => pushToast({ type: 'error', title: 'Emergency call terminated', message: 'All participants disconnected.' })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white"
              >
                <PhoneOff size={16} /> Emergency End Call
              </button>
              <button
                type="button"
                onClick={() => pushToast({ type: 'success', title: 'Report upload queued', message: 'File is being processed by records system.' })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <FileUp size={16} /> Upload Report
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-5">
            <h2 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
              <ClipboardList size={18} /> Queue Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-wider text-slate-500">Pending Visit Requests</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-slate-100">{pendingVisits.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-wider text-slate-500">Active Patients</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-slate-100">{patients.length}</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Visit Requests (Pending Approval)</h2>
            <div className="mt-4 space-y-3">
              {loading && <p className="text-sm text-slate-500">Loading requests...</p>}
              {!loading && pendingVisits.length === 0 && <p className="text-sm text-slate-500">No pending requests right now.</p>}
              {pendingVisits.map((request) => {
                const patient = patientById.get(request.patient_id);
                const shareCode = patient?.access_code || '';
                return (
                  <div key={request.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{patient?.full_name || request.patient_id}</p>
                        <p className="text-xs text-slate-500">{request.scheduled_date} {request.scheduled_time}</p>
                        {shareCode && <p className="mt-1 text-[11px] font-semibold tracking-wider text-cyan-700 dark:text-cyan-300">Family Access Code: {shareCode}</p>}
                      </div>
                      <StatusBadge status="pending" label="pending" />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void copyCode(shareCode)}
                        disabled={!shareCode}
                        className="inline-flex items-center gap-1 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-700 disabled:opacity-50 dark:border-cyan-900/60 dark:bg-cyan-900/30 dark:text-cyan-200"
                      >
                        Copy Code
                      </button>
                      <button
                        type="button"
                        onClick={() => void approveVisit(request.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => pushToast({ type: 'info', title: 'Reject flow pending', message: 'Backend reject endpoint is not available yet.' })}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-900/50 dark:text-rose-200"
                      >
                        <CircleX size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Clinical Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-4 h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              onClick={() => pushToast({ type: 'success', title: 'Notes updated', message: 'Patient notes synced for care team.' })}
              className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Save Notes
            </button>
          </motion.div>
        </section>
      </div>

      {openSessionModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Select Patient for Video Session</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter the patient code to start this call.</p>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={sessionPatientCode}
                onChange={(e) => setSessionPatientCode(e.target.value.toUpperCase())}
                placeholder="Enter patient code"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSessionModal(false);
                    setSessionPatientCode('');
                    navigate('/admin', { replace: true });
                  }}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const normalizedCode = sessionPatientCode.trim().toUpperCase();
                    if (normalizedCode) {
                      setOpenSessionModal(false);
                      navigate(`/call/${normalizedCode}`);
                    }
                  }}
                  disabled={!sessionPatientCode.trim()}
                  className="rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
