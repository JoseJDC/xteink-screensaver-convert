import { useState, useCallback } from 'react';
import type { CropOrientation } from './types';
import { useImages } from './hooks/useImages';
import ConfigPanel from './components/ConfigPanel';
import ImageList from './components/ImageList';
import ImageEditor from './components/ImageEditor';
import './App.css';

export default function App() {
  const {
    images,
    currentIndex,
    directory,
    loading,
    error,
    setDirectory,
    fetchImages,
    goToNext,
    goToPrev,
    selectImage,
    markProcessed,
  } = useImages();

  const [orientation, setOrientation] = useState<CropOrientation>('portrait');

  const handleLoad = useCallback(() => {
    if (directory.trim()) {
      fetchImages();
    }
  }, [directory, fetchImages]);

  const currentImage = images.length > 0 ? images[currentIndex] : null;

  return (
    <div className="app">
      <ConfigPanel
        directory={directory}
        orientation={orientation}
        onDirectoryChange={setDirectory}
        onOrientationChange={setOrientation}
        onLoad={handleLoad}
        loading={loading}
      />
      {error && <div className="app-error">{error}</div>}
      {images.length > 0 ? (
        <div className="app-workspace">
          <ImageList
            images={images}
            currentIndex={currentIndex}
            onSelect={selectImage}
          />
          <ImageEditor
            image={currentImage}
            orientation={orientation}
            imageCount={images.length}
            currentIndex={currentIndex}
            onNext={goToNext}
            onPrev={goToPrev}
            onMarkProcessed={() => markProcessed(currentIndex)}
          />
        </div>
      ) : (
        !loading && (
          <div className="app-placeholder">
            <p>Enter a directory path and click Load to begin.</p>
          </div>
        )
      )}
    </div>
  );
}
