import type { CropOrientation, CropRect } from '../types';
import { canvasToBMP } from './bmp';

export interface ProcessedResult {
  blob: Blob;
  name: string;
  width: number;
  height: number;
}

export async function processImage(
  img: HTMLImageElement,
  cropRect: CropRect,
  displayWidth: number,
  displayHeight: number,
  orientation: CropOrientation
): Promise<ProcessedResult> {
  const scaleX = img.naturalWidth / displayWidth;
  const scaleY = img.naturalHeight / displayHeight;

  const srcCropX = Math.round(cropRect.x * scaleX);
  const srcCropY = Math.round(cropRect.y * scaleY);
  const srcCropW = Math.round(cropRect.width * scaleX);
  const srcCropH = Math.round(cropRect.height * scaleY);

  const aspectRatio = orientation === 'portrait' ? 3 / 5 : 5 / 3;
  let finalCropW: number;
  let finalCropH: number;

  if (srcCropW / srcCropH > aspectRatio) {
    finalCropH = srcCropH;
    finalCropW = Math.round(srcCropH * aspectRatio);
  } else {
    finalCropW = srcCropW;
    finalCropH = Math.round(srcCropW / aspectRatio);
  }

  const offsetX = Math.round((srcCropW - finalCropW) / 2);
  const offsetY = Math.round((srcCropH - finalCropH) / 2);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = finalCropW;
  cropCanvas.height = finalCropH;
  const cropCtx = cropCanvas.getContext('2d')!;

  cropCtx.filter = 'none';
  cropCtx.drawImage(
    img,
    srcCropX + offsetX,
    srcCropY + offsetY,
    finalCropW,
    finalCropH,
    0,
    0,
    finalCropW,
    finalCropH
  );

  cropCtx.filter = 'grayscale(100%)';
  cropCtx.drawImage(cropCanvas, 0, 0);
  cropCtx.filter = 'none';

  const outputW = orientation === 'portrait' ? 480 : 800;
  const outputH = orientation === 'portrait' ? 800 : 480;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;
  const outCtx = outputCanvas.getContext('2d')!;
  outCtx.drawImage(cropCanvas, 0, 0, outputW, outputH);

  const blob = canvasToBMP(outputCanvas);

  return { blob, name: '', width: outputW, height: outputH };
}
