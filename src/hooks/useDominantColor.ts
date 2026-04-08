'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Extracts a dominant warm hue from a hero image for dynamic theming.
 * Returns an HSL string or null while loading/erroring.
 *
 * Implementation:
 * 1. Load the image onto a hidden 8×8 canvas (crossOrigin="anonymous")
 * 2. Read pixel data with getImageData
 * 3. Average the R, G, B values across all 64 pixels
 * 4. Convert to HSL
 * 5. Clamp: hue to warm range (15–45), saturation to 40–70%, lightness to 35–50%
 * 6. Return the HSL string for use as --color-accent override
 */
export function useDominantColor(imageUrl: string): string | null {
  const [color, setColor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    let cancelled = false;

    const processImage = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        if (cancelled) return;

        // Use requestIdleCallback to avoid blocking main thread
        const run = typeof requestIdleCallback !== 'undefined'
          ? requestIdleCallback
          : (cb: () => void) => setTimeout(cb, 0);

        run(() => {
          if (cancelled) return;

          try {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas');
            }
            const canvas = canvasRef.current;
            canvas.width = 8;
            canvas.height = 8;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, 8, 8);
            const imageData = ctx.getImageData(0, 0, 8, 8);
            const data = imageData.data;

            // Average RGB across all 64 pixels
            let totalR = 0, totalG = 0, totalB = 0;
            const pixelCount = 64;

            for (let i = 0; i < data.length; i += 4) {
              totalR += data[i];
              totalG += data[i + 1];
              totalB += data[i + 2];
            }

            const avgR = totalR / pixelCount;
            const avgG = totalG / pixelCount;
            const avgB = totalB / pixelCount;

            // Convert RGB to HSL
            const hsl = rgbToHsl(avgR, avgG, avgB);

            // Clamp to warm range
            const clampedHue = Math.max(15, Math.min(45, hsl.h));
            const clampedSat = Math.max(40, Math.min(70, hsl.s));
            const clampedLight = Math.max(35, Math.min(50, hsl.l));

            const hslString = `hsl(${Math.round(clampedHue)}, ${Math.round(clampedSat)}%, ${Math.round(clampedLight)}%)`;

            if (!cancelled) {
              setColor(hslString);
            }
          } catch {
            // Canvas tainted or other error — fallback to default accent
            if (!cancelled) {
              setColor(null);
            }
          }
        });
      };

      img.onerror = () => {
        if (!cancelled) {
          setColor(null);
        }
      };

      img.src = imageUrl;
    };

    processImage();

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

/** Converts RGB (0-255) to HSL (h: 0-360, s: 0-100, l: 0-100) */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}
