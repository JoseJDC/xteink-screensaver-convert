import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { CropRect, BatchItem } from './types';
import type { DitherAlgorithm } from './utils/dither';
import { useImages } from './hooks/useImages';
import ConfigPanel from './components/ConfigPanel';
import ImageList from './components/ImageList';
import BatchPanel from './components/BatchPanel';
import ImageEditor from './components/ImageEditor';
import './App.css';

export default function App() {
  const images = useImages();
  const [dither, setDither] = useState<DitherAlgorithm>('none');
  const [contrast, setContrast] = useState(0);
  const [cropStates, setCropStates] = useState<Record<string, { rect: CropRect; displayW: number; displayH: number }>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCount = useRef(0);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('xteink-image-transformer-theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('xteink-image-transformer-theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleFilesSelected = useCallback((files: FileList) => {
    images.loadFiles(files);
  }, [images]);

  const handleCropRectUpdate = useCallback((rect: CropRect, displayW: number, displayH: number) => {
    if (!images.currentImage) return;
    setCropStates(prev => ({
      ...prev,
      [images.currentImage!.name]: { rect, displayW, displayH },
    }));
  }, [images.currentImage]);

  const batchItems = useMemo((): BatchItem[] =>
    images.images
      .filter(img => {
        const cs = cropStates[img.name];
        return cs && cs.rect.width > 0 && cs.rect.height > 0;
      })
      .map(img => {
        const cs = cropStates[img.name];
        return {
          id: img.name,
          imageUrl: img.url,
          imageName: img.name,
          cropRect: cs!.rect,
          displayWidth: cs!.displayW,
          displayHeight: cs!.displayH,
          orientation: img.orientation,
          dither,
        };
      }),
  [images.images, cropStates, dither]);

  const currentCropRect = images.currentImage ? cropStates[images.currentImage.name]?.rect : null;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCount.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCount.current--;
    if (dragCount.current <= 0) {
      dragCount.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCount.current = 0;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    handleFilesSelected(files);
  }, [handleFilesSelected]);

  useEffect(() => {
    if (images.images.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft' && images.currentIndex > 0) {
        images.selectImage(images.currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && images.currentIndex < images.images.length - 1) {
        images.selectImage(images.currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <button
            className="btn-icon"
            onClick={() => setSidebarCollapsed(v => !v)}
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div>
            <h1 className="app-title">Image Transformer</h1>
            <p className="app-subtitle">Convert images to BMP for Xteink e-readers</p>
          </div>
        </div>
        <div className="app-header-right">
          <button
            className="btn-icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3.5" y1="3.5" x2="4.5" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11.5" y1="11.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3.5" y1="12.5" x2="4.5" y2="11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11.5" y1="4.5" x2="12.5" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 10a6 6 0 0 1-6-6c0-1.2.35-2.32.96-3.27A7 7 0 0 0 4 10a7 7 0 0 0 7 7c1.63 0 3.13-.56 4.31-1.5A6.03 6.03 0 0 1 12 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="app-main">
        <aside className={`app-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
          <ConfigPanel
            dither={dither}
            contrast={contrast}
            onFilesSelected={handleFilesSelected}
            onDitherChange={setDither}
            onContrastChange={setContrast}
          />

          {images.error && <div className="error-banner">{images.error}</div>}

          {images.images.length > 0 && (
            <ImageList
              images={images.images}
              currentIndex={images.currentIndex}
              onSelect={images.selectImage}
            />
          )}

          {images.images.length > 0 && (
            <BatchPanel
              items={batchItems}
            />
          )}
        </aside>

        <section
          className="app-content"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="drop-overlay">
              <div className="drop-overlay-content">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M24 6v36M6 24h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Drop files here</span>
              </div>
            </div>
          )}
          {images.currentImage ? (
            <ImageEditor
              image={images.currentImage}
              dither={dither}
              contrast={contrast}
              imageCount={images.images.length}
              currentIndex={images.currentIndex}
              initialCropRect={currentCropRect}
              onNext={images.goToNext}
              onPrev={images.goToPrev}
              onCropRectUpdate={handleCropRectUpdate}
            />
          ) : (
            <div className="app-empty">
              <div className="empty-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="8" y="8" width="64" height="64" rx="6" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
                  <rect x="16" y="16" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
                  <rect x="44" y="16" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
                  <rect x="16" y="38" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
                  <rect x="40" y="38" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2"/>
                  <line x1="8" y1="36" x2="72" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.15"/>
                  <line x1="38" y1="10" x2="38" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.15"/>
                </svg>
              </div>
              <h2 className="empty-title">No images loaded</h2>
              <p className="empty-text">Drop images here or choose files in the sidebar</p>
              <p className="empty-hint">
                Crop images manually and convert to 24-bit BMP format for Xteink e-readers
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
