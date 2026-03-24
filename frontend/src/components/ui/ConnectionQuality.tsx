import { Signal } from 'lucide-react';

type Quality = 'low' | 'medium' | 'high';

const qualityClass: Record<Quality, string> = {
  low: 'text-rose-500',
  medium: 'text-amber-500',
  high: 'text-teal-500',
};

export default function ConnectionQuality({ quality }: { quality: Quality }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm dark:bg-slate-900/80">
      <Signal size={14} className={qualityClass[quality]} />
      <span>{quality} Signal</span>
    </div>
  );
}
