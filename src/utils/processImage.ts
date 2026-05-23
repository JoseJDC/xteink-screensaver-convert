import type { CropOrientation, CropRect } from '../types';
import { canvasToBMP } from './bmp';
import { applyDither } from './dither';
import type { DitherAlgorithm } from './dither';

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
  orientation: CropOrientation,
  ditherAlgorithm: DitherAlgorithm
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

  if (ditherAlgorithm !== 'none') {
    const imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
    const dithered = applyDither(imageData, ditherAlgorithm);
    cropCtx.putImageData(dithered, 0, 0);
  }

  const outputW = 480;
  const outputH = 800;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;
  const outCtx = outputCanvas.getContext('2d')!;

  if (orientation === 'portrait') {
    outCtx.drawImage(cropCanvas, 0, 0, outputW, outputH);
  } else {
    const rotated = document.createElement('canvas');
    rotated.width = cropCanvas.height;
    rotated.height = cropCanvas.width;
    const rotCtx = rotated.getContext('2d')!;

    rotCtx.save();
    rotCtx.translate(rotated.width / 2, rotated.height / 2);
    rotCtx.rotate(Math.PI / 2);
    rotCtx.drawImage(cropCanvas, -cropCanvas.width / 2, -cropCanvas.height / 2);
    rotCtx.restore();

    outCtx.drawImage(rotated, 0, 0, outputW, outputH);
  }

  const blob = canvasToBMP(outputCanvas);

  return { blob, name: '', width: outputW, height: outputH };
}
