import { useState, useCallback } from 'react';
import type { CropOrientation, CropRect, BatchItem } from './types';
import type { DitherAlgorithm } from './utils/dither';
import { useImages } from './hooks/useImages';
import ConfigPanel from './components/ConfigPanel';
import ImageList from './components/ImageList';
import BatchPanel from './components/BatchPanel';
import ImageEditor from './components/ImageEditor';
import './App.css';

let batchIdCounter = 0;

export default function App() {
  const {
    images,
    currentIndex,
    error,
    loadFiles,
    goToNext,
    goToPrev,
    selectImage,
  } = useImages();

  const [orientation, setOrientation] = useState<CropOrientation>('portrait');
  const [dither, setDither] = useState<DitherAlgorithm>('none');
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [activeTab, setActiveTab] = useState<'images' | 'batch'>('images');

  const handleFilesSelected = useCallback((files: FileList) => {
    loadFiles(files);
  }, [loadFiles]);

  const handleAddToBatch = useCallback(
    (cropRect: CropRect, displayW: number, displayH: number) => {
      const currentImage = images[currentIndex];
      if (!currentImage) return;
      const item: BatchItem = {
        id: String(++batchIdCounter),
        imageUrl: currentImage.url,
        imageName: currentImage.name,
        cropRect,
        displayWidth: displayW,
        displayHeight: displayH,
        orientation,
        dither,
      };
      setBatch((prev) => [...prev, item]);
    },
     [images, currentIndex, orientation, dither]
  );

  const handleRemoveFromBatch = useCallback((id: string) => {
    setBatch((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const currentImage = images.length > 0 ? images[currentIndex] : null;

  return (
    <div className="app">
      <ConfigPanel
        orientation={orientation}
        dither={dither}
        onFilesSelected={handleFilesSelected}
        onOrientationChange={setOrientation}
        onDitherChange={setDither}
      />
      {error && <div className="app-error">{error}</div>}
      {images.length > 0 ? (
        <div className="app-workspace">
          <div className="app-sidebar">
            <ImageList
              images={images}
              currentIndex={currentIndex}
              onSelect={(idx) => { selectImage(idx); setActiveTab('images'); }}
              batchCount={batch.length}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {activeTab === 'batch' && (
              <BatchPanel
                items={batch}
                onRemove={handleRemoveFromBatch}
              />
            )}
          </div>
          <ImageEditor
            image={currentImage}
            orientation={orientation}
            dither={dither}
            imageCount={images.length}
            currentIndex={currentIndex}
            onNext={goToNext}
            onPrev={goToPrev}
            onAddToBatch={handleAddToBatch}
          />
        </div>
      ) : (
        <div className="app-placeholder">
          <p>Select images to start editing.</p>
        </div>
      )}
    </div>
  );
}
