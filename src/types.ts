import type { DitherAlgorithm } from './utils/dither';

export type { DitherAlgorithm } from './utils/dither';

export type OrientationMode = 'portrait' | 'landscape';

export interface ImageFile {
  name: string;
  url: string;
  processed: boolean;
  orientation: OrientationMode;
  source?: string;
}

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
  orientation: OrientationMode;
  dither: DitherAlgorithm;
}

export interface ConversionProgress {
  current: number;
  total: number;
  message: string;
}
