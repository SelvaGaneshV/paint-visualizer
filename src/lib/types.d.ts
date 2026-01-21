export interface BuildingImageSet {
  id: string;
  original: string;
  cleaned: string;
  normals: string;
  edge: string;
}

export interface UploadedImages {
  cleaned: File | null;
  edge: File | null;
  normals: File | null;
  original: File | null;
}

export interface LoadedBuildingImages {
  original: HTMLImageElement;
  cleaned: HTMLImageElement;
  normals: HTMLImageElement;
  edge: HTMLImageElement;
}

export interface Region {
  id: number;
  mask: HTMLCanvasElement;
  color: string | null;
}

export type MaskCanvas = HTMLCanvasElement;
