import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { buildIntensityMap, createMasks } from "~/lib/mask-generator";
import type { UploadedImages } from "~/lib/types";
import { getImageDataFromImage, hexToRgb, loadFileAsImage } from "~/lib/utils";

interface CanvasProps {
  uploadedImages: UploadedImages;
  selectedColor: string;
}

export const Canvas: React.FC<CanvasProps> = ({ uploadedImages, selectedColor }) => {
  const [regions, setRegions] = React.useState<{
    labels: Int32Array<ArrayBuffer>;
    regionCount: number;
  } | null>();
  const [regionPixels, setRegionPixels] = React.useState<number[][] | null>(null);
  const [intensity, setIntensity] = React.useState<Float32Array<ArrayBuffer> | null>(null);
  const [selectedRegion, setSelectedRegion] = React.useState<number | null>(null);
  const [mode, setMode] = React.useState<"select" | "paint">("select");
  const [readyToLoad, setReadyToLoad] = React.useState(false);
  const [textureImageData, setTextureImageData] = React.useState<ImageData | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const highlightRef = React.useRef<HTMLCanvasElement | null>(null);

  const allImagesLoaded = uploadedImages.cleaned && uploadedImages.edge && uploadedImages.normals;

  React.useEffect(() => {
    if (allImagesLoaded) {
      setReadyToLoad(true);
      loadNeedImage();
    } else {
      setReadyToLoad(false);
    }
  }, [uploadedImages]);

  const handlePaintAll = React.useEffectEvent(() => {
    paintAllRegion(hexToRgb(selectedColor));
  });
  const handleReload = React.useEffectEvent(() => {
    loadNeedImage();
  });
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("paint-all", handlePaintAll as EventListener);
    canvas.addEventListener("reload", handleReload as EventListener);

    return () => {
      canvas.removeEventListener("paint-all", handlePaintAll as EventListener);
      canvas.removeEventListener("reload", handleReload as EventListener);
    };
  }, [regionPixels, intensity]);

  function paintRegion(regionId: number, baseColor = [210, 180, 140]) {
    if (regionId < 0 || !regionPixels || !intensity || !textureImageData) return;
    const [br, bg, bb] = baseColor;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const pixels = regionPixels[regionId];

    for (const i of pixels) {
      const o = i * 4;
      const k = intensity[i];
      if (k === -1) continue;

      const tr = textureImageData.data[o];
      const tg = textureImageData.data[o + 1];
      const tb = textureImageData.data[o + 2];

      img.data[o] = Math.min(255, (tr * br) / 255);
      img.data[o + 1] = Math.min(255, (tg * bg) / 255);
      img.data[o + 2] = Math.min(255, (tb * bb) / 255);
      img.data[o + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }

  function paintAllRegion(baseColor: number[] = [210, 180, 140]) {
    if (!regionPixels || !intensity || !textureImageData) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    })!;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const [br, bg, bb] = baseColor;
    for (let r = 0; r < regionPixels.length; r++) {
      for (const i of regionPixels[r]) {
        const o = i * 4;
        const k = intensity[i];
        if (k === -1) continue;

        const tr = textureImageData.data[o];
        const tg = textureImageData.data[o + 1];
        const tb = textureImageData.data[o + 2];

        img.data[o] = Math.min(255, (tr * br) / 255);
        img.data[o + 1] = Math.min(255, (tg * bg) / 255);
        img.data[o + 2] = Math.min(255, (tb * bb) / 255);
        img.data[o + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }

  function highlightRegion(regionId: number | null) {
    const highlightCanvas = highlightRef.current;
    const mainCanvas = canvasRef.current;
    if (!highlightCanvas || !mainCanvas || !regionPixels || !regions) return;

    highlightCanvas.width = mainCanvas.width;
    highlightCanvas.height = mainCanvas.height;

    const ctx = highlightCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

    if (regionId === null || regionId < 0) return;

    const pixels = regionPixels[regionId];
    const pixelSet = new Set(pixels);

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;

    for (const i of pixels) {
      const x = i % mainCanvas.width;
      const y = Math.floor(i / mainCanvas.width);
      const isEdge =
        !pixelSet.has(i - 1) ||
        !pixelSet.has(i + 1) ||
        !pixelSet.has(i - mainCanvas.width) ||
        !pixelSet.has(i + mainCanvas.width);

      if (isEdge) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  React.useEffect(() => {
    highlightRegion(selectedRegion);
  }, [selectedRegion, regionPixels]);

  const loadNeedImage = async () => {
    if (!uploadedImages.cleaned || !uploadedImages.edge || !uploadedImages.normals) {
      return;
    }

    try {
      const loadedImage = await Promise.all([
        loadFileAsImage(uploadedImages.cleaned),
        loadFileAsImage(uploadedImages.edge),
        loadFileAsImage(uploadedImages.normals),
      ]);

      const [cleaned, edge, normals] = loadedImage;
      const canvas = canvasRef.current!;
      console.log(canvas, cleaned.width, cleaned.height);
      canvas.width = cleaned.width;
      canvas.height = cleaned.height;

      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      })!;

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(cleaned, 0, 0, cleaned.width, cleaned.height);

      const textureData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setTextureImageData(textureData);

      const { regionPixels, labels, regionCount } = createMasks(
        edge,
        cleaned.width,
        cleaned.height,
      );
      const normalsData = getImageDataFromImage(normals, cleaned.width, cleaned.height);
      const intensity = buildIntensityMap(normalsData);

      setIntensity(intensity);
      setRegionPixels(regionPixels);
      setRegions({ labels, regionCount });
    } catch (error) {
      console.error(error);
    }
  };

  function getRegionFromClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!regions) return -1;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    return regions.labels[y * canvas.width + x];
  }

  const totalPixels = regionPixels?.reduce((sum, pixels) => sum + pixels.length, 0) || 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative flex min-h-100 items-center justify-center bg-muted/20">
          {!readyToLoad ? (
            <div className="text-muted-foreground">Please upload all required images</div>
          ) : (
            <div className="relative">
              <canvas
                id="uploaded-canvas"
                ref={canvasRef}
                className="h-auto max-w-full cursor-crosshair touch-none"
                onClick={(e) => {
                  const regionId = getRegionFromClick(e);
                  if (mode === "select") {
                    setSelectedRegion(regionId);
                  } else if (mode === "paint" && selectedColor) {
                    setSelectedRegion(regionId);
                    paintRegion(regionId, hexToRgb(selectedColor));
                  }
                }}
                onMouseMove={(e) => {
                  if (mode === "paint" && e.shiftKey && selectedColor) {
                    const regionId = getRegionFromClick(e);
                    paintRegion(regionId, hexToRgb(selectedColor));
                  }
                }}
              />
              <canvas
                ref={highlightRef}
                className="pointer-events-none absolute top-0 left-0 h-full w-full"
              />
            </div>
          )}

          <div className="absolute right-4 bottom-4 left-4 flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("select")}
                className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "select"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Select Mode
              </button>
              <button
                onClick={() => setMode("paint")}
                className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "paint"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Paint Mode
              </button>
            </div>
            <div className="flex gap-6 rounded-lg border border-border bg-background/95 px-4 py-2 text-sm shadow-lg backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Regions:</span>
                <span className="font-semibold">{regions?.regionCount || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Pixels:</span>
                <span className="font-semibold">{totalPixels.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Selected:</span>
                <span className="font-semibold">
                  {selectedRegion !== null ? `Region ${selectedRegion}` : "None"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
