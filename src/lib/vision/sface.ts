import * as ort from 'onnxruntime-web';

const MODEL_URL = '/models/sface/face_recognition_sface_2021dec.onnx';
const INPUT_SIZE = 112;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession(): Promise<ort.InferenceSession> {
  sessionPromise ??= ort.InferenceSession.create(MODEL_URL, {
    executionProviders: ['webgl', 'wasm'],
  });
  return sessionPromise;
}

export async function getSFaceEmbedding(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  landmarks: { x: number; y: number }[]
): Promise<number[]> {
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = INPUT_SIZE;
  faceCanvas.height = INPUT_SIZE;
  const context = faceCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Unable to prepare face image.');

  const targetPoints = [
    { x: 38.2946, y: 51.6963 },
    { x: 73.5318, y: 51.5014 },
    { x: 56.0252, y: 71.7366 },
  ];
  const sourcePoints = [landmarks[0], landmarks[1], landmarks[2]];
  const determinant = sourcePoints[0].x * (sourcePoints[1].y - sourcePoints[2].y)
    + sourcePoints[1].x * (sourcePoints[2].y - sourcePoints[0].y)
    + sourcePoints[2].x * (sourcePoints[0].y - sourcePoints[1].y);

  if (Math.abs(determinant) > 0.001) {
    const inverse = [
      sourcePoints[1].y - sourcePoints[2].y,
      sourcePoints[2].x - sourcePoints[1].x,
      sourcePoints[0].x * sourcePoints[2].y - sourcePoints[2].x * sourcePoints[0].y,
      sourcePoints[2].y - sourcePoints[0].y,
      sourcePoints[0].x - sourcePoints[2].x,
      sourcePoints[2].x * sourcePoints[0].y - sourcePoints[0].x * sourcePoints[2].y,
      sourcePoints[0].y - sourcePoints[1].y,
      sourcePoints[1].x - sourcePoints[0].x,
      sourcePoints[0].x * sourcePoints[1].y - sourcePoints[1].x * sourcePoints[0].y,
    ].map((value) => value / determinant);
    const affine = [0, 0, 0, 0, 0, 0];
    for (let row = 0; row < 3; row += 1) {
      affine[row * 2] = inverse[row * 3] * targetPoints[0].x
        + inverse[row * 3 + 1] * targetPoints[1].x
        + inverse[row * 3 + 2] * targetPoints[2].x;
      affine[row * 2 + 1] = inverse[row * 3] * targetPoints[0].y
        + inverse[row * 3 + 1] * targetPoints[1].y
        + inverse[row * 3 + 2] * targetPoints[2].y;
    }
    context.setTransform(affine[0], affine[1], affine[2], affine[3], affine[4], affine[5]);
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