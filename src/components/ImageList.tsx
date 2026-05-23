import type { ImageFile } from '../types';

interface ImageListProps {
  images: ImageFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
  batchCount: number;
  activeTab: 'images' | 'batch';
  onTabChange: (tab: 'images' | 'batch') => void;
}

export default function ImageList({ images, currentIndex, onSelect, batchCount, activeTab, onTabChange }: ImageListProps) {
  const total = images.length;
  const processed = images.filter((img) => img.processed).length;

  return (
    <div className="image-list">
      <div className="image-list-tabs">
        <button
          className={`image-list-tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => onTabChange('images')}
        >
          Images
        </button>
        <button
          className={`image-list-tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => onTabChange('batch')}
        >
          Batch{batchCount > 0 && ` (${batchCount})`}
        </button>
      </div>
      {activeTab === 'images' && (
        <>
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
        </>
      )}
    </div>
  );
}
