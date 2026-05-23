import { useState, useCallback } from 'react';
import type { ImageFile } from '../types';

interface UseImagesReturn {
  images: ImageFile[];
  currentIndex: number;
  directory: string;
  loading: boolean;
  error: string;
  setDirectory: (dir: string) => void;
  fetchImages: () => Promise<void>;
  goToNext: () => void;
  goToPrev: () => void;
  selectImage: (index: number) => void;
  markProcessed: (index: number) => void;
}

export function useImages(): UseImagesReturn {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [directory, setDirectory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchImages = useCallback(async () => {
    if (!directory) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/images?dir=${encodeURIComponent(directory)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch images');
      }
      const names: string[] = await res.json();
      const list: ImageFile[] = names.map((name) => ({
        name,
        url: `/api/image?dir=${encodeURIComponent(directory)}&name=${encodeURIComponent(name)}`,
        processed: false,
      }));
      setImages(list);
      setCurrentIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [directory]);

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
    directory,
    loading,
    error,
    setDirectory,
    fetchImages,
    goToNext,
    goToPrev,
    selectImage,
    markProcessed,
  };
}
