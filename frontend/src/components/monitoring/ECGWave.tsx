import { motion } from 'framer-motion';
import { useMemo } from 'react';

type ECGWaveProps = {
  critical?: boolean;
  patientId?: string;
  heartRate?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hashSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const seededRandom = (seed: number) => {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { nextSeed: next, value: next / 4294967296 };
};

const randomRange = (seed: number, min: number, max: number) => {
  const { nextSeed, value } = seededRandom(seed);
  return { nextSeed, value: min + (max - min) * value };
};

const buildWavePoints = (seed: number, heartRate: number, critical: boolean) => {
  const width = 1200;
  const baseline = 60;
  const hr = clamp(heartRate || 80, 45, 170);

  const seedOffset = (seed % 25) - 12;
  const baseBeatGap = clamp(Math.round(205 - hr + seedOffset), 105, 210);
  const basePWave = 3 + (seed % 4);
  const baseQWave = 7 + (seed % 5);
  const baseRWave = (critical ? 44 : 34) + (seed % 10);
  const baseSWave = (critical ? 40 : 28) + (seed % 8);
  const baseTWave = 6 + (seed % 6);

  const points: string[] = [`0,${baseline}`];
  let x = 0;
  let seedCursor = seed || 1;

  while (x < width) {
    // Per-beat micro-variations: each spike is different while preserving a stable patient signature.
    const gapJitter = randomRange(seedCursor, -16, 16);
    seedCursor = gapJitter.nextSeed;
    const pJitter = randomRange(seedCursor, -1.8, 1.8);
    seedCursor = pJitter.nextSeed;
    const qJitter = randomRange(seedCursor, -2.4, 2.4);
    seedCursor = qJitter.nextSeed;
    const rJitter = randomRange(seedCursor, -8.0, 8.0);
    seedCursor = rJitter.nextSeed;
    const sJitter = randomRange(seedCursor, -7.0, 7.0);
    seedCursor = sJitter.nextSeed;
    const tJitter = randomRange(seedCursor, -2.6, 2.6);
    seedCursor = tJitter.nextSeed;

    const beatGap = clamp(Math.round(baseBeatGap + gapJitter.value), 96, 224);
    const pWave = clamp(basePWave + pJitter.value, 1.5, 8.5);
    const qWave = clamp(baseQWave + qJitter.value, 4, 13);
    const rWave = clamp(baseRWave + rJitter.value, critical ? 28 : 22, critical ? 62 : 50);
    const sWave = clamp(baseSWave + sJitter.value, critical ? 20 : 16, critical ? 56 : 44);
    const tWave = clamp(baseTWave + tJitter.value, 3, 13);

    const beatCenter = x + Math.max(34, Math.round(beatGap * 0.28));
    const c1 = Math.max(0, beatCenter - 26);
    const c2 = Math.max(0, beatCenter - 15);
    const c3 = Math.max(0, beatCenter - 8);
    const c4 = beatCenter;
    const c5 = beatCenter + 12;
    const c6 = beatCenter + 28;
    const c7 = beatCenter + 53;
    const c8 = beatCenter + 82;

    points.push(`${c1},${baseline}`);
    points.push(`${c2},${baseline - pWave}`);
    points.push(`${c3},${baseline + qWave}`);
    points.push(`${c4},${Math.max(6, baseline - rWave)}`);
    points.push(`${c5},${Math.min(114, baseline + sWave)}`);
    points.push(`${c6},${baseline}`);
    points.push(`${c7},${baseline - tWave}`);
    points.push(`${c8},${baseline}`);

    x += beatGap;
  }

  points.push(`${width},${baseline}`);
  return points.join(' ');
};

const estimateBeatsPerSweep = (seed: number, heartRate: number) => {
  const hr = clamp(heartRate || 80, 45, 170);
  const seedOffset = (seed % 25) - 12;
  const baseBeatGap = clamp(Math.round(205 - hr + seedOffset), 105, 210);

  // SVG waveform width is 1200, and the current motion traverses ~650 px each loop.
  // This converts to how many heartbeats are visible in one right-to-left sweep.
  const beatsInFullWave = 1200 / baseBeatGap;
  const sweepRatio = 650 / 1200;
  return clamp(beatsInFullWave * sweepRatio, 2.1, 7.2);
};

export default function ECGWave({ critical = false, patientId = 'default', heartRate = 82 }: ECGWaveProps) {
  const seed = useMemo(() => hashSeed(patientId), [patientId]);

  const points = useMemo(
    () => buildWavePoints(seed, heartRate, critical),
    [seed, heartRate, critical],
  );

  const animationSeconds = useMemo(() => {
    const hr = clamp(heartRate, 45, 170);
    const secondsPerBeat = 60 / hr;
    const beatsPerSweep = estimateBeatsPerSweep(seed, hr);

    // Duration follows clinical rhythm: higher HR => faster ECG sweep.
    return clamp(beatsPerSweep * secondsPerBeat, 1.9, 5.8);
  }, [seed, heartRate]);

  return (
    <div className={`icu-monitor-panel relative h-36 overflow-hidden rounded-2xl border px-3 py-2 ${critical ? 'border-rose-400/70 critical-glow' : 'border-cyan-400/50'}`}>
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.75),rgba(2,6,23,0.92))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,212,191,.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,.2)_1px,transparent_1px)] bg-size-[22px_22px] opacity-35" />
      <motion.svg
        viewBox="0 0 1200 120"
        className="absolute inset-y-0 left-0 h-full w-[220%]"
        animate={{ x: [0, -650] }}
        transition={{
          duration: animationSeconds,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          fill="none"
          stroke={critical ? '#fb7185' : '#34d399'}
          strokeWidth="3"
          points={points}
        />
      </motion.svg>
    </div>
  );
}
