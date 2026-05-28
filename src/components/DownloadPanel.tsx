import { useState, useRef, memo } from 'react';
import type { ImageFile, ConversionProgress, CropRect, OrientationMode } from '../types';
import { processImage } from '../utils/processImage';

interface DownloadPanelProps {
  images: ImageFile[];
}

export default memo(function DownloadPanel({ images }: DownloadPanelProps) {
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [converting, setConverting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const validImages = images;

  function computeDefaultCropRect(naturalW: number, naturalH: number, orientation: OrientationMode): CropRect {
    const aspectRatio = orientation === 'portrait' ? 3 / 5 : 5 / 3;
    let cropW: number, cropH: number;
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

  const handleDownloadAll = async () => {
    if (validImages.length === 0) return;
    setConverting(true);
    abortRef.current = new AbortController();

    setProgress({ current: 0, total: validImages.length, message: 'Processing images\u2026' });

    try {
      const JSZipMod = await import('jszip');
      const JSZip = JSZipMod.default;
      const zip = new JSZip();
      const nameCount: Record<string, number> = {};

      for (let i = 0; i < validImages.length; i++) {
        if (abortRef.current?.signal.aborted) break;
        const img = validImages[i];

        setProgress({ current: i, total: validImages.length, message: `Processing ${img.name}\u2026` });

        const el = await new Promise<HTMLImageElement>((resolve, reject) => {
          const imageEl = new Image();
          imageEl.onload = () => resolve(imageEl);
          imageEl.onerror = () => reject(new Error(`Failed to load ${img.name}`));
          imageEl.src = img.url;
        });

        if (abortRef.current?.signal.aborted) break;

        const hasCropRect = img.cropRect && img.cropRect.width > 0 && img.cropRect.height > 0;

        const orientation = hasCropRect
          ? img.orientation
          : (el.naturalWidth > el.naturalHeight ? 'landscape' : 'portrait') as OrientationMode;

        const cropRect = hasCropRect
          ? img.cropRect!
          : computeDefaultCropRect(el.naturalWidth, el.naturalHeight, orientation);

        const displayW = hasCropRect && img.displayW ? img.displayW : el.naturalWidth;
        const displayH = hasCropRect && img.displayH ? img.displayH : el.naturalHeight;

        const result = await processImage(
          el,
          cropRect,
          displayW,
          displayH,
          orientation,
          img.dither
        );

        const baseName = img.name.replace(/\.[^.]+$/, '');
        const key = `${baseName}_${orientation}`;
        nameCount[key] = (nameCount[key] || 0) + 1;
        const suffix = nameCount[key] > 1 ? `_${nameCount[key]}` : '';
        const fileName = `${baseName}_${orientation}${suffix}.bmp`;

        zip.file(fileName, result.blob);
        setProgress({ current: i + 1, total: validImages.length, message: `Processed ${img.name}` });
      }

      if (!abortRef.current?.signal.aborted) {
        setProgress({ current: validImages.length, total: validImages.length, message: 'Creating ZIP\u2026' });
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (md) => {
          setProgress({ current: Math.round(md.percent), total: 100, message: 'Compressing ZIP\u2026' });
        });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.download = 'images.zip';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setProgress({ current: 0, total: 0, message: 'Done!' });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setProgress({ current: 0, total: 0, message: 'Cancelled' });
      } else {
        console.error('Download failed:', err);
        setProgress({ current: 0, total: 0, message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` });
      }
    } finally {
      setConverting(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="batch-panel">
      {progress && progress.message && (
        <div className="batch-progress" aria-live="polite">
          <div className="progress-text">
            {progress.total > 0 ? (
              <>{progress.current}/{progress.total}: {progress.message}</>
            ) : (
              <>{progress.message}</>
            )}
          </div>
          {progress.total > 0 && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
      <div className="batch-actions">
        {converting ? (
          <button className="btn btn-danger btn-lg" onClick={handleCancel}>
            Cancel
          </button>
        ) : (
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDownloadAll}
            disabled={validImages.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 11V4M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 10v1.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Download All ({validImages.length} image{validImages.length !== 1 ? 's' : ''})
          </button>
        )}
      </div>
    </div>
  );
});
