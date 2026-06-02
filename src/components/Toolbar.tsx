import type { OrientationMode } from '../types';
import type { DitherAlgorithm } from '../utils/dither';

interface ToolbarProps {
  currentIndex: number;
  imageCount: number;
  onPrev: () => void;
  onNext: () => void;
  orientation: OrientationMode;
  onOrientationChange: (orientation: OrientationMode) => void;
  dither: DitherAlgorithm;
  onDitherChange: (dither: DitherAlgorithm) => void;
  contrast: number;
  onContrastChange: (contrast: number) => void;
}

const DITHER_OPTIONS: { value: DitherAlgorithm; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'floyd-steinberg', label: 'F-Stein' },
  { value: 'atkinson', label: 'Atk' },
  { value: 'bayer4x4', label: 'Bayer4' },
  { value: 'bayer8x8', label: 'Bayer8' },
];

export default function Toolbar({
  currentIndex,
  imageCount,
  onPrev,
  onNext,
  orientation,
  onOrientationChange,
  dither,
  onDitherChange,
  contrast,
  onContrastChange,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onPrev} disabled={currentIndex <= 0} title="Previous image (ArrowLeft)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="toolbar-counter">
          {currentIndex + 1} / {imageCount}
        </span>
        <button onClick={onNext} disabled={currentIndex >= imageCount - 1} title="Next image (ArrowRight)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="toolbar-center">
        <div className="toolbar-group" title="Dither (Q W E R T)">
          {DITHER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={dither === opt.value ? 'active' : ''}
              onClick={() => onDitherChange(opt.value)}
              title={opt.label}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group" title="Contrast (0-8, ArrowUp/ArrowDown)">
          <span className="toolbar-label">C:</span>
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={contrast}
            onChange={(e) => onContrastChange(parseInt(e.target.value))}
            className="toolbar-range"
          />
          <span className="toolbar-value">{contrast}</span>
        </div>
      </div>

      <div className="toolbar-right">
        <button
          onClick={() => onOrientationChange(orientation === 'portrait' ? 'landscape' : 'portrait')}
          title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'} (F)`}
        >
          {orientation === 'portrait' ? '\u2195 3:5' : '\u2194 5:3'}
        </button>
      </div>
    </div>
  );
}
