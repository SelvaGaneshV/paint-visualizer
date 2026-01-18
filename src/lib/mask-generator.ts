import type { MaskCanvas } from "./types";

export function generateMasks(
  edgeImage: HTMLImageElement,
  width: number,
  height: number,
): MaskCanvas[] {
  /* ---------- Read edge image ---------- */
  const edgeCanvas = document.createElement("canvas");
  edgeCanvas.width = width;
  edgeCanvas.height = height;
  const edgeCtx = edgeCanvas.getContext("2d")!;
  edgeCtx.drawImage(edgeImage, 0, 0, width, height);

  const edgeData = edgeCtx.getImageData(0, 0, width, height).data;

  /* ---------- Build barrier map ---------- */
  let barrier = new Uint8Array(width * height);

  const threshold = 320;

  for (let i = 0; i < width * height; i++) {
    const r = edgeData[i * 4];
    const g = edgeData[i * 4 + 1];
    const b = edgeData[i * 4 + 2];

    if (r + g + b < threshold) {
      barrier[i] = 1;
    }
  }

  const passes = 1;
  for (let p = 0; p < passes; p++) {
    const copy = barrier.slice();
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        if (copy[i]) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              barrier[(y + dy) * width + (x + dx)] = 1;
            }
          }
        }
      }
    }
  }

  /* ---------- Flood fill regions ---------- */
  const visited = new Uint8Array(width * height);
  const masks: MaskCanvas[] = [];

  function floodFill(sx: number, sy: number): MaskCanvas | null {
    const stack = [[sx, sy]];
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const ctx = maskCanvas.getContext("2d")!;
    const img = ctx.getImageData(0, 0, width, height);
    const data = img.data;

    let count = 0;

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const i = y * width + x;

      if (
        x < 0 ||
        y < 0 ||
        x >= width ||
        y >= height ||
        visited[i] ||
        barrier[i]
      )
        continue;

      visited[i] = 1;
      data[i * 4 + 3] = 255;
      count++;

      stack.push(
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
        [x + 1, y + 1],
        [x - 1, y - 1],
        [x + 1, y - 1],
        [x - 1, y + 1],
      );
    }

    if (count < 500 || count > width * height * 0.6) return null;

    ctx.putImageData(img, 0, 0);
    return maskCanvas;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!visited[i] && !barrier[i]) {
        const mask = floodFill(x, y);
        if (mask) masks.push(mask);
      }
    }
  }

  console.log("Final region count:", masks.length);
  return masks;
}
