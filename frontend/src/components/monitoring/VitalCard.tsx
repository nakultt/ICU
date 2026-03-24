import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type VitalCardProps = {
  label: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  critical?: boolean;
};

export default function VitalCard({ label, value, unit, icon, critical = false }: VitalCardProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-xl ${critical ? 'border-rose-400/70 bg-rose-950/25 critical-glow' : 'border-cyan-300/45 bg-slate-950/65'}`}>
      <div className="flex items-center justify-between text-cyan-100">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</p>
        <span className="opacity-90">{icon}</span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <motion.span
          key={value}
          initial={{ opacity: 0.4, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="text-3xl font-black text-emerald-300"
        >
          {value}
        </motion.span>
        {unit && <span className="pb-1 text-xs font-bold uppercase tracking-wider text-slate-300">{unit}</span>}
      </div>
    </div>
  );
}
