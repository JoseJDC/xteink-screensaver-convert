import { useRef, useState, useEffect, useCallback, memo } from 'react';
import type { CropRect, ImageFile, OrientationMode } from '../types';
import type { DitherAlgorithm } from '../utils/dither';
import { applyDither } from '../utils/dither';
import CropOverlay from './CropOverlay';
import Toolbar from './Toolbar';

interface ImageEditorProps {
  image: ImageFile;
  dither: DitherAlgorithm;
  contrast: number;
  spoilerBlur: boolean;
  imageCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onAddToBatch: (cropRect: CropRect, displayW: number, displayH: number) => void;
  onSpoilerBlurChange: (blur: boolean) => void;
  onOrientationChange: (orientation: OrientationMode) => void;
  onRotationChange: (rotation: 0 | 90 | 180 | 270) => void;
}

function toGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
}

function applyContrast(data: Uint8ClampedArray, level: number): void {
  if (level === 0) return;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  if (range < 5) return;
  const factor = 1 + level * 0.15;
  const mid = (min + max) / 2;
  const halfRange = (range / 2) * factor;
  const newMin = Math.max(0, Math.round(mid - halfRange));
  const newMax = Math.min(255, Math.round(mid + halfRange));
  const newRange = newMax - newMin;
  if (newRange < 1) return;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i];
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, Math.round(((v - newMin) / newRange) * 255)));
  }
}

function getRotatedImage(img: HTMLImageElement, rotation: 0 | 90 | 180 | 270): HTMLCanvasElement {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const sideways = rotation === 90 || rotation === 270;
  const c = document.createElement('canvas');
  c.width = sideways ? srcH : srcW;
  c.height = sideways ? srcW : srcH;
  if (rotation === 0) {
    c.getContext('2d')!.drawImage(img, 0, 0);
  } else {
    const ctx = c.getContext('2d')!;
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(img, -srcW / 2, -srcH / 2);
    ctx.restore();
  }
  return c;
}

export default memo(function ImageEditor({
  image,
  dither,
  contrast,
  spoilerBlur,
  imageCount,
  currentIndex,
  onNext,
  onPrev,
  onAddToBatch,
  onSpoilerBlurChange,
  onOrientationChange,
  onRotationChange,
}: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawTimerRef = useRef(0);
  const rotatedCacheRef = useRef<{ rotation: number; canvas: HTMLCanvasElement } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [added, setAdded] = useState(false);

  const rotation = image?.rotation ?? 0;
  const isRotated = rotation !== 0;
  const sideways = rotation === 90 || rotation === 270;

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.complete) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight - 60;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const effW = sideways ? natH : natW;
    const effH = sideways ? natW : natH;
    const ratio = effW / effH;

    let displayW: number;
    let displayH: number;

    if (ratio > maxW / maxH) {
      displayW = maxW;
      displayH = maxW / ratio;
    } else {
      displayH = maxH;
      displayW = maxH * ratio;
    }

    setDisplaySize({ w: Math.floor(displayW), h: Math.floor(displayH) });
    setImgLoaded(true);
  }, [sideways]);

  const drawCanvas = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !img.complete) return;

    const w = displaySize.w;
    const h = displaySize.h;
    if (w <= 0 || h <= 0) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const rotated = getRotatedImage(img, rotation);
    ctx.drawImage(rotated, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    toGrayscale(imageData.data);
    applyContrast(imageData.data, contrast);
    if (dither !== 'none') {
      applyDither(imageData, dither);
    }
    ctx.putImageData(imageData, 0, 0);
  }, [displaySize.w, displaySize.h, rotation, dither, contrast]);

  useEffect(() => {
    setImgLoaded(false);
    setAdded(false);
    setCropRect({ x: 0, y: 0, width: 0, height: 0 });
    rotatedCacheRef.current = null;
  }, [image?.url]);

  useEffect(() => {
    rotatedCacheRef.current = null;
  }, [rotation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateSize]);

  useEffect(() => {
    clearTimeout(drawTimerRef.current);
    if (!imgLoaded || displaySize.w <= 0) return;
    drawTimerRef.current = window.setTimeout(drawCanvas, 80);
    return () => clearTimeout(drawTimerRef.current);
  }, [imgLoaded, displaySize.w, displaySize.h, rotation, dither, contrast, drawCanvas]);

  const handleImageLoad = () => {
    updateSize();
  };

  const handleAddToBatch = () => {
    if (!cropRect.width || !cropRect.height) return;
    onAddToBatch(cropRect, displaySize.w, displaySize.h);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="image-editor" ref={containerRef}>
      <div className="image-canvas-wrapper">
        <div
          className="image-stage"
          style={{
            position: 'relative',
            width: displaySize.w || 0,
            height: displaySize.h || 0,
          }}
        >
          <img
            ref={imgRef}
            src={image?.url}
            alt={image?.name}
            className="image-loader-hidden"
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            className="image-canvas-display"
            style={{
              visibility: imgLoaded && displaySize.w > 0 ? 'visible' : 'hidden',
            }}
          />
          {imgLoaded && displaySize.w > 0 && (
            <CropOverlay
              containerWidth={displaySize.w}
              containerHeight={displaySize.h}
              orientation={image.orientation}
              onCropChange={setCropRect}
            />
          )}
        </div>
        {!imgLoaded && (
          <div className="image-loading">
            <div className="spinner" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {imgLoaded && (
        <Toolbar
          currentIndex={currentIndex}
          imageCount={imageCount}
          onPrev={onPrev}
          onNext={onNext}
          onAddToBatch={handleAddToBatch}
          canAdd={!!cropRect.width && !!cropRect.height}
          orientation={image.orientation}
          spoilerBlur={spoilerBlur}
          isRotated={isRotated}
          onOrientationChange={onOrientationChange}
          onSpoilerBlurChange={onSpoilerBlurChange}
          onRotationChange={onRotationChange}
        />
      )}

      {added && (
        <div className="added-toast">Added to batch!</div>
      )}
    </div>
  );
});
