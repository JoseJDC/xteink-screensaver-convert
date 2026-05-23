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

export interface BatchItem {
  id: string;
  imageUrl: string;
  imageName: string;
  cropRect: CropRect;
  displayWidth: number;
  displayHeight: number;
  orientation: CropOrientation;
}
