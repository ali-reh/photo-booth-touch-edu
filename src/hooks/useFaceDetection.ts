'use client';

import { useState, useEffect, useCallback } from 'react';
import { descriptorToArray, cropFace } from '@/lib/vision/embeddings';
import { matchVisitorFace } from '@/lib/supabase/services';
import type { DetectedFace, MatchedVisitorInfo } from '@/types/kiosk';

export interface UseFaceDetectionReturn {
  faces: DetectedFace[];
  isLoading: boolean;
  isModelsLoaded: boolean;
  error: string | null;
  detect: (canvas: HTMLCanvasElement) => Promise<DetectedFace[]>;
  setFaces: React.Dispatch<React.SetStateAction<DetectedFace[]>>;
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initModels() {
      try {
        const { loadModels } = await import('@/lib/vision/faceDetection');
        await loadModels();
        if (isMounted) {
          setIsModelsLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load face detection models.'
          );
        }
      }
    }

    initModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const detect = useCallback(
    async (canvas: HTMLCanvasElement): Promise<DetectedFace[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const { detectFaces } = await import('@/lib/vision/faceDetection');
        const detections = await detectFaces(canvas);

        const detectedFaces: DetectedFace[] = await Promise.all(
          detections.map(async (d, index) => {
            const descriptor = descriptorToArray(d.descriptor);
            const box = {
              x: d.detection.box.x,
              y: d.detection.box.y,
              width: d.detection.box.width,
              height: d.detection.box.height,
            };
            const thumbnailUrl = cropFace(canvas, box);

            let matchedVisitor: MatchedVisitorInfo | null = null;
            try {
              const match = await matchVisitorFace(descriptor);
              if (match) {
                matchedVisitor = {
                  id: (match as any).id,
                  fullName:
                    (match as any).fullName || (match as any).full_name || '',
                  phone: (match as any).phone || '',
                  email: (match as any).email ?? null,
                  company: (match as any).company ?? null,
                  interests: (match as any).interests ?? [],
                  rating: (match as any).rating ?? null,
                  similarity: (match as any).similarity ?? 0,
                };
              }
            } catch (matchErr) {
              console.warn(`Face match failed for face ${index}:`, matchErr);
            }

            return {
              index,
              box,
              thumbnailUrl,
              descriptor,
              matchedVisitor,
              isIgnored: false,
            };
          })
        );

        setFaces(detectedFaces);
        setIsLoading(false);
        return detectedFaces;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Face detection failed.';
        setError(errorMessage);
        setIsLoading(false);
        return [];
      }
    },
    []
  );

  return {
    faces,
    isLoading,
    isModelsLoaded,
    error,
    detect,
    setFaces,
  };
}
