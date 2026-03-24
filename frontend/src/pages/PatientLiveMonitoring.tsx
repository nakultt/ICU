import { motion } from 'framer-motion';
import { Activity, Droplet, HeartPulse, Thermometer, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { api } from '../api';
import ECGWave from '../components/monitoring/ECGWave';
import MedicineTimeline from '../components/monitoring/MedicineTimeline';
import VitalCard from '../components/monitoring/VitalCard';
import { useLiveVitals } from '../hooks/useLiveVitals';
import type { CareStepEntry, PatientMonitoringLog } from '../types/icuMonitoring';
import { monitoringStore } from '../utils/icuMonitoringStore';

type Patient = {
  id: string;
  full_name: string;
  bed_number?: string;
  ward?: string;
};

export default function PatientLiveMonitoring() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const loadPatients = async () => {
      const linked = localStorage.getItem('visicare_family_patient_id');
      if (!linked) {
        setPatients([]);
        setSelectedPatientId('');
        return;
      }

      const linkedPatient = (await api.patients.getById(linked)) as Patient;
      setPatients(linkedPatient ? [linkedPatient] : []);
      setSelectedPatientId(linkedPatient?.id || '');
    };
    void loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    const intervalId = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [selectedPatientId]);

  const logs: PatientMonitoringLog[] = selectedPatientId ? monitoringStore.listByPatient(selectedPatientId) : [];

  const latestLog = logs[0];
  const { liveVitals, status } = useLiveVitals(latestLog?.vitals, selectedPatientId || 'linked-patient');

  const allMedicines = logs
    .flatMap((log) => log.medicines)
    .sort((a, b) => b.administeredAt.localeCompare(a.administeredAt))
    .slice(0, 8);

  const allSteps: CareStepEntry[] = logs
    .flatMap((log) => log.careSteps)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 8);

  const selectedPatient = patients.find((item) => item.id === selectedPatientId);

  const temperaturePercent = Math.max(0, Math.min(100, ((liveVitals.temperature - 95) / 10) * 100));

  return (
    <AppShell role="family">
      <div className="space-y-6">
        <section className="glass-card rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">ICU Live Monitoring</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{selectedPatient?.full_name || 'Linked Patient'} Live Vitals</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Bed {selectedPatient?.bed_number || '--'} {selectedPatient?.ward || ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="live-pill inline-flex items-center gap-2 rounded-full border border-cyan-400/50 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300" /> Live
              </span>
              {patients.length > 0 && (
                <div className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {patients[0].full_name}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <ECGWave critical={status === 'critical'} patientId={selectedPatientId} heartRate={liveVitals.heartRate} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <VitalCard label="Heart Rate" value={String(liveVitals.heartRate)} unit="BPM" icon={<HeartPulse size={16} />} critical={status === 'critical' && liveVitals.heartRate > 120} />
              <VitalCard label="Blood Pressure" value={`${liveVitals.bloodPressureSystolic}/${liveVitals.bloodPressureDiastolic}`} unit="mmHg" icon={<Activity size={16} />} critical={liveVitals.bloodPressureSystolic >= 160} />
              <VitalCard label="Sugar Level" value={String(liveVitals.sugarLevel)} unit="mg/dL" icon={<Droplet size={16} />} critical={liveVitals.sugarLevel >= 220} />
              <VitalCard label="Temperature" value={String(liveVitals.temperature)} unit="F" icon={<Thermometer size={16} />} critical={liveVitals.temperature >= 101.3} />
              <VitalCard label="Oxygen" value={String(liveVitals.oxygen ?? 97)} unit="%" icon={<Waves size={16} />} critical={(liveVitals.oxygen ?? 100) < 92} />
              <div className={`rounded-2xl border p-4 ${status === 'critical' ? 'border-rose-400/80 bg-rose-950/25 critical-glow' : 'border-emerald-400/50 bg-emerald-950/20'}`}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Status</p>
                <p className="mt-2 text-2xl font-black uppercase tracking-widest text-slate-100">{status}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Temperature Meter</p>
              <div className="mt-3 h-3 rounded-full bg-slate-800">
                <motion.div
                  animate={{ width: `${temperaturePercent}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                  className={`h-full rounded-full ${liveVitals.temperature >= 101.3 ? 'bg-rose-500' : 'bg-linear-to-r from-cyan-400 to-emerald-400'}`}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-300">Current: {liveVitals.temperature}F</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="icu-monitor-panel rounded-2xl border border-slate-700 p-4">
              <h3 className="text-base font-black text-slate-100">Medicines Timeline</h3>
              <div className="mt-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                <MedicineTimeline medicines={allMedicines} />
              </div>
            </div>

            <div className="icu-monitor-panel rounded-2xl border border-slate-700 p-4">
              <h3 className="text-base font-black text-slate-100">Care Steps (Nurse Updates)</h3>
              <div className="mt-3 max-h-70 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                {allSteps.length === 0 && <p className="text-sm text-slate-400">No care-step updates yet.</p>}
                {allSteps.map((step) => (
                  <div key={step.id} className="rounded-xl border border-cyan-500/30 bg-cyan-900/15 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-100">{step.description}</p>
                    <p className="text-xs text-slate-400">{new Date(step.recordedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
