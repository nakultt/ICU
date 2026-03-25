import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

interface UseFaceExpressionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

export function useFaceExpression({ videoRef, enabled }: UseFaceExpressionOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isDistressed, setIsDistressed] = useState(false);
  
  // Track consecutive distressed frames to debounce detection
  const distressCounter = useRef(0);
  const analyzeInterval = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadModels = async () => {
      try {
        console.log('[Face API] Loading models...');
        // Need to load the tiny face detector, face landmarks, and expressions
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        if (isMounted) {
          console.log('[Face API] Models loaded successfully.');
          setIsReady(true);
        }
      } catch (err) {
        console.error('[Face API] Error loading models:', err);
      }
    };
    
    if (enabled) {
      loadModels();
    }
    
    return () => {
      isMounted = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isReady || !videoRef.current) return;

    const analyzeFrame = async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || video.readyState !== 4) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detection) {
          const expr = detection.expressions;
          // 'sad' or 'fearful' thresholds
          if (expr.sad > 0.6 || expr.fearful > 0.6) {
             distressCounter.current += 1;
             console.log(`[Face API] Distressed frame detected! count=${distressCounter.current}`);
          } else {
             distressCounter.current = Math.max(0, distressCounter.current - 1);
          }

          // Require ~3 consecutive frames of distress to trigger (reduces noise)
          if (distressCounter.current >= 3 && !isDistressed) {
            setIsDistressed(true);
          } else if (distressCounter.current === 0 && isDistressed) {
            setIsDistressed(false);
          }
        }
      } catch (err) {
        console.warn('[Face API] Detection loop error:', err);
      }
    };

    analyzeInterval.current = window.setInterval(analyzeFrame, 800); // Check every 800ms

    return () => {
      if (analyzeInterval.current) {
        clearInterval(analyzeInterval.current);
      }
    };
  }, [enabled, isReady, videoRef, isDistressed]);

  return { isReady, isDistressed };
}
