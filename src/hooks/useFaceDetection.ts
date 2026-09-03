'use client';

import { useState, useEffect, useCallback } from 'react';
import { descriptorToArray, cropFace } from '@/lib/vision/embeddings';
import { matchVisitorFace } from '@/lib/supabase/services';
import type { DetectedFace } from '@/types/kiosk';

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

        const detectedFaces: DetectedFace[] = detections.map((d, index) => {
          const box = {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height,
          };

          return {
            index,
            box,
            thumbnailUrl: cropFace(canvas, box),
            descriptor: descriptorToArray(d.descriptor),
            matchedVisitor: null,
            isIgnored: false,
          };
        });

        setFaces(detectedFaces);
        setIsLoading(false);

        const matchedFaces = await Promise.all(
          detectedFaces.map(async (face) => {
            try {
              const match = await matchVisitorFace(face.descriptor);
              if (!match) return face;

              return {
                ...face,
                matchedVisitor: {
                  id: match.id,
                  fullName: match.full_name,
                  phone: match.phone,
                  email: match.email,
                  company: match.company,
                  interests: match.interests,
                  rating: match.rating,
                  similarity: match.similarity,
                },
              };
            } catch (matchErr) {
              console.warn(`Face match failed for face ${face.index}:`, matchErr);
              return face;
            }
          })
        );

        setFaces((currentFaces) => currentFaces.map((face) => matchedFaces.find((matchedFace) => matchedFace.index === face.index) ?? face));
        return matchedFaces;
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
