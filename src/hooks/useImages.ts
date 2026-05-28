import { useState, useCallback, useRef, useEffect } from 'react';
import type { DitherAlgorithm } from '../utils/dither';
import type { CropRect, ImageFile, OrientationMode } from '../types';

const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
]);

interface UseImagesReturn {
  images: ImageFile[];
  currentIndex: number;
  currentImage: ImageFile | null;
  loading: boolean;
  error: string | null;
  loadFiles: (files: FileList) => void;
  goToNext: () => void;
  goToPrev: () => void;
  selectImage: (index: number) => void;
  markProcessed: (index: number) => void;
  setOrientation: (index: number, orientation: OrientationMode) => void;
  setDither: (index: number, dither: DitherAlgorithm) => void;
  setContrast: (index: number, contrast: number) => void;
  setCropRect: (index: number, rect: CropRect, displayW: number, displayH: number) => void;
  clear: () => void;
}

export function useImages(): UseImagesReturn {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oldUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      oldUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const currentImage = images.length > 0 ? images[currentIndex] : null;

  const loadFiles = useCallback((files: FileList) => {
    setLoading(true);
    setError(null);

    try {
      const validFiles = Array.from(files).filter(
        (f) => IMAGE_TYPES.has(f.type) || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f.name)
      );

      if (validFiles.length === 0) {
        setError('No valid image files found. Supported: JPEG, PNG, GIF, WebP, BMP');
        setLoading(false);
        return;
      }

      oldUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));

      const newUrls: string[] = [];
      const list: ImageFile[] = validFiles.map((file) => {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
        return {
          name: file.name,
          url,
          processed: false,
          orientation: 'portrait' as OrientationMode,
          dither: 'none' as DitherAlgorithm,
          contrast: 0,
        };
      });

      oldUrlsRef.current = newUrls;
      setImages(list);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const selectImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  const markProcessed = useCallback((index: number) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, processed: true } : img))
    );
  }, []);

  const setOrientation = useCallback((index: number, orientation: OrientationMode) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], orientation };
      return next;
    });
  }, []);

  const setDither = useCallback((index: number, dither: DitherAlgorithm) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], dither };
      return next;
    });
  }, []);

  const setContrast = useCallback((index: number, contrast: number) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], contrast };
      return next;
    });
  }, []);

  const setCropRect = useCallback((index: number, rect: CropRect, displayW: number, displayH: number) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], cropRect: rect, displayW, displayH };
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    oldUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    oldUrlsRef.current = [];
    setImages([]);
    setCurrentIndex(0);
    setError(null);
  }, []);

  return {
    images, currentIndex, currentImage, loading, error,
    loadFiles, goToNext, goToPrev, selectImage,
    markProcessed, setOrientation, setDither, setContrast, setCropRect, clear,
  };
}
