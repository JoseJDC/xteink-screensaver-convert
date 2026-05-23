import { useRef, useState, useEffect, useCallback } from 'react';
import type { CropOrientation, CropRect, ImageFile } from '../types';
import type { DitherAlgorithm } from '../utils/dither';
import { applyDither } from '../utils/dither';
import CropOverlay from './CropOverlay';
import Toolbar from './Toolbar';

interface ImageEditorProps {
  image: ImageFile | null;
  orientation: CropOrientation;
  dither: DitherAlgorithm;
  imageCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onAddToBatch: (cropRect: CropRect, displayW: number, displayH: number) => void;
}

export default function ImageEditor({
  image,
  orientation,
  dither,
  imageCount,
  currentIndex,
  onNext,
  onPrev,
  onAddToBatch,
}: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawTimerRef = useRef(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [added, setAdded] = useState(false);

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

    ctx.filter = 'none';
    ctx.drawImage(img, 0, 0, w, h);

    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';

    if (dither !== 'none') {
      const imageData = ctx.getImageData(0, 0, w, h);
      const dithered = applyDither(imageData, dither);
      ctx.putImageData(dithered, 0, 0);
    }
  }, [displaySize.w, displaySize.h, dither]);

  useEffect(() => {
    setImgLoaded(false);
    setAdded(false);
    setCropRect({ x: 0, y: 0, width: 0, height: 0 });
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
  }, [imgLoaded, displaySize.w, displaySize.h, dither, drawCanvas]);

  const handleImageLoad = () => {
    updateSize();
  };

  const handleAddToBatch = () => {
    if (!cropRect.width || !cropRect.height) return;
    onAddToBatch(cropRect, displaySize.w, displaySize.h);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  if (!image) {
    return (
      <div className="image-editor empty">
        <p>Load a directory to start editing</p>
      </div>
    );
  }

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
            src={image.url}
            alt={image.name}
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
              orientation={orientation}
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

      <Toolbar
        currentIndex={currentIndex}
        imageCount={imageCount}
        onPrev={onPrev}
        onNext={onNext}
        onAddToBatch={handleAddToBatch}
        canAdd={!!cropRect.width && !!cropRect.height}
      />

      {added && (
        <div className="added-toast">Added to batch!</div>
      )}
    </div>
  );
}
