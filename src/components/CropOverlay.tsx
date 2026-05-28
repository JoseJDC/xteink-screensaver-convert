import { useRef, useState, useCallback, useEffect } from 'react';
import type { CropRect, OrientationMode } from '../types';

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  orientation: OrientationMode;
  onCropChange: (rect: CropRect) => void;
}

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type Interaction =
  | { type: 'drag'; startX: number; startY: number; startRectX: number; startRectY: number }
  | { type: 'resize'; handle: HandleId; startX: number; startY: number; startRect: CropRect }
  | null;

const MIN_SIZE = 60;
const HANDLE_OFFSET = 6;

interface HandleDef {
  id: HandleId;
  style: React.CSSProperties;
  cursor: string;
}

const HANDLES: readonly HandleDef[] = [
  { id: 'nw', style: { top: -HANDLE_OFFSET, left: -HANDLE_OFFSET }, cursor: 'nwse-resize' },
  { id: 'n', style: { top: -HANDLE_OFFSET, left: '50%', marginLeft: -HANDLE_OFFSET }, cursor: 'ns-resize' },
  { id: 'ne', style: { top: -HANDLE_OFFSET, right: -HANDLE_OFFSET }, cursor: 'nesw-resize' },
  { id: 'e', style: { top: '50%', right: -HANDLE_OFFSET, marginTop: -HANDLE_OFFSET }, cursor: 'ew-resize' },
  { id: 'se', style: { bottom: -HANDLE_OFFSET, right: -HANDLE_OFFSET }, cursor: 'nwse-resize' },
  { id: 's', style: { bottom: -HANDLE_OFFSET, left: '50%', marginLeft: -HANDLE_OFFSET }, cursor: 'ns-resize' },
  { id: 'sw', style: { bottom: -HANDLE_OFFSET, left: -HANDLE_OFFSET }, cursor: 'nesw-resize' },
  { id: 'w', style: { top: '50%', left: -HANDLE_OFFSET, marginTop: -HANDLE_OFFSET }, cursor: 'ew-resize' },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function clampRect(r: CropRect, cw: number, ch: number, ratio: number): CropRect {
  let { x, y, width: w, height: h } = r;

  if (w < MIN_SIZE) {
    w = MIN_SIZE;
    h = w / ratio;
  }
  if (h < MIN_SIZE) {
    h = MIN_SIZE;
    w = h * ratio;
  }
  if (w > cw) {
    w = cw;
    h = w / ratio;
  }
  if (h > ch) {
    h = ch;
    w = h * ratio;
  }

  x = clamp(x, 0, cw - w);
  y = clamp(y, 0, ch - h);

  return { x, y, width: w, height: h };
}

function computeResize(
  handle: HandleId,
  px: number,
  py: number,
  rect: CropRect,
  cw: number,
  ch: number,
  ratio: number
): CropRect {
  const { x, y, width: w, height: h } = rect;

  switch (handle) {
    case 'nw': {
      const ax = x + w;
      const ay = y + h;
      let nw = Math.max(1, ax - px);
      let nh = Math.max(1, ay - py);
      if (nw / nh > ratio) {
        nw = nh * ratio;
      } else {
        nh = nw / ratio;
      }
      return clampRect({ x: ax - nw, y: ay - nh, width: nw, height: nh }, cw, ch, ratio);
    }
    case 'ne': {
      const ax = x;
      const ay = y + h;
      let nw = Math.max(1, px - ax);
      let nh = Math.max(1, ay - py);
      if (nw / nh > ratio) {
        nw = nh * ratio;
      } else {
        nh = nw / ratio;
      }
      return clampRect({ x: ax, y: ay - nh, width: nw, height: nh }, cw, ch, ratio);
    }
    case 'sw': {
      const ax = x + w;
      const ay = y;
      let nw = Math.max(1, ax - px);
      let nh = Math.max(1, py - ay);
      if (nw / nh > ratio) {
        nw = nh * ratio;
      } else {
        nh = nw / ratio;
      }
      return clampRect({ x: ax - nw, y: ay, width: nw, height: nh }, cw, ch, ratio);
    }
    case 'se': {
      const ax = x;
      const ay = y;
      let nw = Math.max(1, px - ax);
      let nh = Math.max(1, py - ay);
      if (nw / nh > ratio) {
        nw = nh * ratio;
      } else {
        nh = nw / ratio;
      }
      return clampRect({ x: ax, y: ay, width: nw, height: nh }, cw, ch, ratio);
    }
    case 'n': {
      const bottom = y + h;
      const nh = Math.max(1, bottom - py);
      const nw = nh * ratio;
      const nx = x + w / 2 - nw / 2;
      const ny = bottom - nh;
      return clampRect({ x: nx, y: ny, width: nw, height: nh }, cw, ch, ratio);
    }
    case 's': {
      const nh = Math.max(1, py - y);
      const nw = nh * ratio;
      const nx = x + w / 2 - nw / 2;
      return clampRect({ x: nx, y, width: nw, height: nh }, cw, ch, ratio);
    }
    case 'e': {
      const nw = Math.max(1, px - x);
      const nh = nw / ratio;
      const ny = y + h / 2 - nh / 2;
      return clampRect({ x, y: ny, width: nw, height: nh }, cw, ch, ratio);
    }
    case 'w': {
      const right = x + w;
      const nw = Math.max(1, right - px);
      const nh = nw / ratio;
      const ny = y + h / 2 - nh / 2;
      return clampRect({ x: right - nw, y: ny, width: nw, height: nh }, cw, ch, ratio);
    }
  }
}

export default function CropOverlay({
  containerWidth,
  containerHeight,
  orientation,
  onCropChange,
}: CropOverlayProps) {
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const interactionRef = useRef<Interaction>(null);
  const rectRef = useRef<HTMLDivElement>(null);

  const aspectRatio = orientation === 'portrait' ? 3 / 5 : 5 / 3;
  const ratioLabel = orientation === 'portrait' ? '3:5' : '5:3';

  const computeRect = useCallback(
    (w: number, h: number): CropRect => {
      if (w <= 0 || h <= 0) return { x: 0, y: 0, width: 0, height: 0 };

      let cropW: number;
      let cropH: number;

      if (w / h > aspectRatio) {
        cropH = h;
        cropW = cropH * aspectRatio;
        if (cropW > w) {
          cropW = w;
          cropH = cropW / aspectRatio;
        }
      } else {
        cropW = w;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRect(newRect);
    onCropChange(newRect);
  }, [containerWidth, containerHeight, computeRect, onCropChange]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    rectRef.current?.setPointerCapture(e.pointerId);
    interactionRef.current = {
      type: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      startRectX: rect.x,
      startRectY: rect.y,
    };
  };

  const startResize = (e: React.PointerEvent, handle: HandleId) => {
    e.preventDefault();
    e.stopPropagation();
    rectRef.current?.setPointerCapture(e.pointerId);
    interactionRef.current = {
      type: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...rect },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const inter = interactionRef.current;
    if (!inter) return;
    e.preventDefault();

    if (inter.type === 'drag') {
      const dx = e.clientX - inter.startX;
      const dy = e.clientY - inter.startY;

      const newX = clamp(inter.startRectX + dx, 0, containerWidth - rect.width);
      const newY = clamp(inter.startRectY + dy, 0, containerHeight - rect.height);

      const updated = { ...rect, x: newX, y: newY };
      setRect(updated);
      onCropChange(updated);
    } else {
      const dx = e.clientX - inter.startX;
      const dy = e.clientY - inter.startY;
      const px = inter.startRect.x + (inter.startRect.width / 2) + dx;
      const py = inter.startRect.y + (inter.startRect.height / 2) + dy;

      const startR = inter.startRect;
      const updated = computeResize(
        inter.handle,
        inter.handle === 'nw' || inter.handle === 'sw' || inter.handle === 'w'
          ? inter.startRect.x + dx
          : inter.handle === 'ne' || inter.handle === 'se' || inter.handle === 'e'
            ? inter.startRect.x + inter.startRect.width + dx
            : px,
        inter.handle === 'nw' || inter.handle === 'ne' || inter.handle === 'n'
          ? inter.startRect.y + dy
          : inter.handle === 'sw' || inter.handle === 'se' || inter.handle === 's'
            ? inter.startRect.y + inter.startRect.height + dy
            : py,
        startR,
        containerWidth,
        containerHeight,
        aspectRatio
      );
      setRect(updated);
      onCropChange(updated);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    interactionRef.current = null;
    rectRef.current?.releasePointerCapture(e.pointerId);
  };

  if (containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <div
      className="crop-overlay-container"
      style={{ width: containerWidth, height: containerHeight }}
    >
      <div
        ref={rectRef}
        className="crop-rectangle"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
        onPointerDown={startDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="crop-ratio-label">{ratioLabel}</div>
        {HANDLES.map((h) => (
          <div
            key={h.id}
            className={`crop-handle crop-handle-${h.id}`}
            style={h.style}
            onPointerDown={(e) => startResize(e, h.id)}
          />
        ))}
      </div>
    </div>
  );
}
