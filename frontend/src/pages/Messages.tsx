import AppShell from '../components/layout/AppShell';
import { MessageSquareText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MessagesPage() {
  return (
    <AppShell role="family">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex h-[60vh] flex-col items-center justify-center rounded-3xl p-6 text-center shadow-xl">
        <MessageSquareText size={64} className="mb-4 text-cyan-500 opacity-60" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Messages</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Your secure inbox. Secure textual communications with the nursing desk are being routed here.
        </p>
      </motion.div>
    </AppShell>
  );
}
