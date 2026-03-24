type Status = 'stable' | 'critical' | 'pending' | 'approved' | 'completed';

const colorMap: Record<Status, string> = {
  stable: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  approved: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/55 dark:text-cyan-200',
  completed: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
};

type Props = {
  status: Status;
  label?: string;
};

export default function StatusBadge({ status, label }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colorMap[status]}`}>
      <span className="status-dot h-2 w-2 rounded-full bg-current" />
      {label || status}
    </span>
  );
}
