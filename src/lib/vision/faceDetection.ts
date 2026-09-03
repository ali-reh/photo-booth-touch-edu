import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;

  const tensorflow = faceapi.tf as typeof faceapi.tf & {
    setBackend: (backendName: string) => Promise<boolean>;
    ready: () => Promise<void>;
  };
  const webglInitialized = await tensorflow.setBackend('webgl');
  if (!webglInitialized) {
    await tensorflow.setBackend('cpu');
  }
  await tensorflow.ready();

  const MODEL_URL = '/models';

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
}

export interface FaceDetectionResult {
  detection: faceapi.FaceDetection;
  landmarks: faceapi.FaceLandmarks68;
}

export async function detectFaces(
  input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): Promise<FaceDetectionResult[]> {
  await loadModels();
  
  const detections = await faceapi
    .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks();
  
  // Sort by x position (left to right)
  return detections
    .sort((a, b) => a.detection.box.x - b.detection.box.x)
    .map((d) => ({
      detection: d.detection,
      landmarks: d.landmarks,
    }));
}
