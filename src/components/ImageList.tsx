import type { ImageFile } from '../types';

interface ImageListProps {
  images: ImageFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function ImageList({ images, currentIndex, onSelect }: ImageListProps) {
  const total = images.length;
  const processed = images.filter((img) => img.processed).length;

  return (
    <div className="image-list">
      <div className="image-list-header">
        <span>
          {processed}/{total} processed
        </span>
      </div>
      <div className="image-list-scroll">
        {images.map((img, i) => (
          <div
            key={img.name}
            className={`image-list-item ${i === currentIndex ? 'active' : ''} ${img.processed ? 'processed' : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className="image-list-thumb">
              <img src={img.url} alt={img.name} loading="lazy" />
            </div>
            <div className="image-list-name">
              {img.processed && <span className="check">&#10003;</span>}
              {img.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
