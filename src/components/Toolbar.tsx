interface ToolbarProps {
  currentIndex: number;
  imageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onAddToBatch: () => void;
  canAdd: boolean;
}

export default function Toolbar({
  currentIndex,
  imageCount,
  onPrev,
  onNext,
  onAddToBatch,
  canAdd,
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
      <div className="toolbar-right">
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
