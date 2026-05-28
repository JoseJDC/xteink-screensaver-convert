import { memo } from 'react';
import { List } from 'react-window';
import type { ImageFile } from '../types';

interface ImageListProps {
  images: ImageFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

interface RowProps {
  images: ImageFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const ROW_HEIGHT = 46;

export default memo(function ImageList({ images, currentIndex, onSelect }: ImageListProps) {
  if (images.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowProps: any = { images, currentIndex, onSelect };

  return (
    <div className="image-list">
      <div className="image-list-header">
        <span>{images.length} images</span>
      </div>
      <div className="image-list-scroll">
        <List
          rowCount={images.length}
          rowHeight={ROW_HEIGHT}
          overscanCount={5}
          rowComponent={Row}
          rowProps={rowProps}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
});

function Row({ index, style, images, currentIndex, onSelect }: { index: number; style: React.CSSProperties } & RowProps) {
  const img = images[index];
  return (
    <button
      style={style}
      className={`image-list-item ${index === currentIndex ? 'selected' : ''}`}
      onClick={() => onSelect(index)}
      aria-label={`Select ${img.name}`}
    >
      <div className="image-list-thumb">
        <img src={img.url} alt={img.name} loading="lazy" width="32" height="32" />
      </div>
      <div className="image-list-info">
        <span className="image-list-name" title={img.name}>{img.name}</span>
        <span className={`image-list-orientation ${img.orientation}`}>
          {img.orientation === 'portrait' ? '\u2195 Portrait' : '\u2194 Landscape'}
        </span>
      </div>
    </button>
  );
}
