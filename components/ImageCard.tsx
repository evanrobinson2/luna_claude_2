'use client';

import { motion } from 'framer-motion';
import { useLunaStore } from '../lib/store';
import type { StoryImage } from '../types';

interface ImageCardProps {
  image: StoryImage;
  isActive?: boolean;
  onClick?: () => void;
  showMetaButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function ImageCard({
  image,
  isActive = false,
  onClick,
  showMetaButton = true,
  className = '',
  style,
}: ImageCardProps) {
  const setMetadataImage = useLunaStore((s) => s.setMetadataImage);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className={`relative overflow-hidden rounded-lg cursor-pointer ${className}`}
      style={{
        border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        boxShadow: isActive ? '0 0 0 1px #3b82f644, 0 0 12px #3b82f633' : 'none',
        ...style,
      }}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.prompt}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Metadata button */}
      {showMetaButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMetadataImage(image);
          }}
          className="absolute top-2 right-2 flex items-center justify-center rounded-full text-white text-xs font-bold transition-transform duration-150 hover:scale-110"
          style={{
            width: '22px',
            height: '22px',
            background: '#3b82f6',
            boxShadow: '0 0 0 2px #050510, 0 0 8px #3b82f666',
            fontSize: '11px',
          }}
          title="View image metadata"
        >
          ?
        </button>
      )}
    </motion.div>
  );
}
