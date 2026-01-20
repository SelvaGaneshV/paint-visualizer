import cleanedImg from "@/assets/build/cleaned.png";
import edgeImg from "@/assets/build/edge.png";
import normalsImg from "@/assets/build/normals.png";
import React from "react";

function buildRegions(width: number, height: number, barrier: Uint8Array) {
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

  const regionPixels: number[][] = Array.from(
    { length: regionCount },
    () => [],
  );

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
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((res, rej) => {
    console.log(src);
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
    img.onerror = (e) => rej(e);
  });
};

function getImageDataFromImage(img: HTMLImageElement) {
  console.log(img);
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;

  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  return ctx.getImageData(0, 0, c.width, c.height);
}

function buildIntensityMap(img: ImageData) {
  const intensity = new Float32Array(img.width * img.height);

  for (let i = 0; i < intensity.length; i++) {
    const o = i * 4;
    const R = img.data[o];
    const G = img.data[o + 1];
    const B = img.data[o + 2];
    if (R + G + B < 150) {
      intensity[i] = -1;
    } else {
      const r = R / 255;
      const g = G / 255;
      const b = B / 255;
      intensity[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }

  return intensity;
}

function isDark(r: number, g: number, b: number, threshold: number = 128) {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < threshold;
}

function dilate(mask: Uint8Array, w: number, h: number, r: number = 1) {
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
}

function erode(mask: Uint8Array, w: number, h: number, r: number = 1) {
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
}

const createMasks = (edgeImage: HTMLImageElement, w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(edgeImage, 0, 0, w, h);

  const edgeData = ctx.getImageData(0, 0, w, h)?.data;

  let barrier = new Uint8Array(w * h);
  barrier = dilate(barrier, w, h, 2);
  barrier = erode(barrier, w, h, 1);

  const threshold = 128;

  for (let i = 0; i < w * h; i++) {
    const r = edgeData[i * 4];
    const g = edgeData[i * 4 + 1];
    const b = edgeData[i * 4 + 2];
    const isItDark = isDark(r, g, b, threshold);
    if (isItDark) {
      barrier[i] = 1;
    }
  }
  const regions = buildRegions(w, h, barrier);

  return regions;
};

function hexToRgb(hex: string) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
}

export function HomeComponent() {
  const [color, setColor] = React.useState<string>("");
  const [images, setImages] = React.useState<HTMLImageElement[] | null>(null);
  const [regions, setRegions] = React.useState<{
    labels: Int32Array<ArrayBuffer>;
    regionCount: number;
  } | null>();
  const [regionPixels, setRegionPixels] = React.useState<number[][] | null>(
    null,
  );
  const [intensity, setIntensity] =
    React.useState<Float32Array<ArrayBuffer> | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  function paintRegion(regionId: number, baseColor = [210, 180, 140]) {
    if (regionId < 0) return;
    const [br, bg, bb] = baseColor;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const pixels = regionPixels![regionId];

    for (const i of pixels) {
      const o = i * 4;
      const k = intensity![i];
      if (k === -1) continue;
      img.data[o] = Math.min(255, br * k);
      img.data[o + 1] = Math.min(255, bg * k);
      img.data[o + 2] = Math.min(255, bb * k);
      img.data[o + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }

  function paintAllRegion(baseColor: number[] = [210, 180, 140]) {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const [br, bg, bb] = baseColor;
    for (let r = 0; r < regionPixels!.length; r++) {
      for (const i of regionPixels![r]) {
        const o = i * 4;
        const k = intensity![i];
        if (k === -1) continue;
        img.data[o] = Math.min(255, br * k);
        img.data[o + 1] = Math.min(255, bg * k);
        img.data[o + 2] = Math.min(255, bb * k);
        img.data[o + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }

  const loadNeedImage = async () => {
    const loadedImage = await Promise.all([
      loadImage(cleanedImg),
      loadImage(edgeImg),
      loadImage(normalsImg),
    ]);
    setImages(loadedImage);
    const [cleaned, edge] = loadedImage;
    const canvas = canvasRef.current!;
    canvas.width = cleaned.width;
    canvas.height = cleaned.height;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cleaned, 0, 0, cleaned.width, cleaned.height);

    const { regionPixels, labels, regionCount } = createMasks(
      edge,
      cleaned.width,
      cleaned.height,
    );
    const normalsData = getImageDataFromImage(loadedImage.at(2)!);
    const intensity = buildIntensityMap(normalsData);
    setIntensity(intensity);
    setImages(loadedImage);
    setRegionPixels(regionPixels);
    setRegions({ labels, regionCount });
  };
  function getRegionFromClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor(
      (e.clientY - rect.top) * (canvas.height / rect.height),
    );

    const labels = regions?.labels!;
    return labels[y * canvas.width + x];
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2 overflow-auto">
      <div>
        <button onClick={async () => await loadNeedImage()}>load</button>
        <button
          onClick={async () => {
            if (!color) return;
            paintAllRegion(hexToRgb(color));
          }}
        >
          paint all
        </button>
        <input type="color" onChange={(e) => setColor(e.target.value)} />
      </div>

      <canvas
        ref={canvasRef}
        onClick={(e) => {
          if (!color) return;
          const regionId = getRegionFromClick(e);

          paintRegion(regionId, hexToRgb(color));
        }}
      />
    </div>
  );
}
