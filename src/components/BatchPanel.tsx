import { useState } from 'react';
import type { BatchItem } from '../types';
import { processImage } from '../utils/processImage';

interface BatchPanelProps {
  items: BatchItem[];
  onRemove: (id: string) => void;
}

export default function BatchPanel({ items, onRemove }: BatchPanelProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownloadAll = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    setProgress(0);

    try {
      const JSZipMod = await import('jszip');
      const JSZip = JSZipMod.default;
      const zip = new JSZip();
      const nameCount: Record<string, number> = {};

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error(`Failed to load ${item.imageName}`));
          el.src = item.imageUrl;
        });

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
        setProgress(i + 1);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = 'batch_processed.zip';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Batch processing failed:', err);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="batch-panel">
      <div className="batch-header">
        <span>Batch ({items.length})</span>
      </div>
      <div className="batch-list">
        {items.length === 0 && (
          <div className="batch-empty">No items. Add crops from the editor.</div>
        )}
        {items.map((item) => (
          <div key={item.id} className="batch-item">
            <div className="batch-item-thumb">
              <img src={item.imageUrl} alt={item.imageName} />
            </div>
            <div className="batch-item-info">
              <div className="batch-item-name">{item.imageName}</div>
              <div className="batch-item-meta">
                {item.orientation === 'portrait' ? '3:5 Portrait' : '5:3 Landscape'}
              </div>
            </div>
            <button
              className="batch-item-remove"
              onClick={() => onRemove(item.id)}
              disabled={processing}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="batch-footer">
          {processing && (
            <div className="batch-progress">
              <progress value={progress} max={items.length} />
              <span>{progress}/{items.length}</span>
            </div>
          )}
          <button
            className="btn-download-all"
            onClick={handleDownloadAll}
            disabled={processing || items.length === 0}
          >
            {processing ? 'Processing...' : `Download All (${items.length}) as ZIP`}
          </button>
        </div>
      )}
    </div>
  );
}
