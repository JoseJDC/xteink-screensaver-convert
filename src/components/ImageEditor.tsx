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
  imageCount: number;
  currentIndex: number;
  initialCropRect?: CropRect | null;
  onNext: () => void;
  onPrev: () => void;
  onCropRectUpdate: (rect: CropRect, displayW: number, displayH: number) => void;
  onOrientationUpdate?: (orientation: OrientationMode) => void;
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

export default memo(function ImageEditor({
  image,
  dither,
  contrast,
  imageCount,
  currentIndex,
  initialCropRect,
  onNext,
  onPrev,
  onCropRectUpdate,
  onOrientationUpdate,
}: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawTimerRef = useRef(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [editorOrientation, setEditorOrientation] = useState<OrientationMode>('portrait');

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.complete) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight - 60;

    const ratio = img.naturalWidth / img.naturalHeight;

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
  }, []);

  const handleCropChange = useCallback((rect: CropRect) => {
    if (displaySize.w > 0 && displaySize.h > 0) {
      onCropRectUpdate(rect, displaySize.w, displaySize.h);
    }
  }, [onCropRectUpdate, displaySize.w, displaySize.h]);

  const handleOrientationChange = useCallback((orientation: OrientationMode) => {
    setEditorOrientation(orientation);
    onOrientationUpdate?.(orientation);
  }, [onOrientationUpdate]);

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

    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    toGrayscale(imageData.data);
    applyContrast(imageData.data, contrast);
    if (dither !== 'none') {
      applyDither(imageData, dither);
    }
    ctx.putImageData(imageData, 0, 0);
  }, [displaySize.w, displaySize.h, dither, contrast]);

  useEffect(() => {
    setImgLoaded(false);
    if (image?.orientation) {
      setEditorOrientation(image.orientation);
    }
  }, [image?.url]);

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
  }, [imgLoaded, displaySize.w, displaySize.h, dither, contrast, drawCanvas]);

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (img) {
      if (!initialCropRect) {
        const detected = img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait';
        setEditorOrientation(detected);
        onOrientationUpdate?.(detected);
      }
    }
    updateSize();
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
              orientation={editorOrientation}
              imageKey={image?.url}
              onCropChange={handleCropChange}
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
          orientation={editorOrientation}
          onOrientationChange={handleOrientationChange}
        />
      )}

    </div>
  );
});
