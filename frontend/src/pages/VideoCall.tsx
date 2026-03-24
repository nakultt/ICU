import { motion } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, ShieldPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import ConnectionQuality from '../components/ui/ConnectionQuality';
import SessionTimer from '../components/ui/SessionTimer';
import { useToast } from '../components/ui/ToastProvider';

export default function VideoCall() {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [connected, setConnected] = useState(true);
  const { pushToast } = useToast();

  const status = useMemo(() => (connected ? 'Connected · Encrypted Channel' : 'Reconnecting...'), [connected]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-white md:px-6">
      <div className="mx-auto grid h-[calc(100vh-2rem)] max-w-[1500px] gap-4 lg:grid-cols-[1fr_320px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900">
          <div className="absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              {status}
            </div>
            <div className="flex items-center gap-2">
              <ConnectionQuality quality={quality} />
              <SessionTimer />
            </div>
          </div>

          <div className="relative h-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.16),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(14,165,233,0.15),transparent_40%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-black md:text-4xl">Patient Stream</p>
                <p className="mt-2 text-sm text-slate-300">ICU Bed A-12 · Room Monitored</p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-6 right-6 h-44 w-64 overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 shadow-2xl"
            >
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-300">
                <div>
                  <p className="font-bold">Family Camera</p>
                  <p className="text-xs text-slate-400">Self preview</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-700 bg-black/50 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              className={`rounded-2xl p-3 transition ${muted ? 'bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              type="button"
              onClick={() => setCameraOff((prev) => !prev)}
              className={`rounded-2xl p-3 transition ${cameraOff ? 'bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {cameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setConnected(false);
                pushToast({ type: 'error', title: 'Call ended', message: 'Session has been closed by local user.' });
              }}
              className="rounded-2xl bg-rose-600 p-3 transition hover:bg-rose-500"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>

        <aside className="glass-card scrollbar-thin overflow-y-auto rounded-[2rem] p-5">
          <h2 className="inline-flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
            <ShieldPlus size={18} /> Nurse Control Panel
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Monitor quality, intervene instantly, and maintain safety.</p>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setQuality('high')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Signal Quality: High
            </button>
            <button
              type="button"
              onClick={() => setQuality('medium')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Signal Quality: Medium
            </button>
            <button
              type="button"
              onClick={() => setQuality('low')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Signal Quality: Low
            </button>
            <button
              type="button"
              onClick={() => pushToast({ type: 'info', title: 'Family informed', message: 'Nurse sent a comfort update to family.' })}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
            >
              Send Care Update
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
