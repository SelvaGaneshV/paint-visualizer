import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BuildingImageSet, LoadedBuildingImages } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

export function createCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export async function loadBuildingSet(
  set: BuildingImageSet,
): Promise<LoadedBuildingImages> {
  const [original, cleaned, normals, edge] = await Promise.all([
    loadImage(set.original),
    loadImage(set.cleaned),
    loadImage(set.normals),
    loadImage(set.edge),
  ]);

  return { original, cleaned, normals, edge };
}

export function getCanvasCoordinates(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: Math.floor((e.clientX - rect.left) * scaleX),
    y: Math.floor((e.clientY - rect.top) * scaleY),
  };
}
