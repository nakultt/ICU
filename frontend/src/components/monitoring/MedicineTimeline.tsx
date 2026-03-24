import { Clock4, Syringe, Tablet } from 'lucide-react';
import type { MedicineEntry } from '../../types/icuMonitoring';

type MedicineTimelineProps = {
  medicines: MedicineEntry[];
};

export default function MedicineTimeline({ medicines }: MedicineTimelineProps) {
  if (medicines.length === 0) {
    return <p className="text-sm text-slate-400">No medicines logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {medicines.map((medicine, index) => {
        const isLatest = index === 0;
        return (
          <div
            key={medicine.id}
            className={`rounded-2xl border px-4 py-3 ${isLatest ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/60'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-sm font-black text-slate-100">
                {medicine.route.toLowerCase().includes('inject') ? <Syringe size={14} /> : <Tablet size={14} />}
                {medicine.name} - {medicine.dose}
              </p>
              {isLatest && <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">Last medicine given</span>}
            </div>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock4 size={12} />
              {new Date(medicine.administeredAt).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
