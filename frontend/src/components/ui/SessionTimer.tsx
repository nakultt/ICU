import { Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function SessionTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatted = useMemo(() => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [seconds]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Clock3 size={14} />
      Session {formatted}
    </div>
  );
}
