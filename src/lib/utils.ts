import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((res, rej) => {
    console.log(src);
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
    img.onerror = (e) => rej(e);
  });
};

export const getImageDataFromImage = (img: HTMLImageElement, width: number, height: number) => {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;

  const ctx = c.getContext("2d", {
    willReadFrequently: true,
  })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
};

export const isDark = (r: number, g: number, b: number, threshold: number = 128) => {
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < threshold;
};

export const hexToRgb = (hex: string) => {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
};
