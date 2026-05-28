import type { OrientationMode } from '../types';

interface ToolbarProps {
  currentIndex: number;
  imageCount: number;
  onPrev: () => void;
  onNext: () => void;
  orientation: OrientationMode;
  onOrientationChange: (orientation: OrientationMode) => void;
}

export default function Toolbar({
  currentIndex,
  imageCount,
  onPrev,
  onNext,
  orientation,
  onOrientationChange,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onPrev} disabled={currentIndex <= 0} title="Previous image">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="toolbar-counter">
          {currentIndex + 1} / {imageCount}
        </span>
        <button onClick={onNext} disabled={currentIndex >= imageCount - 1} title="Next image">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="toolbar-right">
        <button
          onClick={() => onOrientationChange(orientation === 'portrait' ? 'landscape' : 'portrait')}
          title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
        >
          {orientation === 'portrait' ? '\u2195 3:5' : '\u2194 5:3'}
        </button>
      </div>
    </div>
  );
}
