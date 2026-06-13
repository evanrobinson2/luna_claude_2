'use client';

import { useEffect } from 'react';
import { useLunaStore } from '../../lib/store';
import Sidebar from '../../components/Sidebar';

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  const setStories = useLunaStore((s) => s.setStories);

  useEffect(() => {
    fetch('/api/stories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStories(data);
        }
      })
      .catch(console.error);
  }, [setStories]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050510' }}>
      {/* Sidebar */}
      <div className="flex-shrink-0" style={{ width: '240px' }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
