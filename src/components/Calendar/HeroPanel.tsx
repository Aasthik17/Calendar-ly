'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './HeroPanel.module.css';

type HeroPanelProps = {
  imageUrl: string;
  imageAlt: string;
  monthName: string;
  year: number;
  onImageLoad?: (img: HTMLImageElement) => void;
};

export default function HeroPanel({ imageUrl, imageAlt, monthName, year, onImageLoad }: HeroPanelProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const failedImageRef = useRef<string | null>(null);

  useEffect(() => {
    if (failedImageRef.current === imageUrl) return;
    if (imageUrl === currentImage) return;

    // Start cross-fade: preload new image
    setNextImage(imageUrl);
    setTransitioning(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      failedImageRef.current = null;
      setShowFallback(false);

      // Give time for the fade transition
      setTimeout(() => {
        setCurrentImage(imageUrl);
        setNextImage(null);
        setTransitioning(false);
        if (onImageLoad) {
          onImageLoad(img);
        }
      }, 400);
    };
    img.onerror = () => {
      failedImageRef.current = imageUrl;
      setCurrentImage(null);
      setNextImage(null);
      setTransitioning(false);
      setShowFallback(true);
    };
    img.src = imageUrl;
  }, [imageUrl, currentImage, onImageLoad]);

  const handleCurrentLoad = () => {
    if (imgRef.current && onImageLoad && !transitioning) {
      onImageLoad(imgRef.current);
    }
  };

  return (
    <div
      className={styles.hero}
      role={showFallback ? 'img' : undefined}
      aria-label={showFallback ? imageAlt : undefined}
    >
      {/* Current image */}
      {currentImage && (
        <div className={`${styles.imageWrapper} ${transitioning ? styles.imageExiting : styles.imageVisible}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={currentImage}
            alt={imageAlt}
            crossOrigin="anonymous"
            onLoad={handleCurrentLoad}
            onError={() => {
              failedImageRef.current = imageUrl;
              setCurrentImage(null);
              setShowFallback(true);
            }}
          />
        </div>
      )}

      {/* Incoming image (during transition) */}
      {nextImage && (
        <div className={`${styles.imageWrapper} ${transitioning ? styles.imageVisible : styles.imageEntering}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nextImage}
            alt={imageAlt}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Month label overlay */}
      <div className={styles.monthLabel}>
        {monthName}
        <span className={styles.yearLabel}>{year}</span>
      </div>
    </div>
  );
}
