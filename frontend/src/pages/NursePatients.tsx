import { motion } from 'framer-motion';
import { Edit3, Filter, KeyRound, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/ToastProvider';
import { api } from '../api';

type Patient = {
  id: string;
  full_name: string;
  age?: number;
  gender?: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
  current_status: string;
  status_note: string;
  access_code: string;
};

type PatientForm = {
  full_name: string;
  age: string;
  gender: string;
  bed_number: string;
  ward: string;
  diagnosis: string;
};

const initialPatientForm: PatientForm = {
  full_name: '',
  age: '',
  gender: '',
  bed_number: '',
  ward: 'ICU',
  diagnosis: '',
};

export default function NursePatients() {
  const [filter, setFilter] = useState<'all' | 'stable' | 'critical'>('all');
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPatient, setNewPatient] = useState<PatientForm>(initialPatientForm);
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editPatient, setEditPatient] = useState<PatientForm>(initialPatientForm);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const [removingPatientId, setRemovingPatientId] = useState<string | null>(null);
  const [regeneratingCodeId, setRegeneratingCodeId] = useState<string | null>(null);

  const { pushToast } = useToast();

  const normalizeStatus = (status: string): 'stable' | 'critical' =>
    status.toLowerCase() === 'critical' ? 'critical' : 'stable';

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientList = await api.patients.list();
      setPatients(patientList);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load patients';
      pushToast({ type: 'error', title: 'Load failed', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const status = normalizeStatus(patient.current_status);
        const filterMatch = filter === 'all' || status === filter;
        const queryMatch =
          patient.full_name.toLowerCase().includes(query.toLowerCase()) ||
          patient.bed_number.toLowerCase().includes(query.toLowerCase()) ||
          patient.ward.toLowerCase().includes(query.toLowerCase());
        return filterMatch && queryMatch;
      }),
    [filter, query, patients],
  );

  const createPatient = async () => {
    if (!newPatient.full_name || !newPatient.bed_number) {
      pushToast({ type: 'error', title: 'Missing fields', message: 'Patient name and bed number are required.' });
      return;
    }

    try {
      setCreatingPatient(true);
      await api.patients.create({
        full_name: newPatient.full_name,
        age: newPatient.age ? Number(newPatient.age) : undefined,
        gender: newPatient.gender || undefined,
        bed_number: newPatient.bed_number,
        ward: newPatient.ward || 'ICU',
        diagnosis: newPatient.diagnosis,
        is_conscious: true,
      });

      pushToast({ type: 'success', title: 'Patient added', message: `${newPatient.full_name} was added to ICU records.` });
      setNewPatient(initialPatientForm);
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add patient';
      pushToast({ type: 'error', title: 'Add patient failed', message });
    } finally {
      setCreatingPatient(false);
    }
  };

  const startEditPatient = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setEditPatient({
      full_name: patient.full_name,
      age: patient.age ? String(patient.age) : '',
      gender: patient.gender || '',
      bed_number: patient.bed_number,
      ward: patient.ward,
      diagnosis: patient.diagnosis || '',
    });
  };

  const updatePatient = async () => {
    if (!editingPatientId) return;
    if (!editPatient.full_name || !editPatient.bed_number) {
      pushToast({ type: 'error', title: 'Missing fields', message: 'Patient name and bed number are required.' });
      return;
    }

    try {
      setUpdatingPatient(true);
      await api.patients.update(editingPatientId, {
        full_name: editPatient.full_name,
        age: editPatient.age ? Number(editPatient.age) : null,
        gender: editPatient.gender || null,
        bed_number: editPatient.bed_number,
        ward: editPatient.ward || 'ICU',
        diagnosis: editPatient.diagnosis,
      });
      pushToast({ type: 'success', title: 'Patient updated', message: 'Patient details were updated.' });
      setEditingPatientId(null);
      setEditPatient(initialPatientForm);
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update patient';
      pushToast({ type: 'error', title: 'Update failed', message });
    } finally {
      setUpdatingPatient(false);
    }
  };

  const removePatient = async (patient: Patient) => {
    const confirmed = window.confirm(`Remove ${patient.full_name} from active patients?`);
    if (!confirmed) return;

    try {
      setRemovingPatientId(patient.id);
      await api.patients.remove(patient.id);
      pushToast({ type: 'success', title: 'Patient removed', message: `${patient.full_name} was removed from active list.` });
      if (editingPatientId === patient.id) {
        setEditingPatientId(null);
        setEditPatient(initialPatientForm);
      }
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not remove patient';
      pushToast({ type: 'error', title: 'Remove failed', message });
    } finally {
      setRemovingPatientId(null);
    }
  };

  const regeneratePatientCode = async (patient: Patient) => {
    try {
      setRegeneratingCodeId(patient.id);
      const updated = await api.patients.regenerateAccessCode(patient.id);
      const newCode = updated?.access_code || '';

      if (newCode) {
        try {
          await navigator.clipboard.writeText(newCode);
        } catch {
          // Clipboard can fail outside secure contexts; toast still shows code.
        }
      }

      pushToast({
        type: 'success',
        title: 'New patient code generated',
        message: newCode ? `Code ${newCode} generated and ready to share with family.` : 'New code generated.',
      });
      await loadPatients();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not regenerate patient code';
      pushToast({ type: 'error', title: 'Code generation failed', message });
    } finally {
      setRegeneratingCodeId(null);
    }
  };

  return (
    <AppShell role="admin">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Manage Patients</h2>
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
              placeholder="Search by patient, bed, or ward"
              className="w-full bg-transparent text-sm outline-none"
            />
            <Filter size={15} className="text-slate-400" />
          </div>

          <div className="space-y-3">
            {loading && <p className="text-sm text-slate-500">Loading patients...</p>}
            {!loading && filteredPatients.length === 0 && <p className="text-sm text-slate-500">No patients found.</p>}
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{patient.full_name}</p>
                    <p className="text-xs text-slate-500">Bed {patient.bed_number}  {patient.ward}</p>
                  </div>
                  <StatusBadge status={normalizeStatus(patient.current_status)} label={patient.current_status} />
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{patient.status_note || patient.diagnosis || 'No notes available'}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-wider text-cyan-700 dark:text-cyan-300">PATIENT CODE: {patient.access_code || 'N/A'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void regeneratePatientCode(patient)}
                    disabled={regeneratingCodeId === patient.id}
                    className="inline-flex items-center gap-1 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 disabled:opacity-60 dark:border-cyan-900/60 dark:bg-cyan-900/30 dark:text-cyan-200"
                  >
                    <KeyRound size={13} /> {regeneratingCodeId === patient.id ? 'Generating...' : 'Generate New Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditPatient(patient)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void removePatient(patient)}
                    disabled={removingPatientId === patient.id}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <Trash2 size={13} /> {removingPatientId === patient.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-3xl p-5">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{editingPatientId ? 'Edit Patient' : 'Add Patient'}</h2>
          <div className="mt-4 space-y-3">
            <input
              value={editingPatientId ? editPatient.full_name : newPatient.full_name}
              onChange={(e) => editingPatientId
                ? setEditPatient((prev) => ({ ...prev, full_name: e.target.value }))
                : setNewPatient((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Full name"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={editingPatientId ? editPatient.age : newPatient.age}
                onChange={(e) => editingPatientId
                  ? setEditPatient((prev) => ({ ...prev, age: e.target.value }))
                  : setNewPatient((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="Age"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={editingPatientId ? editPatient.gender : newPatient.gender}
                onChange={(e) => editingPatientId
                  ? setEditPatient((prev) => ({ ...prev, gender: e.target.value }))
                  : setNewPatient((prev) => ({ ...prev, gender: e.target.value }))}
                placeholder="Gender"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={editingPatientId ? editPatient.bed_number : newPatient.bed_number}
                onChange={(e) => editingPatientId
                  ? setEditPatient((prev) => ({ ...prev, bed_number: e.target.value }))
                  : setNewPatient((prev) => ({ ...prev, bed_number: e.target.value }))}
                placeholder="Bed number"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={editingPatientId ? editPatient.ward : newPatient.ward}
                onChange={(e) => editingPatientId
                  ? setEditPatient((prev) => ({ ...prev, ward: e.target.value }))
                  : setNewPatient((prev) => ({ ...prev, ward: e.target.value }))}
                placeholder="Ward"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <textarea
              value={editingPatientId ? editPatient.diagnosis : newPatient.diagnosis}
              onChange={(e) => editingPatientId
                ? setEditPatient((prev) => ({ ...prev, diagnosis: e.target.value }))
                : setNewPatient((prev) => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Diagnosis / condition"
              className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
            />
            {editingPatientId ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPatientId(null);
                    setEditPatient(initialPatientForm);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void updatePatient()}
                  disabled={updatingPatient}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  <Edit3 size={16} /> {updatingPatient ? 'Updating...' : 'Update Patient'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void createPatient()}
                disabled={creatingPatient}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                <Plus size={16} /> {creatingPatient ? 'Adding...' : 'Add Patient'}
              </button>
            )}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
