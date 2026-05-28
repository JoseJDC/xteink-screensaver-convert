import type { OrientationMode } from '../types';

interface ToolbarProps {
  currentIndex: number;
  imageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onAddToBatch: () => void;
  canAdd: boolean;
  orientation: OrientationMode;
  spoilerBlur: boolean;
  isRotated: boolean;
  onOrientationChange: (orientation: OrientationMode) => void;
  onSpoilerBlurChange: (blur: boolean) => void;
  onRotationChange: (rotation: 0 | 90 | 180 | 270) => void;
}

export default function Toolbar({
  currentIndex,
  imageCount,
  onPrev,
  onNext,
  onAddToBatch,
  canAdd,
  orientation,
  spoilerBlur,
  isRotated,
  onOrientationChange,
  onSpoilerBlurChange,
  onRotationChange,
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
      <div className="toolbar-center">
        <button
          onClick={() => {
            const next = isRotated ? 0 : 90;
            onRotationChange(next as 0 | 90 | 180 | 270);
          }}
          className={isRotated ? 'active' : ''}
          title={isRotated ? 'Reset rotation' : 'Rotate 90\u00b0 CW'}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10a6 6 0 0110.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M15 3v3.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => onOrientationChange(orientation === 'portrait' ? 'landscape' : 'portrait')}
          title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
        >
          {orientation === 'portrait' ? '\u2195 3:5' : '\u2194 5:3'}
        </button>
      </div>
      <div className="toolbar-right">
        <button
          onClick={() => onSpoilerBlurChange(!spoilerBlur)}
          className={spoilerBlur ? 'active' : ''}
          title={spoilerBlur ? 'Disable blur' : 'Enable blur'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            {spoilerBlur ? (
              <><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" fill="none"/><line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>
            ) : (
              <><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" fill="none"/></>
            )}
          </svg>
        </button>
        <button
          className="btn-process"
          onClick={onAddToBatch}
          disabled={!canAdd}
        >
          Add to Batch
        </button>
      </div>
    </div>
  );
}
