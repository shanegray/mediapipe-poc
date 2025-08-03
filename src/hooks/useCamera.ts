import { useEffect, useRef, useState } from 'react';

export interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export function useCamera(options: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        setIsLoading(true);
        setError(null);

        const constraints: MediaStreamConstraints = {
          video: {
            width: options.width || 1280,
            height: options.height || 720,
            facingMode: options.facingMode || 'user',
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasPermission(true);
        }
      } catch (err) {
        console.error('Camera setup failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to access camera');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [options.width, options.height, options.facingMode]);

  return {
    videoRef,
    isLoading,
    error,
    hasPermission,
  };
}