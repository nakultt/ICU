import { useEffect, useMemo, useRef, useState } from 'react';
import type { PatientStatus, VitalsSnapshot } from '../types/icuMonitoring';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hashSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
};

const seededRandom = (seed: number) => {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { nextSeed: next, value: next / 4294967296 };
};

const jitterFromSeed = (seed: number, min: number, max: number) => {
  const { nextSeed, value } = seededRandom(seed);
  return { nextSeed, value: min + (max - min) * value };
};

const defaultVitals: VitalsSnapshot = {
  heartRate: 82,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  temperature: 98.6,
  sugarLevel: 110,
  oxygen: 97,
};

export function useLiveVitals(sourceVitals?: VitalsSnapshot, patientKey = 'default') {
  const [liveVitals, setLiveVitals] = useState<VitalsSnapshot>(sourceVitals ?? defaultVitals);
  const seedRef = useRef<number>(hashSeed(patientKey));

  const baseVitals = useMemo(() => sourceVitals ?? defaultVitals, [sourceVitals]);

  useEffect(() => {
    setLiveVitals(baseVitals);
  }, [baseVitals]);

  useEffect(() => {
    seedRef.current = hashSeed(patientKey);
  }, [patientKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLiveVitals((previous) => {
        const mildCritical =
          previous.temperature >= 101.3 ||
          previous.sugarLevel >= 220 ||
          previous.heartRate > 120 ||
          (previous.oxygen ?? 100) < 92;

        const hrRange = mildCritical ? 3.2 : 2.1;
        const bpSysRange = mildCritical ? 3.6 : 2.2;
        const bpDiaRange = mildCritical ? 2.8 : 1.8;
        const tempRange = mildCritical ? 0.06 : 0.04;
        const sugarRange = mildCritical ? 3.4 : 2.0;
        const oxygenRange = mildCritical ? 1.1 : 0.6;

        let seedCursor = seedRef.current;

        const hrNoise = jitterFromSeed(seedCursor, -hrRange, hrRange);
        seedCursor = hrNoise.nextSeed;
        const sysNoise = jitterFromSeed(seedCursor, -bpSysRange, bpSysRange);
        seedCursor = sysNoise.nextSeed;
        const diaNoise = jitterFromSeed(seedCursor, -bpDiaRange, bpDiaRange);
        seedCursor = diaNoise.nextSeed;
        const tempNoise = jitterFromSeed(seedCursor, -tempRange, tempRange);
        seedCursor = tempNoise.nextSeed;
        const sugarNoise = jitterFromSeed(seedCursor, -sugarRange, sugarRange);
        seedCursor = sugarNoise.nextSeed;
        const oxygenNoise = jitterFromSeed(seedCursor, -oxygenRange, oxygenRange);
        seedCursor = oxygenNoise.nextSeed;

        seedRef.current = seedCursor;

        const nextTemperatureRaw = clamp(previous.temperature * 0.9 + baseVitals.temperature * 0.1 + tempNoise.value, 95, 105);
        const temperatureDeltaCap = mildCritical ? 0.12 : 0.08;
        const nextTemperature = clamp(
          previous.temperature + clamp(nextTemperatureRaw - previous.temperature, -temperatureDeltaCap, temperatureDeltaCap),
          95,
          105,
        );

        return {
          // Slow pull toward source vitals keeps movement realistic and avoids abrupt jumps.
          heartRate: clamp(Math.round(previous.heartRate * 0.78 + baseVitals.heartRate * 0.22 + hrNoise.value), 45, 170),
          bloodPressureSystolic: clamp(Math.round(previous.bloodPressureSystolic * 0.8 + baseVitals.bloodPressureSystolic * 0.2 + sysNoise.value), 85, 185),
          bloodPressureDiastolic: clamp(Math.round(previous.bloodPressureDiastolic * 0.8 + baseVitals.bloodPressureDiastolic * 0.2 + diaNoise.value), 50, 120),
          temperature: Number(nextTemperature.toFixed(1)),
          sugarLevel: clamp(
            Math.round(previous.sugarLevel * 0.86 + baseVitals.sugarLevel * 0.14 + sugarNoise.value),
            70,
            300,
          ),
          oxygen: clamp(
            Math.round((previous.oxygen ?? 97) * 0.84 + (baseVitals.oxygen ?? 97) * 0.16 + oxygenNoise.value),
            84,
            100,
          ),
        };
      });
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [baseVitals]);

  const status: PatientStatus = useMemo(() => {
    const critical =
      liveVitals.heartRate > 120 ||
      liveVitals.heartRate < 55 ||
      liveVitals.temperature >= 101.3 ||
      liveVitals.sugarLevel >= 220 ||
      (liveVitals.oxygen ?? 100) < 92 ||
      liveVitals.bloodPressureSystolic >= 160;
    return critical ? 'critical' : 'stable';
  }, [liveVitals]);

  return { liveVitals, status };
}
