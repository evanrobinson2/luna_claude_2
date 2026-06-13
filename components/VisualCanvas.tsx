'use client';

import { useRef } from 'react';
import { useLunaStore } from '../lib/store';
import ImageCard from './ImageCard';

interface VisualCanvasProps {
  storyId: string;
}

export default function VisualCanvas({ storyId: _storyId }: VisualCanvasProps) {
  const { images, activeImageIndex, setActiveImageIndex } = useLunaStore((s) => ({
    images: s.images,
    activeImageIndex: s.activeImageIndex,
    setActiveImageIndex: s.setActiveImageIndex,
  }));

  const stripRef = useRef<HTMLDivElement>(null);
  const activeImage = images[activeImageIndex] ?? null;

  function goNext() {
    if (activeImageIndex < images.length - 1) {
      setActiveImageIndex(activeImageIndex + 1);
    }
  }

  function goPrev() {
    if (activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#050510' }}
    >
      {/* Hero image area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {activeImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.prompt}
              className="max-w-full max-h-full object-contain"
              style={{ userSelect: 'none' }}
            />

            {/* Prev button */}
            {activeImageIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(10,10,20,0.8)',
                  border: '1px solid #1e1e3a',
                  color: '#94a3b8',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1e3a';
                }}
              >
                ‹
              </button>
            )}

            {/* Next button */}
            {activeImageIndex < images.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(10,10,20,0.8)',
                  border: '1px solid #1e1e3a',
                  color: '#94a3b8',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e1e3a';
                }}
              >
                ›
              </button>
            )}

            {/* Counter */}
            <div
              className="absolute bottom-4 right-4 text-xs px-2 py-1 rounded-md"
              style={{
                background: 'rgba(10,10,20,0.7)',
                color: '#64748b',
                backdropFilter: 'blur(4px)',
              }}
            >
              {activeImageIndex + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <div
              className="text-5xl"
              style={{ filter: 'drop-shadow(0 0 20px #7c3aed44)' }}
            >
              ✦
            </div>
            <p className="text-sm" style={{ color: '#334155' }}>
              No images yet.
              <br />
              Continue the story to generate visuals.
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div
          className="flex-shrink-0"
          style={{
            height: '88px',
            borderTop: '1px solid #1a1a2e',
            background: '#08080f',
          }}
        >
          <div
            ref={stripRef}
            className="flex items-center gap-2 h-full overflow-x-auto px-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1e3a transparent' }}
          >
            {images.map((img, idx) => (
              <div key={img.id} className="flex-shrink-0" style={{ height: '64px', width: '64px' }}>
                <ImageCard
                  image={img}
                  isActive={idx === activeImageIndex}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{ height: '64px', width: '64px' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
