import React from "react";
import { IMAGE_SETS } from "~/lib/image-sets";
import { buildIntensityMap, createMasks } from "~/lib/mask-generator";
import { getImageDataFromImage, hexToRgb, loadImage } from "~/lib/utils";

interface CanvasProps {
  id: number;
}

export const Canvas: React.FC<CanvasProps> = ({ id }) => {
  const [color, setColor] = React.useState<string>("");
  const [images, setImages] = React.useState<HTMLImageElement[] | null>(null);
  const [regions, setRegions] = React.useState<{
    labels: Int32Array<ArrayBuffer>;
    regionCount: number;
  } | null>();
  const [regionPixels, setRegionPixels] = React.useState<number[][] | null>(null);
  const [intensity, setIntensity] = React.useState<Float32Array<ArrayBuffer> | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    loadNeedImage();
  }, [id]);

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
    const imageSet = IMAGE_SETS.find((set) => set.id === id)!;
    const loadedImage = await Promise.all([
      loadImage(imageSet.cleaned),
      loadImage(imageSet.edge),
      loadImage(imageSet.normals),
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

    const { regionPixels, labels, regionCount } = createMasks(edge, cleaned.width, cleaned.height);
    const normalsData = getImageDataFromImage(loadedImage.at(2)!, cleaned.width, cleaned.height);
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
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    const labels = regions?.labels!;
    return labels[y * canvas.width + x];
  }

  return (
    <div className="container mx-auto max-w-3xl overflow-auto px-4 py-2">
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
};
