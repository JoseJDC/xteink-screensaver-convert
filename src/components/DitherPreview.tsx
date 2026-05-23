import { useRef, useEffect } from 'react';
import type { CropOrientation, CropRect } from '../types';
import type { DitherAlgorithm } from '../utils/dither';
import { applyDither } from '../utils/dither';

interface DitherPreviewProps {
  imageUrl: string;
  cropRect: CropRect;
  displayWidth: number;
  displayHeight: number;
  orientation: CropOrientation;
  dither: DitherAlgorithm;
}

const PREVIEW_SIZE = 140;

export default function DitherPreview({
  imageUrl,
  cropRect,
  displayWidth,
  displayHeight,
  orientation,
  dither,
}: DitherPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef(0);

  useEffect(() => {
    if (dither === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      renderPreview(canvas, imageUrl, cropRect, displayWidth, displayHeight, orientation, dither);
    }, 250);

    return () => clearTimeout(timerRef.current);
  }, [imageUrl, cropRect, displayWidth, displayHeight, orientation, dither]);

  if (dither === 'none') return null;

  return (
    <div className="dither-preview">
      <div className="dither-preview-label">{ditherLabel(dither)}</div>
      <canvas ref={canvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} />
    </div>
  );
}

function ditherLabel(algo: DitherAlgorithm): string {
  switch (algo) {
    case 'floyd-steinberg': return 'Floyd–Steinberg';
    case 'atkinson': return 'Atkinson';
    case 'bayer4x4': return 'Bayer 4×4';
    case 'bayer8x8': return 'Bayer 8×8';
    default: return '';
  }
}

async function renderPreview(
  canvas: HTMLCanvasElement,
  url: string,
  cropRect: CropRect,
  displayW: number,
  displayH: number,
  orientation: CropOrientation,
  dither: DitherAlgorithm
) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Preview load failed'));
    el.src = url;
  });

  const scaleX = img.naturalWidth / displayW;
  const scaleY = img.naturalHeight / displayH;

  const srcX = Math.round(cropRect.x * scaleX);
  const srcY = Math.round(cropRect.y * scaleY);
  const srcW = Math.round(cropRect.width * scaleX);
  const srcH = Math.round(cropRect.height * scaleY);

  const aspectRatio = orientation === 'portrait' ? 3 / 5 : 5 / 3;
  let finalW: number;
  let finalH: number;

  if (srcW / srcH > aspectRatio) {
    finalH = srcH;
    finalW = Math.round(srcH * aspectRatio);
  } else {
    finalW = srcW;
    finalH = Math.round(srcW / aspectRatio);
  }

  const ox = Math.round((srcW - finalW) / 2);
  const oy = Math.round((srcH - finalH) / 2);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = finalW;
  cropCanvas.height = finalH;
  const ctx = cropCanvas.getContext('2d')!;

  ctx.drawImage(img, srcX + ox, srcY + oy, finalW, finalH, 0, 0, finalW, finalH);
  ctx.filter = 'grayscale(100%)';
  ctx.drawImage(cropCanvas, 0, 0);
  ctx.filter = 'none';

  const imageData = ctx.getImageData(0, 0, finalW, finalH);
  const dithered = applyDither(imageData, dither);
  ctx.putImageData(dithered, 0, 0);

  const size = Math.min(PREVIEW_SIZE / finalW, PREVIEW_SIZE / finalH);
  const outW = Math.round(finalW * size);
  const outH = Math.round(finalH * size);

  canvas.width = PREVIEW_SIZE;
  canvas.height = PREVIEW_SIZE;
  const outCtx = canvas.getContext('2d')!;
  outCtx.fillStyle = '#1a1a2e';
  outCtx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  outCtx.drawImage(
    cropCanvas,
    Math.round((PREVIEW_SIZE - outW) / 2),
    Math.round((PREVIEW_SIZE - outH) / 2),
    outW,
    outH
  );
}
