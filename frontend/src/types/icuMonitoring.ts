export type PatientStatus = 'stable' | 'critical';

export type VitalsSnapshot = {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number;
  sugarLevel: number;
  oxygen?: number;
};

export type MedicineEntry = {
  id: string;
  name: string;
  dose: string;
  route: string;
  administeredAt: string;
};

export type CareStepEntry = {
  id: string;
  description: string;
  recordedAt: string;
};

export type DoctorReportEntry = {
  id: string;
  title: string;
  summary: string;
  fileName?: string;
  createdAt: string;
};

export type DoctorInfo = {
  name: string;
  designation: string;
};

export type PatientMonitoringLog = {
  id: string;
  patientId: string;
  patientName: string;
  nurseName: string;
  createdAt: string;
  updatedAt: string;
  status: PatientStatus;
  vitals: VitalsSnapshot;
  doctor: DoctorInfo;
  doctorNotes: string;
  medicines: MedicineEntry[];
  careSteps: CareStepEntry[];
  reports: DoctorReportEntry[];
};
