'use client';

import { motion } from 'framer-motion';
import type { TurnaroundImage } from '../types';

interface TurnaroundSheetProps {
  images: TurnaroundImage[];
}

export default function TurnaroundSheet({ images }: TurnaroundSheetProps) {
  if (!images.length) return null;

  return (
    <div className="mt-3">
      <p className="text-xs mb-2" style={{ color: '#64748b' }}>
        Turnaround Reference Sheet
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {images.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid #1e1e3a' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.angle}
              className="w-full h-auto"
              loading="lazy"
            />
            <p
              className="text-center text-xs py-0.5 truncate px-1"
              style={{ background: '#08080f', color: '#475569' }}
            >
              {img.angle}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
