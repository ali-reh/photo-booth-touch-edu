'use client';

import { useState, useEffect, useCallback } from 'react';
import { cropFace } from '@/lib/vision/embeddings';
import { getSFaceEmbedding } from '@/lib/vision/sface';
import { matchVisitorFace } from '@/lib/supabase/services';
import type { DetectedFace } from '@/types/kiosk';

const MAX_DETECTION_DIMENSION = 1280;

function createDetectionCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_DETECTION_DIMENSION / Math.max(sourceCanvas.width, sourceCanvas.height));
  if (scale === 1) return sourceCanvas;

  const detectionCanvas = document.createElement('canvas');
  detectionCanvas.width = Math.round(sourceCanvas.width * scale);
  detectionCanvas.height = Math.round(sourceCanvas.height * scale);
  detectionCanvas.getContext('2d')?.drawImage(
    sourceCanvas,
    0,
    0,
    detectionCanvas.width,
    detectionCanvas.height,
  );
  return detectionCanvas;
}

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
        const [{ loadModels }, { preloadSFace }] = await Promise.all([
          import('@/lib/vision/faceDetection'),
          import('@/lib/vision/sface'),
        ]);
        const sfaceLoad = preloadSFace();
        sfaceLoad.catch((preloadError) => {
          console.warn('SFace model preload failed:', preloadError);
        });
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
        const detectionCanvas = createDetectionCanvas(canvas);
        const detections = await detectFaces(detectionCanvas);

        const detectedFaces: DetectedFace[] = await Promise.all(detections.map(async (d, index) => {
          const box = {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height,
          };
          const averagePoint = (points: { x: number; y: number }[]) => ({
            x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
            y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
          });

          return {
            index,
            box,
            thumbnailUrl: cropFace(detectionCanvas, box),
            descriptor: await getSFaceEmbedding(detectionCanvas, box, [
              averagePoint(d.landmarks.getLeftEye()),
              averagePoint(d.landmarks.getRightEye()),
              averagePoint(d.landmarks.getNose()),
              d.landmarks.getMouth()[0],  // left mouth corner
              d.landmarks.getMouth()[6],  // right mouth corner
            ]),
            matchedVisitor: null,
            isIgnored: false,
          };
        }));

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
