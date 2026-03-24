import type { PatientMonitoringLog } from '../types/icuMonitoring';

const STORAGE_KEY = 'icu_monitoring_logs_v1';

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseStoredLogs = (raw: string | null): PatientMonitoringLog[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PatientMonitoringLog => {
      const candidate = item as Partial<PatientMonitoringLog>;
      return Boolean(candidate?.id && candidate?.patientId && candidate?.vitals && candidate?.createdAt);
    });
  } catch {
    return [];
  }
};

export const monitoringStore = {
  list(): PatientMonitoringLog[] {
    return parseStoredLogs(localStorage.getItem(STORAGE_KEY));
  },

  listByPatient(patientId: string): PatientMonitoringLog[] {
    return this.list()
      .filter((item) => item.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  latestByPatient(patientId: string): PatientMonitoringLog | undefined {
    return this.listByPatient(patientId)[0];
  },

  upsert(log: PatientMonitoringLog): PatientMonitoringLog[] {
    const logs = this.list();
    const index = logs.findIndex((item) => item.id === log.id);
    if (index >= 0) {
      logs[index] = { ...log, updatedAt: new Date().toISOString() };
    } else {
      logs.unshift({ ...log, id: log.id || makeId(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return logs;
  },

  remove(logId: string): PatientMonitoringLog[] {
    const next = this.list().filter((item) => item.id !== logId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  newId(): string {
    return makeId();
  },
};
