'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLunaStore } from '../lib/store';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { stories, activeStoryId, setActiveStoryId, addStory } = useLunaStore((s) => ({
    stories: s.stories,
    activeStoryId: s.activeStoryId,
    setActiveStoryId: s.setActiveStoryId,
    addStory: s.addStory,
  }));

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const story = await res.json();
        addStory(story);
        setNewTitle('');
        setCreating(false);
        setActiveStoryId(story.id);
        router.push(`/stories/${story.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: '#0a0a0f',
        borderRight: '1px solid #1a1a2e',
        width: '240px',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #1a1a2e' }}>
        <Link href="/stories" className="block">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Luna
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
            AI Storytelling
          </p>
        </Link>
      </div>

      {/* Story list */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <AnimatePresence>
          {stories.map((story, i) => {
            const isActive = story.id === activeStoryId;
            const isOnChat = pathname === `/stories/${story.id}`;
            const isOnGraph = pathname === `/stories/${story.id}/knowledge`;

            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="mb-1 rounded-lg overflow-hidden"
                style={
                  isActive
                    ? {
                        border: '1px solid #3b82f644',
                        boxShadow: '0 0 0 1px #3b82f622, 0 0 8px #3b82f622',
                        background: '#0f0f1f',
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <div className="flex items-center gap-1 px-2 py-2">
                  {/* Active indicator */}
                  {isActive && (
                    <div
                      className="flex-shrink-0 rounded-full"
                      style={{ width: '4px', height: '4px', background: '#3b82f6' }}
                    />
                  )}

                  {/* Story title + date */}
                  <button
                    onClick={() => {
                      setActiveStoryId(story.id);
                      router.push(`/stories/${story.id}`);
                    }}
                    className="flex-1 text-left overflow-hidden"
                  >
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: isActive ? '#e2e8f0' : '#94a3b8' }}
                    >
                      {story.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                      {new Date(story.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </button>

                  {/* Icon buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Link
                      href={`/stories/${story.id}`}
                      title="Chat"
                      onClick={() => setActiveStoryId(story.id)}
                      className="flex items-center justify-center rounded-md transition-colors duration-150"
                      style={{
                        width: '24px',
                        height: '24px',
                        background: isOnChat ? '#1e3a5f' : 'transparent',
                        color: isOnChat ? '#3b82f6' : '#475569',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/stories/${story.id}/knowledge`}
                      title="Knowledge Graph"
                      onClick={() => setActiveStoryId(story.id)}
                      className="flex items-center justify-center rounded-md transition-colors duration-150"
                      style={{
                        width: '24px',
                        height: '24px',
                        background: isOnGraph ? '#2d1b4e' : 'transparent',
                        color: isOnGraph ? '#7c3aed' : '#475569',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="5" cy="19" r="2" />
                        <circle cx="19" cy="19" r="2" />
                        <line x1="12" y1="7" x2="5" y2="17" />
                        <line x1="12" y1="7" x2="19" y2="17" />
                        <line x1="5" y1="19" x2="19" y2="19" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {stories.length === 0 && (
          <p className="text-xs px-3 py-4 text-center" style={{ color: '#334155' }}>
            No stories yet
          </p>
        )}
      </div>

      {/* New Story section */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid #1a1a2e' }}>
        <AnimatePresence mode="wait">
          {creating ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onSubmit={handleCreate}
              className="flex flex-col gap-2"
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Story title…"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: '#0f0f1f',
                  border: '1px solid #3b82f6',
                  color: '#e2e8f0',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setCreating(false);
                    setNewTitle('');
                  }
                }}
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={loading || !newTitle.trim()}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={{ background: '#7c3aed', color: '#fff' }}
                >
                  {loading ? '…' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewTitle(''); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: '#1e1e2e', color: '#94a3b8' }}
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreating(true)}
              className="w-full py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #7c3aed22, #3b82f622)',
                border: '1px solid #7c3aed44',
                color: '#a78bfa',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #7c3aed44, #3b82f644)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #7c3aed22, #3b82f622)';
              }}
            >
              + New Story
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
