import { useRef, useState, useCallback, useEffect } from 'react';
import type { CropRect, CropOrientation } from '../types';

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  orientation: CropOrientation;
  onCropChange: (rect: CropRect) => void;
}

const MIN_SIZE = 60;

export default function CropOverlay({
  containerWidth,
  containerHeight,
  orientation,
  onCropChange,
}: CropOverlayProps) {
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startRectX: number; startRectY: number } | null>(null);

  const aspectRatio = orientation === 'portrait' ? 4 / 5 : 5 / 4;
  const ratioLabel = orientation === 'portrait' ? '4:5' : '5:4';

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const computeRect = useCallback(
    (w: number, h: number): CropRect => {
      if (w <= 0 || h <= 0) return { x: 0, y: 0, width: 0, height: 0 };

      let cropW: number;
      let cropH: number;

      if (w / h > aspectRatio) {
        cropH = clamp(h * 0.75, MIN_SIZE, h);
        cropW = cropH * aspectRatio;
        if (cropW > w) {
          cropW = w;
          cropH = cropW / aspectRatio;
        }
      } else {
        cropW = clamp(w * 0.75, MIN_SIZE, w);
        cropH = cropW / aspectRatio;
        if (cropH > h) {
          cropH = h;
          cropW = cropH * aspectRatio;
        }
      }

      const x = clamp((w - cropW) / 2, 0, w - cropW);
      const y = clamp((h - cropH) / 2, 0, h - cropH);

      return { x, y, width: cropW, height: cropH };
    },
    [aspectRatio]
  );

  useEffect(() => {
    const newRect = computeRect(containerWidth, containerHeight);
    setRect(newRect);
    onCropChange(newRect);
  }, [containerWidth, containerHeight, computeRect, onCropChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRectX: rect.x,
      startRectY: rect.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const newX = clamp(
      dragRef.current.startRectX + dx,
      0,
      containerWidth - rect.width
    );
    const newY = clamp(
      dragRef.current.startRectY + dy,
      0,
      containerHeight - rect.height
    );

    const updated = { ...rect, x: newX, y: newY };
    setRect(updated);
    onCropChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <div
      className="crop-overlay-container"
      style={{ width: containerWidth, height: containerHeight }}
    >
      <div
        className="crop-rectangle"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="crop-ratio-label">{ratioLabel}</div>
      </div>
    </div>
  );
}
