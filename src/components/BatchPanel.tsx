import { useState, useRef, memo } from 'react';
import type { BatchItem, ConversionProgress } from '../types';
import { processImage } from '../utils/processImage';

interface BatchPanelProps {
  items: BatchItem[];
  onRemove: (id: string) => void;
}

export default memo(function BatchPanel({ items, onRemove }: BatchPanelProps) {
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [converting, setConverting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleDownloadAll = async () => {
    if (items.length === 0) return;
    setConverting(true);
    abortRef.current = new AbortController();

    setProgress({ current: 0, total: items.length, message: 'Processing images\u2026' });

    try {
      const JSZipMod = await import('jszip');
      const JSZip = JSZipMod.default;
      const zip = new JSZip();
      const nameCount: Record<string, number> = {};

      for (let i = 0; i < items.length; i++) {
        if (abortRef.current?.signal.aborted) break;
        const item = items[i];

        setProgress({ current: i, total: items.length, message: `Processing ${item.imageName}\u2026` });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error(`Failed to load ${item.imageName}`));
          el.src = item.imageUrl;
        });

        if (abortRef.current?.signal.aborted) break;

        const result = await processImage(
          img,
          item.cropRect,
          item.displayWidth,
          item.displayHeight,
          item.orientation,
          item.dither
        );

        const baseName = item.imageName.replace(/\.[^.]+$/, '');
        const key = `${baseName}_${item.orientation}`;
        nameCount[key] = (nameCount[key] || 0) + 1;
        const suffix = nameCount[key] > 1 ? `_${nameCount[key]}` : '';
        const fileName = `${baseName}_${item.orientation}${suffix}.bmp`;

        zip.file(fileName, result.blob);
        setProgress({ current: i + 1, total: items.length, message: `Processed ${item.imageName}` });
      }

      if (!abortRef.current?.signal.aborted) {
        setProgress({ current: items.length, total: items.length, message: 'Creating ZIP\u2026' });
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (md) => {
          setProgress({ current: Math.round(md.percent), total: 100, message: 'Compressing ZIP\u2026' });
        });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.download = 'batch_processed.zip';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setProgress({ current: 0, total: 0, message: 'Done!' });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setProgress({ current: 0, total: 0, message: 'Cancelled' });
      } else {
        console.error('Batch processing failed:', err);
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
      {items.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>
                {item.imageName}
              </span>
              <button
                onClick={() => onRemove(item.id)}
                disabled={converting}
                className="config-preset-del"
                aria-label={`Remove ${item.imageName}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

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
            disabled={items.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 11V4M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 10v1.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Download ZIP ({items.length} image{items.length !== 1 ? 's' : ''})
          </button>
        )}
      </div>
    </div>
  );
});
