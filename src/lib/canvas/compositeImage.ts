const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;

/**
 * Composites a camera frame onto a 9:16 canvas, optionally with an overlay frame.
 * Returns a Blob of the final image.
 */
export async function compositeImage(
  videoFrame: HTMLCanvasElement | HTMLVideoElement,
  overlayUrl?: string
): Promise<{ blob: Blob; canvas: HTMLCanvasElement }> {
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  // Draw the camera frame centered and covering the canvas (object-fit: cover)
  const source = videoFrame instanceof HTMLVideoElement
    ? { width: videoFrame.videoWidth, height: videoFrame.videoHeight }
    : { width: videoFrame.width, height: videoFrame.height };

  const sourceAspect = source.width / source.height;
  const targetAspect = TARGET_WIDTH / TARGET_HEIGHT;

  let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

  if (sourceAspect > targetAspect) {
    // Source is wider — crop sides
    drawHeight = TARGET_HEIGHT;
    drawWidth = TARGET_HEIGHT * sourceAspect;
    offsetX = (TARGET_WIDTH - drawWidth) / 2;
    offsetY = 0;
  } else {
    // Source is taller — crop top/bottom
    drawWidth = TARGET_WIDTH;
    drawHeight = TARGET_WIDTH / sourceAspect;
    offsetX = 0;
    offsetY = (TARGET_HEIGHT - drawHeight) / 2;
  }

  ctx.drawImage(videoFrame, offsetX, offsetY, drawWidth, drawHeight);

  // Overlay frame if provided
  if (overlayUrl) {
    const overlay = await loadImage(overlayUrl);
    ctx.drawImage(overlay, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  }

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      'image/jpeg',
      0.92
    );
  });

  return { blob, canvas };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
