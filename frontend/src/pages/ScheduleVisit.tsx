import { motion } from 'framer-motion';
import { CalendarDays, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';
import { api } from '../api';

const slots = ['08:00', '08:30', '09:00', '14:00', '14:30', '19:00'];

type Patient = {
  id: string;
  full_name: string;
  bed_number: string;
};

type VisitStatus = 'pending' | 'approved' | 'completed';

type Visit = {
  id: string;
  patient_id: string;
  family_user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  shared_access_code?: string;
};

const normalizeVisitStatus = (status: string): VisitStatus => {
  if (status === 'approved' || status === 'completed') return status;
  return 'pending';
};

export default function ScheduleVisit() {
  const [date, setDate] = useState('2026-03-25');
  const [slot, setSlot] = useState('08:30');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { pushToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientList, visitList] = await Promise.all([api.patients.list(), api.visits.list()]);
      setPatients(patientList);
      setVisits(visitList);
      if (!selectedPatientId && patientList.length > 0) {
        setSelectedPatientId(patientList[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load visit scheduling data';
      pushToast({ type: 'error', title: 'Load failed', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patientOptions = useMemo(() => patients.map((p) => ({ id: p.id, label: `${p.full_name} (Bed ${p.bed_number})` })), [patients]);

  const selectedPatientVisits = useMemo(
    () => visits
      .filter((visit) => !selectedPatientId || visit.patient_id === selectedPatientId)
      .sort((a, b) => `${b.scheduled_date} ${b.scheduled_time}`.localeCompare(`${a.scheduled_date} ${a.scheduled_time}`)),
    [visits, selectedPatientId],
  );

  const requestVisit = async () => {
    if (!selectedPatientId) {
      pushToast({ type: 'error', title: 'No patient linked', message: 'Link a patient first to request a call.' });
      return;
    }

    try {
      setSubmitting(true);
      await api.visits.create({
        patient_id: selectedPatientId,
        scheduled_date: date,
        scheduled_time: slot,
      });

      pushToast({ type: 'success', title: 'Request submitted', message: `Call request sent for ${date} at ${slot}.` });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not request visit';
      pushToast({ type: 'error', title: 'Request failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell role="family">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <CalendarDays size={18} /> Schedule a Visit
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Pick a date and an available slot. Nurse team will approve the request.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Linked Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
                disabled={loading || patientOptions.length === 0}
              >
                {patientOptions.length === 0 ? (
                  <option value="">No linked patient found</option>
                ) : (
                  patientOptions.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.label}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Slot</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {slots.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSlot(item)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                      slot === item
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void requestVisit()}
              disabled={submitting || loading || patientOptions.length === 0}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
            >
              {submitting ? 'Submitting...' : 'Request Approval'}
            </button>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-6">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100">
            <Clock3 size={18} /> Request Status
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Track whether your request is pending, approved, or completed.</p>

          <div className="mt-4 space-y-3">
            {loading && <p className="text-sm text-slate-500">Loading requests...</p>}
            {!loading && selectedPatientVisits.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                No requests yet. Create your first call request.
              </div>
            )}

            {selectedPatientVisits.map((visit) => {
              const status = normalizeVisitStatus(visit.status);
              return (
                <div key={visit.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{visit.scheduled_date} · {visit.scheduled_time}</p>
                      <p className="text-xs text-slate-500">Request ID: {visit.id}</p>
                      {visit.shared_access_code && (
                        <p className="mt-1 text-[11px] font-semibold tracking-wider text-cyan-700 dark:text-cyan-300">
                          Family Access Code: {visit.shared_access_code}
                        </p>
                      )}
                    </div>
                    <StatusBadge
                      status={status}
                      label={status === 'pending' ? 'Awaiting nurse approval' : status}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
