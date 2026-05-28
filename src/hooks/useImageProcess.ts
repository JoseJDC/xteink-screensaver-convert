import { useRef, useCallback } from 'react';
import type { CropRect, OrientationMode } from '../types';

interface ProcessResult {
  dataUrl: string;
  blob: Blob;
}

export function useImageProcess() {
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const getCanvas = useCallback((): HTMLCanvasElement => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    return offscreenRef.current;
  }, []);

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  const processImage = useCallback(
    async (
      imageUrl: string,
      displayWidth: number,
      displayHeight: number,
      cropRect: CropRect,
      orientation: OrientationMode
    ): Promise<ProcessResult> => {
      const img = await loadImage(imageUrl);

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

      const cropX = srcCropX + offsetX;
      const cropY = srcCropY + offsetY;

      const canvas = getCanvas();
      const ctx = canvas.getContext('2d')!;

      canvas.width = finalCropW;
      canvas.height = finalCropH;

      ctx.filter = 'none';
      ctx.drawImage(
        img,
        cropX, cropY, finalCropW, finalCropH,
        0, 0, finalCropW, finalCropH
      );

      ctx.filter = 'grayscale(100%)';
      ctx.drawImage(canvas, 0, 0);

      ctx.filter = 'none';

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = orientation === 'portrait' ? 480 : 800;
      outputCanvas.height = orientation === 'portrait' ? 800 : 480;
      const outCtx = outputCanvas.getContext('2d')!;
      outCtx.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.92);
      });

      const dataUrl = outputCanvas.toDataURL('image/jpeg', 0.92);

      return { dataUrl, blob };
    },
    [getCanvas, loadImage]
  );

  return { processImage };
}
