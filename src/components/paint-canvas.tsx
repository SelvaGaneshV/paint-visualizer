import React, { useEffect, useRef, useState } from "react";
import { IMAGE_SETS } from "~/lib/image-sets";
import { generateMasks } from "~/lib/mask-generator";
import type { LoadedBuildingImages, Region } from "~/lib/types";
import { loadBuildingSet } from "~/lib/utils";

interface PaintCanvasProps {
  buildingId: number;
  color: string;
}

const PAINT_COLOR = "#c9a26d";

export default function PaintCanvas({
  buildingId,
  color,
}: PaintCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const paintBufferRef = useRef<HTMLCanvasElement>(
    document.createElement("canvas"),
  );

  const [images, setImages] = useState<LoadedBuildingImages | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    async function init() {
      const set = IMAGE_SETS.find((s) => s.id === buildingId);
      if (!set) return;

      const loaded = await loadBuildingSet(set);
      setImages(loaded);

      const canvas = canvasRef.current!;
      canvas.width = loaded.cleaned.width;
      canvas.height = loaded.cleaned.height;

      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(loaded.cleaned, 0, 0);

      const masks = generateMasks(
        loaded.edge,
        loaded.cleaned.width,
        loaded.cleaned.height,
      );

      const regionData: Region[] = masks.map((mask, i) => ({
        id: i,
        mask,
        color: null,
      }));

      setRegions(regionData);
    }

    init();
  }, [buildingId]);

  useEffect(() => {
    render();
  }, [regions, images]);

  function render() {
    if (!canvasRef.current || !images) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;

    // 1️⃣ Clear + base image (NEVER MASK THIS)
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(images.cleaned, 0, 0);

    // 2️⃣ Draw each region color as overlay
    regions.forEach((region) => {
      if (!region.color) return;
      drawRegionColor(ctx, region.mask, region.color);
    });
  }

  function drawRegionColor(
    mainCtx: CanvasRenderingContext2D,
    mask: HTMLCanvasElement,
    color: string,
  ) {
    const buffer = paintBufferRef.current;
    const { width, height } = mainCtx.canvas;

    buffer.width = width;
    buffer.height = height;

    const bctx = buffer.getContext("2d")!;
    bctx.imageSmoothingEnabled = false;

    bctx.clearRect(0, 0, width, height);

    bctx.fillStyle = color;
    bctx.fillRect(0, 0, width, height);

    bctx.globalCompositeOperation = "destination-in";
    bctx.drawImage(mask, 0, 0);

    bctx.globalCompositeOperation = "source-over";

    mainCtx.drawImage(buffer, 0, 0);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    setRegions((prev) =>
      prev.map((region) => {
        const data = region.mask
          .getContext("2d")!
          .getImageData(x, y, 1, 1).data;

        return data[3] > 0 ? { ...region, color } : region;
      }),
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        width: "100%",
        cursor: "pointer",
        display: "block",
      }}
    />
  );
}
