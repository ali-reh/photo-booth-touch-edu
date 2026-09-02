/**
 * Converts a Float32Array face descriptor to a plain number array
 * for storage in Supabase pgvector column.
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

/**
 * Formats a number array as a pgvector-compatible string: '[0.1,0.2,...]'
 */
export function arrayToVectorString(arr: number[]): string {
  return `[${arr.join(',')}]`;
}

/**
 * Crops a face region from a canvas and returns a data URL thumbnail.
 * Adds 30% padding around the detected bounding box for a natural crop.
 */
export function cropFace(
  sourceCanvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  outputSize: number = 150
): string {
  const padding = 0.3;
  const padX = box.width * padding;
  const padY = box.height * padding;

  const sx = Math.max(0, box.x - padX);
  const sy = Math.max(0, box.y - padY);
  const sw = Math.min(sourceCanvas.width - sx, box.width + padX * 2);
  const sh = Math.min(sourceCanvas.height - sy, box.height + padY * 2);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outputSize;
  cropCanvas.height = outputSize;

  const ctx = cropCanvas.getContext('2d')!;
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, outputSize, outputSize);

  return cropCanvas.toDataURL('image/jpeg', 0.85);
}
