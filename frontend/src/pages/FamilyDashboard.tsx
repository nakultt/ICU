import { motion } from 'framer-motion';
import { Bell, CalendarDays, Link2, MessageSquareText, PhoneCall, Video, Sparkles, Bot } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AppShell from '../components/layout/AppShell';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';

type Patient = {
  id: string;
  full_name: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  current_status: string;
  status_note: string;
  access_code: string;
};

type Visit = {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  shared_access_code?: string;
};

const alerts = [
  'Call approved for tomorrow at 08:30',
  'Nurse added a progress note',
  'Vitals stable over the last 6 hours',
];

const normalizeStatus = (status: string): 'stable' | 'critical' =>
  status.toLowerCase() === 'critical' ? 'critical' : 'stable';

const normalizeVisitStatus = (status: string): 'pending' | 'approved' | 'completed' => {
  if (status === 'approved' || status === 'completed') return status;
  return 'pending';
};

export default function FamilyDashboard() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const { pushToast } = useToast();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [patientList, visitList] = await Promise.all([api.patients.list(), api.visits.list()]);
      setPatients(patientList);
      setVisits(visitList);

      const savedPatientId = localStorage.getItem('visicare_family_patient_id');
      if (savedPatientId && patientList.some((item: Patient) => item.id === savedPatientId)) {
        setSelectedPatientId(savedPatientId);
        setLookupDone(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load dashboard data';
      pushToast({ type: 'error', title: 'Load failed', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPatient = useMemo(
    () => patients.find((item) => item.id === selectedPatientId) || patients[0],
    [patients, selectedPatientId],
  );

  const patientVisits = useMemo(
    () => visits
      .filter((item) => selectedPatient && item.patient_id === selectedPatient.id)
      .sort((a, b) => `${b.scheduled_date} ${b.scheduled_time}`.localeCompare(`${a.scheduled_date} ${a.scheduled_time}`)),
    [visits, selectedPatient],
  );

  const stats = useMemo(() => {
    const completed = patientVisits.filter((item) => item.status === 'completed').length;
    const upcoming = patientVisits.filter((item) => item.status === 'approved').length;
    return { completed, upcoming, total: patientVisits.length };
  }, [patientVisits]);

  const linkPatient = async () => {
    const identifier = linkCode.trim();
    if (!identifier) {
      pushToast({ type: 'error', title: 'Missing code', message: 'Enter patient ID or access code.' });
      return;
    }

    try {
      setLinking(true);
      const alreadyLinked = patients.find(
        (patient) => patient.id === identifier || patient.access_code === identifier,
      );

      if (alreadyLinked) {
        setSelectedPatientId(alreadyLinked.id);
        setLookupDone(true);
        localStorage.setItem('visicare_family_patient_id', alreadyLinked.id);
        pushToast({ type: 'success', title: 'Patient loaded', message: 'Showing corresponding patient details.' });
        setLinkCode('');
        window.dispatchEvent(new Event('storage')); // Trigger update if listening, though full reload is safer
        window.location.reload(); 
        return;
      }

      await api.patients.link(identifier, 'Family');
      pushToast({ type: 'success', title: 'Patient linked', message: 'Patient details were loaded to your dashboard.' });
      setLinkCode('');
      await loadDashboard();

      const refreshedPatients = (await api.patients.list()) as Patient[];
      setPatients(refreshedPatients);
      const matched = refreshedPatients.find(
        (patient) => patient.id === identifier || patient.access_code === identifier,
      );
      if (matched) {
        setSelectedPatientId(matched.id);
        setLookupDone(true);
        localStorage.setItem('visicare_family_patient_id', matched.id);
        setTimeout(() => window.location.reload(), 500); // Reload to reveal hidden menu links
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not link patient';
      pushToast({ type: 'error', title: 'Link failed', message });
    } finally {
      setLinking(false);
    }
  };

  useEffect(() => {
    if (lookupDone && selectedPatientId) {
      localStorage.setItem('visicare_family_patient_id', selectedPatientId);
    }
  }, [lookupDone, selectedPatientId]);

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
            <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
              <Link2 size={18} /> Enter Patient ID or Access Code
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Family-only area: enter the code shared by the nurse to securely view patient details.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value)}
                placeholder="Patient ID or Access Code"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => void linkPatient()}
                disabled={linking}
                className="rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-bold text-white"
              >
                {linking ? 'Linking...' : 'Link Patient'}
              </button>
            </div>
          </motion.section>

          {!lookupDone && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Enter patient ID or access code first. Patient details and call actions will appear after successful lookup.
              </p>
            </motion.section>
          )}

          {lookupDone && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
            <div className="flex flex-col justify-between gap-6 lg:flex-row">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Linked Patient</p>
                {selectedPatient ? (
                  <select
                    value={selectedPatient.id}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value={selectedPatient.id}>{selectedPatient.full_name} (Bed {selectedPatient.bed_number})</option>
                  </select>
                ) : (
                  <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">No linked patients</h2>
                )}

                {selectedPatient && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">{selectedPatient.full_name}</h2>
                      <div className="rounded-2xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-center dark:border-cyan-800/60 dark:bg-cyan-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Family Access Code</p>
                        <p className="font-mono text-xl font-black tracking-widest text-cyan-800 dark:text-cyan-200">
                          {selectedPatient.access_code || selectedPatient.id}
                        </p>
                      </div>
                    </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusBadge status={normalizeStatus(selectedPatient.current_status)} label={selectedPatient.current_status} />
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Bed {selectedPatient.bed_number} {selectedPatient.ward}</span>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Condition: {selectedPatient.diagnosis || 'N/A'}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedPatient.status_note || 'No status note available'}</p>
                  </>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Link
                  to={selectedPatient ? `/call/${selectedPatient.access_code || selectedPatient.id}` : '/family'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-300/35 transition hover:scale-[1.02]"
                  onClick={() => pushToast({ type: 'info', title: 'Starting secure session', message: 'Connecting to ICU room.' })}
                >
                  <Video size={17} /> Start Call
                </Link>
                <Link
                  to="/family/live-monitor"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300 bg-cyan-50 px-5 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-900/60 dark:bg-cyan-900/30 dark:text-cyan-200"
                >
                  <PhoneCall size={17} /> Live Monitor
                </Link>
                <Link
                  to="/schedule"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <CalendarDays size={17} /> Schedule Visit
                </Link>
                <Link
                  to="/family/report"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <Bell size={17} /> Full Report + PDF
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => pushToast({ type: 'success', title: 'Message sent', message: 'Nursing desk has received your note.' })}
                >
                  <MessageSquareText size={17} /> Send Message
                </button>
                <Link
                  to={selectedPatient ? `/family/dashboard/ai-summary/${selectedPatient.id}` : '#'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-900/30 dark:text-indigo-200"
                >
                  <Sparkles size={17} /> AI Patient Summary
                </Link>
                <Link
                  to={selectedPatient ? `/family/dashboard/ai-chat/${selectedPatient.id}` : '#'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-bold text-purple-700 transition hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-900/30 dark:text-purple-200"
                >
                  <Bot size={17} /> Ask VisiCare AI
                </Link>
              </div>
            </div>
          </motion.section>
          )}

          {lookupDone && (
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
          )}

          {lookupDone && (
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Call Requests and Status</h3>
              <div className="mt-4 space-y-3">
                {patientVisits.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                    No call requests found for this patient yet.
                  </div>
                )}
                {patientVisits.map((visit) => {
                  const visitStatus = normalizeVisitStatus(visit.status);
                  return (
                  <div key={visit.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-cyan-100 p-2 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200">
                        <PhoneCall size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Session {visit.id}</p>
                        <p className="text-xs text-slate-500">{visit.scheduled_date} {visit.scheduled_time}</p>
                        {visit.shared_access_code && (
                          <p className="mt-1 text-[11px] font-semibold tracking-wider text-cyan-700 dark:text-cyan-300">
                            Nurse Shared Code: {visit.shared_access_code}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={visitStatus} label={visitStatus} />
                  </div>
                );
                })}
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
          )}
        </div>
      )}
    </AppShell>
  );
}
