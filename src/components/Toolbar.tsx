import type { CropOrientation } from '../types';

interface ToolbarProps {
  orientation: CropOrientation;
  currentIndex: number;
  imageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onProcess: () => void;
  processing: boolean;
  canProcess: boolean;
}

export default function Toolbar({
  orientation,
  currentIndex,
  imageCount,
  onPrev,
  onNext,
  onProcess,
  processing,
  canProcess,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onPrev} disabled={currentIndex <= 0}>
          &#8592; Prev
        </button>
        <span className="toolbar-counter">
          {currentIndex + 1} / {imageCount}
        </span>
        <button onClick={onNext} disabled={currentIndex >= imageCount - 1}>
          Next &#8594;
        </button>
      </div>
      <div className="toolbar-center">
        <span className="toolbar-orientation">
          Crop: {orientation === 'portrait' ? '4:5 Portrait' : '5:4 Landscape'} {' → '}
          Output: 480×800
        </span>
      </div>
      <div className="toolbar-right">
        <button
          className="btn-process"
          onClick={onProcess}
          disabled={processing || !canProcess}
        >
          {processing ? 'Processing...' : 'Process'}
        </button>
      </div>
    </div>
  );
}
