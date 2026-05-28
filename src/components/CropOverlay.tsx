import { useRef, useState, useCallback, useEffect } from 'react';
import type { CropRect, OrientationMode } from '../types';

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  orientation: OrientationMode;
  initialRect?: CropRect | null;
  onCropChange: (rect: CropRect) => void;
}

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type Interaction =
  | { type: 'drag'; startX: number; startY: number; startRectX: number; startRectY: number }
  | { type: 'resize'; handle: HandleId; startX: number; startY: number; startRect: CropRect }
  | null;

const MIN_SIZE = 60;
const HANDLE_OFFSET = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampRect(rect: CropRect, cw: number, ch: number, ratio: number): CropRect {
  let { x, y, width: w, height: h } = rect;
  if (w < MIN_SIZE) { w = MIN_SIZE; h = w / ratio; }
  if (h < MIN_SIZE) { h = MIN_SIZE; w = h * ratio; }
  if (w > cw) { w = cw; h = w / ratio; }
  if (h > ch) { h = ch; w = h * ratio; }
  x = clamp(x, 0, cw - w);
  y = clamp(y, 0, ch - h);
  return { x, y, width: w, height: h };
}

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_STYLES: Record<HandleId, React.CSSProperties> = {
  nw: { top: -HANDLE_OFFSET, left: -HANDLE_OFFSET, cursor: 'nwse-resize' },
  n: { top: -HANDLE_OFFSET, left: '50%', marginLeft: -HANDLE_OFFSET, cursor: 'ns-resize' },
  ne: { top: -HANDLE_OFFSET, right: -HANDLE_OFFSET, cursor: 'nesw-resize' },
  e: { top: '50%', right: -HANDLE_OFFSET, marginTop: -HANDLE_OFFSET, cursor: 'ew-resize' },
  se: { bottom: -HANDLE_OFFSET, right: -HANDLE_OFFSET, cursor: 'nwse-resize' },
  s: { bottom: -HANDLE_OFFSET, left: '50%', marginLeft: -HANDLE_OFFSET, cursor: 'ns-resize' },
  sw: { bottom: -HANDLE_OFFSET, left: -HANDLE_OFFSET, cursor: 'nesw-resize' },
  w: { top: '50%', left: -HANDLE_OFFSET, marginTop: -HANDLE_OFFSET, cursor: 'ew-resize' },
};

export default function CropOverlay({
  containerWidth,
  containerHeight,
  orientation,
  initialRect,
  onCropChange,
}: CropOverlayProps) {
  const [rect, setRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const interactionRef = useRef<Interaction>(null);
  const rectRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

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
    if (initialRect && initialRect.width > 0 && initialRect.height > 0) {
      if (!isInitialized.current) {
        isInitialized.current = true;
        setRect(initialRect);
        onCropChange(initialRect);
        return;
      }
      if (initialRect.x === rect.x && initialRect.y === rect.y &&
          initialRect.width === rect.width && initialRect.height === rect.height) {
        return;
      }
    }
    const newRect = computeRect(containerWidth, containerHeight);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRect(newRect);
    onCropChange(newRect);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, containerHeight]);

  useEffect(() => {
    if (!isInitialized.current) return;
    if (initialRect && initialRect.width > 0 && initialRect.height > 0 &&
        (initialRect.x !== rect.x || initialRect.y !== rect.y ||
         initialRect.width !== rect.width || initialRect.height !== rect.height)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRect(initialRect);
      onCropChange(initialRect);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

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
      startRect: rect,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const interaction = interactionRef.current;
    if (!interaction) return;

    const dx = e.clientX - interaction.startX;
    const dy = e.clientY - interaction.startY;

    if (interaction.type === 'drag') {
      const newX = clamp(interaction.startRectX + dx, 0, containerWidth - rect.width);
      const newY = clamp(interaction.startRectY + dy, 0, containerHeight - rect.height);
      const newRect = { ...rect, x: newX, y: newY };
      setRect(newRect);
      onCropChange(newRect);
    } else {
      const handle = interaction.handle;
      let newRect: CropRect;

      switch (handle) {
        case 'e': {
          const nw = Math.max(MIN_SIZE, interaction.startRect.width + dx);
          const nh = nw / aspectRatio;
          newRect = { ...interaction.startRect, width: nw, height: nh };
          break;
        }
        case 's': {
          const nh = Math.max(MIN_SIZE, interaction.startRect.height + dy);
          const nw = nh * aspectRatio;
          newRect = { ...interaction.startRect, width: nw, height: nh };
          break;
        }
        case 'w': {
          const nw = Math.max(MIN_SIZE, interaction.startRect.width - dx);
          const nh = nw / aspectRatio;
          newRect = { ...interaction.startRect, x: interaction.startRect.x + interaction.startRect.width - nw, width: nw, height: nh };
          break;
        }
        case 'nw': {
          const nw = Math.max(MIN_SIZE, interaction.startRect.width - dx);
          const nh = nw / aspectRatio;
          newRect = { x: interaction.startRect.x + interaction.startRect.width - nw, y: interaction.startRect.y + interaction.startRect.height - nh, width: nw, height: nh };
          break;
        }
        case 'ne': {
          const nw = Math.max(MIN_SIZE, interaction.startRect.width + dx);
          const nh = nw / aspectRatio;
          newRect = { x: interaction.startRect.x, y: interaction.startRect.y + interaction.startRect.height - nh, width: nw, height: nh };
          break;
        }
        case 'se': {
          const nw = Math.max(MIN_SIZE, interaction.startRect.width + dx);
          const nh = nw / aspectRatio;
          newRect = { ...interaction.startRect, width: nw, height: nh };
          break;
        }
        case 'sw': {
          const nw = Math.max(MIN_SIZE, interaction.startRect.width - dx);
          const nh = nw / aspectRatio;
          newRect = { x: interaction.startRect.x + interaction.startRect.width - nw, y: interaction.startRect.y, width: nw, height: nh };
          break;
        }
        default:
          newRect = interaction.startRect;
      }

      newRect = clampRect(newRect, containerWidth, containerHeight, aspectRatio);
      setRect(newRect);
      onCropChange(newRect);
    }
  };

  const onPointerUp = () => {
    interactionRef.current = null;
  };

  return (
    <div
      className="crop-overlay-container"
      style={{ width: containerWidth, height: containerHeight, position: 'absolute' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
      >
        <span className="crop-ratio-label">{ratioLabel}</span>
        {HANDLES.map((handle) => (
          <div
            key={handle}
            className="crop-handle"
            style={HANDLE_STYLES[handle]}
            onPointerDown={(e) => startResize(e, handle)}
          />
        ))}
      </div>
    </div>
  );
}
