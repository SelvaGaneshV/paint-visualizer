import { getImageDataFromImage } from "./utils";

export const buildIntensityMap = (img: ImageData) => {
  const intensity = new Float32Array(img.width * img.height);

  for (let i = 0; i < intensity.length; i++) {
    const o = i * 4;
    const R = img.data[o];
    const G = img.data[o + 1];
    const B = img.data[o + 2];

    const r = R / 255;
    const g = G / 255;
    const b = B / 255;
    intensity[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  return intensity;
};

export const dilate = (mask: Uint8Array, w: number, h: number, r: number = 1) => {
  const out = new Uint8Array(mask);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h) {
            out[ny * w + nx] = 1;
          }
        }
      }
    }
  }
  return out;
};

export const erode = (mask: Uint8Array, w: number, h: number, r: number = 1) => {
  const out = new Uint8Array(mask);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !mask[ny * w + nx]) {
            out[y * w + x] = 0;
            break;
          }
        }
      }
    }
  }
  return out;
};

export const createMasks = (edgeImage: HTMLImageElement, w: number, h: number) => {
  const edgeData = getImageDataFromImage(edgeImage, w, h).data!;

  let barrier = new Uint8Array(w * h);
  // barrier = dilate(barrier, w, h, 1);
  // barrier = erode(barrier, w, h, 1);

  const threshold = 128 * 3;

  for (let i = 0; i < w * h; i++) {
    const r = edgeData[i * 4];
    const g = edgeData[i * 4 + 1];
    const b = edgeData[i * 4 + 2];

    if (r + g + b < threshold) {
      barrier[i] = 1;
    }
  }

  const regions = buildRegions(w, h, barrier);

  return regions;
};

export const buildRegions = (width: number, height: number, barrier: Uint8Array) => {
  const size = width * height;

  const labels = new Int32Array(size).fill(-1);

  let regionCount = 0;

  for (let i = 0; i < size; i++) {
    if (barrier[i] || labels[i] !== -1) continue;

    const stack = [i];
    labels[i] = regionCount;

    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width;
      const y = (p / width) | 0;

      // 4-connectivity (important!)
      if (x > 0) {
        const n = p - 1;
        if (!barrier[n] && labels[n] === -1) {
          labels[n] = regionCount;
          stack.push(n);
        }
      }

      if (x < width - 1) {
        const n = p + 1;
        if (!barrier[n] && labels[n] === -1) {
          labels[n] = regionCount;
          stack.push(n);
        }
      }

      if (y > 0) {
        const n = p - width;
        if (!barrier[n] && labels[n] === -1) {
          labels[n] = regionCount;
          stack.push(n);
        }
      }

      if (y < height - 1) {
        const n = p + width;
        if (!barrier[n] && labels[n] === -1) {
          labels[n] = regionCount;
          stack.push(n);
        }
      }
    }

    regionCount++;
  }

  const pixelRegion = new Int32Array(size).fill(-1);

  for (let i = 0; i < size; i++) {
    if (labels[i] >= 0) {
      pixelRegion[i] = labels[i];
    }
  }

  const dirs = [-1, 1, -width, width];

  for (let i = 0; i < size; i++) {
    if (!barrier[i]) continue;

    for (const d of dirs) {
      const n = i + d;
      if (n < 0 || n >= size) continue;

      if (labels[n] >= 0) {
        pixelRegion[i] = labels[n];
        break;
      }
    }
  }

  const regionPixels: number[][] = Array.from({ length: regionCount }, () => []);

  for (let i = 0; i < size; i++) {
    const r = pixelRegion[i];
    if (r >= 0) regionPixels[r].push(i);
  }

  return {
    regionCount,
    labels,
    pixelRegion,
    regionPixels,
  };
};
