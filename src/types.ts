export interface ImageFile {
  name: string;
  url: string;
  processed: boolean;
}

export type CropOrientation = 'portrait' | 'landscape';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
