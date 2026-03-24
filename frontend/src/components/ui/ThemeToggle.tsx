import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-20 items-center rounded-full border border-slate-200/70 bg-white/80 p-1 text-slate-600 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
      aria-label="Toggle dark mode"
      type="button"
    >
      <motion.span
        className="absolute left-2 top-1/2 -translate-y-1/2"
        animate={{ opacity: theme === 'light' ? 1 : 0.35 }}
      >
        <Sun size={16} />
      </motion.span>
      <motion.span
        className="absolute right-2 top-1/2 -translate-y-1/2"
        animate={{ opacity: theme === 'dark' ? 1 : 0.35 }}
      >
        <Moon size={16} />
      </motion.span>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="z-10 h-8 w-8 rounded-full brand-gradient shadow-lg"
        animate={{ x: theme === 'dark' ? 38 : 0 }}
      />
    </button>
  );
}
