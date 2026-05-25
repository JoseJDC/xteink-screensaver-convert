import { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageFile } from '../types';

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
]);

interface UseImagesReturn {
  images: ImageFile[];
  currentIndex: number;
  loading: boolean;
  error: string;
  loadFiles: (files: FileList) => void;
  goToNext: () => void;
  goToPrev: () => void;
  selectImage: (index: number) => void;
  markProcessed: (index: number) => void;
}

export function useImages(): UseImagesReturn {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const oldUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      oldUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const loadFiles = useCallback((files: FileList) => {
    setLoading(true);
    setError('');

    try {
      const validFiles = Array.from(files).filter((f) =>
        IMAGE_TYPES.has(f.type)
      );

      if (validFiles.length === 0) {
        throw new Error('No valid image files found. Supported: JPEG, PNG, GIF, WebP, BMP');
      }

      oldUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));

      const newUrls: string[] = [];
      const list: ImageFile[] = validFiles.map((file) => {
        const url = URL.createObjectURL(file);
        newUrls.push(url);
        return { name: file.name, url, processed: false };
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

  return {
    images,
    currentIndex,
    loading,
    error,
    loadFiles,
    goToNext,
    goToPrev,
    selectImage,
    markProcessed,
  };
}
