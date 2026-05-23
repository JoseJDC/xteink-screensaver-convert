import { useRef, useState, useEffect, useCallback } from 'react';
import type { CropOrientation, CropRect, ImageFile } from '../types';
import CropOverlay from './CropOverlay';
import Toolbar from './Toolbar';
import ResultPreview from './ResultPreview';
import { canvasToBMP } from '../utils/bmp';

interface ImageEditorProps {
  image: ImageFile | null;
  orientation: CropOrientation;
  imageCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onMarkProcessed: () => void;
}

export default function ImageEditor({
  image,
  orientation,
  imageCount,
  currentIndex,
  onNext,
  onPrev,
  onMarkProcessed,
}: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [bmpBlobUrl, setBmpBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    setImgLoaded(false);
    setResultUrl(null);
    setBmpBlobUrl(null);
    setError('');
    setCropRect({ x: 0, y: 0, width: 0, height: 0 });
  }, [image?.url]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updateSize]);

  const handleImageLoad = () => {
    updateSize();
  };

  const handleProcess = async () => {
    if (!image || !cropRect.width || !cropRect.height) return;
    setProcessing(true);
    setError('');

    try {
      const img = imgRef.current;
      if (!img) throw new Error('Image not loaded');

      const scaleX = img.naturalWidth / displaySize.w;
      const scaleY = img.naturalHeight / displaySize.h;

      const srcCropX = Math.round(cropRect.x * scaleX);
      const srcCropY = Math.round(cropRect.y * scaleY);
      const srcCropW = Math.round(cropRect.width * scaleX);
      const srcCropH = Math.round(cropRect.height * scaleY);

      const aspectRatio = orientation === 'portrait' ? 4 / 5 : 5 / 4;
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

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = 480;
      outputCanvas.height = 800;
      const outCtx = outputCanvas.getContext('2d')!;
      outCtx.drawImage(cropCanvas, 0, 0, 480, 800);

      const previewUrl = outputCanvas.toDataURL('image/jpeg', 0.92);
      const bmpBlob = canvasToBMP(outputCanvas);
      const bmpUrl = URL.createObjectURL(bmpBlob);

      setResultUrl(previewUrl);
      setBmpBlobUrl(bmpUrl);
      onMarkProcessed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleClosePreview = () => {
    if (bmpBlobUrl) URL.revokeObjectURL(bmpBlobUrl);
    setResultUrl(null);
    setBmpBlobUrl(null);
    onNext();
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
            className="image-main"
            style={{
              width: displaySize.w || 'auto',
              height: displaySize.h || 'auto',
              display: imgLoaded ? 'block' : 'none',
            }}
            onLoad={handleImageLoad}
            draggable={false}
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

      {error && <div className="error-msg">{error}</div>}

      <Toolbar
        orientation={orientation}
        currentIndex={currentIndex}
        imageCount={imageCount}
        onPrev={onPrev}
        onNext={onNext}
        onProcess={handleProcess}
        processing={processing}
        canProcess={!!cropRect.width && !!cropRect.height}
      />

      {resultUrl && (
        <ResultPreview
          dataUrl={resultUrl}
          bmpUrl={bmpBlobUrl}
          imageName={image.name}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
