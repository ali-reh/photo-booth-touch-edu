'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  restartKey?: string;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  captureImage: () => HTMLCanvasElement | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = 'user', restartKey = 'camera' } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      try {
        setError(null);
        setIsReady(false);

        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported by this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadeddata = () => {
            if (isMounted && video.videoWidth > 0 && video.videoHeight > 0) {
              setIsReady(true);
            }
          };
          video.onloadedmetadata = async () => {
            try {
              await video.play();
              if (isMounted) {
                setIsReady(true);
              }
            } catch (playError) {
              if (isMounted) {
                setError(
                  playError instanceof Error
                    ? playError.message
                    : 'Failed to start video playback.'
                );
              }
            }
          };
        }
      } catch (err) {
        if (isMounted) {
          const errorName = err instanceof DOMException ? ` (${err.name})` : '';
          setError(
            `${err instanceof Error ? err.message : 'Unable to access camera device.'}${errorName}`
          );
          setIsReady(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsReady(false);
    };
  }, [facingMode, restartKey]);

  const captureImage = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

  return {
    videoRef,
    isReady,
    error,
    captureImage,
  };
}
