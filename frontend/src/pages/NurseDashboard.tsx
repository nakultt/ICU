import { motion } from 'framer-motion';
import { CircleX, FileUp, Filter, PhoneOff, Search, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';

type Patient = {
  id: string;
  name: string;
  bed: string;
  status: 'stable' | 'critical';
};

type Request = {
  id: string;
  patientId: string;
  family: string;
  datetime: string;
  status: 'pending' | 'approved' | 'rejected';
};

const patients: Patient[] = [
  { id: 'p-001', name: 'Aarav Sharma', bed: 'A-12', status: 'stable' },
  { id: 'p-002', name: 'Meera Iyer', bed: 'B-03', status: 'critical' },
  { id: 'p-003', name: 'Rohan Das', bed: 'A-08', status: 'stable' },
];

const initialRequests: Request[] = [
  { id: 'r-001', patientId: 'p-001', family: 'Ananya Sharma', datetime: '2026-03-24 20:00', status: 'pending' },
  { id: 'r-002', patientId: 'p-002', family: 'Kiran Iyer', datetime: '2026-03-24 20:30', status: 'pending' },
  { id: 'r-003', patientId: 'p-003', family: 'Neha Das', datetime: '2026-03-25 09:00', status: 'approved' },
];

export default function NurseDashboard() {
  const [filter, setFilter] = useState<'all' | 'stable' | 'critical'>('all');
  const [query, setQuery] = useState('');
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [notes, setNotes] = useState('Maintain calm communication and update status every 2 hours.');
  const { pushToast } = useToast();

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const filterMatch = filter === 'all' || patient.status === filter;
        const queryMatch =
          patient.name.toLowerCase().includes(query.toLowerCase()) ||
          patient.bed.toLowerCase().includes(query.toLowerCase());
        return filterMatch && queryMatch;
      }),
    [filter, query],
  );

  const updateRequest = (id: string, status: 'approved' | 'rejected') => {
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    pushToast({
      type: status === 'approved' ? 'success' : 'error',
      title: status === 'approved' ? 'Visit approved' : 'Visit rejected',
      message: `Request ${id.toUpperCase()} has been ${status}.`,
    });
  };

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Patient Live Monitor</h2>
              <div className="flex gap-2">
                {(['all', 'stable', 'critical'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase ${
                      filter === item
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <Search size={15} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by patient or bed"
                className="w-full bg-transparent text-sm outline-none"
              />
              <Filter size={15} className="text-slate-400" />
            </div>

            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{patient.name}</p>
                    <p className="text-xs text-slate-500">Bed {patient.bed}</p>
                  </div>
                  <StatusBadge status={patient.status} />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Live Session Controls</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Quick emergency controls for active ICU video rooms.</p>
            <div className="mt-5 space-y-3">
              <Link
                to="/call/live-session"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
              >
                <Video size={16} /> Open Live Session
              </Link>
              <button
                type="button"
                onClick={() => pushToast({ type: 'error', title: 'Emergency call terminated', message: 'All participants disconnected.' })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white"
              >
                <PhoneOff size={16} /> Emergency End Call
              </button>
              <button
                type="button"
                onClick={() => pushToast({ type: 'success', title: 'Report upload queued', message: 'File is being processed by records system.' })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <FileUp size={16} /> Upload Report
              </button>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Visit Requests</h2>
            <div className="mt-4 space-y-3">
              {requests.map((request) => {
                const patient = patients.find((item) => item.id === request.patientId);
                return (
                  <div key={request.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{request.family} - {patient?.name}</p>
                        <p className="text-xs text-slate-500">{request.datetime}</p>
                      </div>
                      <StatusBadge status={request.status === 'rejected' ? 'pending' : request.status} label={request.status} />
                    </div>

                    {request.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateRequest(request.id, 'approved')}
                          className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRequest(request.id, 'rejected')}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-900/50 dark:text-rose-200"
                        >
                          <CircleX size={14} /> Reject
                        </button>
                      </div>
                    )}
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
              className="mt-4 h-48 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
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
    </AppShell>
  );
}
