import type { CropRect, OrientationMode } from '../types';

export function getAspectRatio(orientation: OrientationMode): number {
  return orientation === 'portrait' ? 3 / 5 : 5 / 3;
}

export function computeDefaultCropRectNatural(
  naturalW: number,
  naturalH: number,
  orientation: OrientationMode
): CropRect {
  const aspectRatio = getAspectRatio(orientation);
  let cropW: number;
  let cropH: number;

  if (naturalW / naturalH > aspectRatio) {
    cropH = naturalH;
    cropW = cropH * aspectRatio;
  } else {
    cropW = naturalW;
    cropH = cropW / aspectRatio;
  }

  return {
    x: Math.round((naturalW - cropW) / 2),
    y: Math.round((naturalH - cropH) / 2),
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

export function computeDefaultCropRectDisplay(
  containerW: number,
  containerH: number,
  orientation: OrientationMode
): CropRect {
  const aspectRatio = getAspectRatio(orientation);
  let cropW: number;
  let cropH: number;

  if (containerW / containerH > aspectRatio) {
    cropH = containerH;
    cropW = cropH * aspectRatio;
    if (cropW > containerW) {
      cropW = containerW;
      cropH = cropW / aspectRatio;
    }
  } else {
    cropW = containerW;
    cropH = cropW / aspectRatio;
    if (cropH > containerH) {
      cropH = containerH;
      cropW = cropH * aspectRatio;
    }
  }

  const x = Math.round(Math.max(0, (containerW - cropW) / 2));
  const y = Math.round(Math.max(0, (containerH - cropH) / 2));

  return { x, y, width: Math.round(cropW), height: Math.round(cropH) };
}
