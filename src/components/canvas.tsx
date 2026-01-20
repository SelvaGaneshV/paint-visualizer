import React from "react";
import { IMAGE_SETS } from "~/lib/image-sets";
import { buildIntensityMap, createMasks } from "~/lib/mask-generator";
import { getImageDataFromImage, hexToRgb, loadImage } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { Loader2 } from "lucide-react";

interface CanvasProps {
  id: string;
  selectedColor: string;
}

export const Canvas: React.FC<CanvasProps> = ({ id, selectedColor }) => {
  const [regions, setRegions] = React.useState<{
    labels: Int32Array<ArrayBuffer>;
    regionCount: number;
  } | null>();
  const [regionPixels, setRegionPixels] = React.useState<number[][] | null>(null);
  const [intensity, setIntensity] = React.useState<Float32Array<ArrayBuffer> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedRegion, setSelectedRegion] = React.useState<number | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    loadNeedImage();
  }, [id]);

  const handlePaintAll = React.useEffectEvent((e: CustomEvent) => {
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
    if (regionId < 0 || !regionPixels || !intensity) return;
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
      img.data[o] = Math.min(255, br * k);
      img.data[o + 1] = Math.min(255, bg * k);
      img.data[o + 2] = Math.min(255, bb * k);
      img.data[o + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }

  function paintAllRegion(baseColor: number[] = [210, 180, 140]) {
    if (!regionPixels || !intensity) return;
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
        img.data[o] = Math.min(255, br * k);
        img.data[o + 1] = Math.min(255, bg * k);
        img.data[o + 2] = Math.min(255, bb * k);
        img.data[o + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }

  const loadNeedImage = async () => {
    setIsLoading(true);
    try {
      const imageSet = IMAGE_SETS.find((set) => set.id === id)!;
      const loadedImage = await Promise.all([
        loadImage(imageSet.cleaned),
        loadImage(imageSet.edge),
        loadImage(imageSet.normals),
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
    } finally {
      setIsLoading(false);
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
          <canvas
            id={id + "-canvas"}
            ref={canvasRef}
            className="h-auto max-w-full cursor-crosshair touch-none"
            onClick={(e) => {
              if (!selectedColor) return;
              const regionId = getRegionFromClick(e);
              setSelectedRegion(regionId);
              paintRegion(regionId, hexToRgb(selectedColor));
            }}
            onMouseMove={(e) => {
              if (e.shiftKey && selectedColor) {
                const regionId = getRegionFromClick(e);
                paintRegion(regionId, hexToRgb(selectedColor));
              }
            }}
          />

          <div className="absolute right-4 bottom-4 left-4 flex justify-center">
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
