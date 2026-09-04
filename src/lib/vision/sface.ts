import * as ort from 'onnxruntime-web';

const MODEL_URL = '/models/sface/face_recognition_sface_2021dec.onnx';
const INPUT_SIZE = 112;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  sessionPromise ??= ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['webgl', 'wasm'],
    logSeverityLevel: 3,
  });
  return sessionPromise;
}

export async function preloadSFace(): Promise<void> {
  await getSession();
}

type Point = { x: number; y: number };

/**
 * Least-squares fit of a 2D similarity transform (rotation + uniform scale +
 * translation only — no shear, no reflection) mapping `source` points onto
 * `target` points. Unlike an exact-fit transform, this averages out landmark
 * jitter across all N correspondences instead of baking it into the crop.
 */
function fitSimilarityTransform(
  source: Point[],
  target: Point[]
): { a: number; b: number; tx: number; ty: number } | null {
  const n = source.length;
  const meanSrc = source.reduce((acc, p) => ({ x: acc.x + p.x / n, y: acc.y + p.y / n }), { x: 0, y: 0 });
  const meanDst = target.reduce((acc, p) => ({ x: acc.x + p.x / n, y: acc.y + p.y / n }), { x: 0, y: 0 });

  let sxx = 0; // sum(xc * x'c + yc * y'c)
  let sxy = 0; // sum(xc * y'c - yc * x'c)
  let denom = 0; // sum(xc^2 + yc^2)

  for (let i = 0; i < n; i += 1) {
    const xc = source[i].x - meanSrc.x;
    const yc = source[i].y - meanSrc.y;
    const xpc = target[i].x - meanDst.x;
    const ypc = target[i].y - meanDst.y;

    sxx += xc * xpc + yc * ypc;
    sxy += xc * ypc - yc * xpc;
    denom += xc * xc + yc * yc;
  }

  if (denom < 1e-6) return null; // degenerate: landmarks collapsed to ~a point

  const a = sxx / denom;
  const b = sxy / denom;
  const tx = meanDst.x - a * meanSrc.x + b * meanSrc.y;
  const ty = meanDst.y - b * meanSrc.x - a * meanSrc.y;

  return { a, b, tx, ty };
}

// Standard OpenCV SFace 5-point reference template for a 112x112 crop.
const TARGET_POINTS: Point[] = [
  { x: 38.2946, y: 51.6963 }, // right eye
  { x: 73.5318, y: 51.5014 }, // left eye
  { x: 56.0252, y: 71.7366 }, // nose tip
  { x: 41.5493, y: 92.3655 }, // right mouth corner
  { x: 70.7299, y: 92.2041 }, // left mouth corner
];

export async function getSFaceEmbedding(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  landmarks: Point[] // [leftEye, rightEye, nose, mouthLeft, mouthRight] — 5 points
): Promise<number[]> {
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = INPUT_SIZE;
  faceCanvas.height = INPUT_SIZE;
  const context = faceCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Unable to prepare face image.');

  const transform = fitSimilarityTransform(landmarks, TARGET_POINTS);

  if (transform) {
    const { a, b, tx, ty } = transform;
    context.setTransform(a, b, -b, a, tx, ty);
    context.drawImage(canvas, 0, 0);
    context.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    const padding = 0.25;
    const sourceX = Math.max(0, box.x - box.width * padding);
    const sourceY = Math.max(0, box.y - box.height * padding);
    const sourceWidth = Math.min(canvas.width - sourceX, box.width * (1 + padding * 2));
    const sourceHeight = Math.min(canvas.height - sourceY, box.height * (1 + padding * 2));
    context.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, INPUT_SIZE, INPUT_SIZE);
  }

  const pixels = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
  const input = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
  const planeSize = INPUT_SIZE * INPUT_SIZE;

  for (let pixel = 0; pixel < planeSize; pixel += 1) {
    const offset = pixel * 4;
    input[pixel] = (pixels[offset + 2] - 127.5) / 128;
    input[planeSize + pixel] = (pixels[offset + 1] - 127.5) / 128;
    input[planeSize * 2 + pixel] = (pixels[offset] - 127.5) / 128;
  }

  const session = await getSession();
  const result = await session.run({ data: new ort.Tensor('float32', input, [1, 3, INPUT_SIZE, INPUT_SIZE]) });
  const embedding = result.fc1.data as Float32Array;
  const length = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
  return Array.from(embedding, (value) => value / length);
}