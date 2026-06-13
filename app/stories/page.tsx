'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLunaStore } from '../../lib/store';

export default function StoriesPage() {
  const router = useRouter();
  const { stories, addStory } = useLunaStore((s) => ({
    stories: s.stories,
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
        router.push(`/stories/${story.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="text-6xl mb-6"
            style={{ filter: 'drop-shadow(0 0 24px #7c3aed)' }}
          >
            ✦
          </div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: '#e2e8f0' }}>
            Begin a new story
          </h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Luna will help you build a rich narrative world with characters, locations, and events.
          </p>
          {creating ? (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleCreate}
              className="flex gap-2 justify-center"
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Story title…"
                className="px-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: '#0f0f1f',
                  border: '1px solid #3b82f6',
                  color: '#e2e8f0',
                  width: '220px',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ background: '#7c3aed', color: '#fff' }}
              >
                {loading ? '…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#1e1e2e', color: '#94a3b8' }}
              >
                Cancel
              </button>
            </motion.form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                color: '#fff',
              }}
            >
              + New Story
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: '#e2e8f0' }}>
            Your Stories
          </h1>
          {creating ? (
            <motion.form
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleCreate}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Story title…"
                className="px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{
                  background: '#0f0f1f',
                  border: '1px solid #3b82f6',
                  color: '#e2e8f0',
                  width: '180px',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60"
                style={{ background: '#7c3aed', color: '#fff' }}
              >
                {loading ? '…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: '#1e1e2e', color: '#94a3b8' }}
              >
                Cancel
              </button>
            </motion.form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#7c3aed', color: '#fff' }}
            >
              + New Story
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="rounded-xl p-5 flex flex-col gap-3 cursor-pointer"
              style={{
                background: '#0a0a1a',
                border: '1px solid #1e1e3a',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e3a';
              }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1" style={{ color: '#e2e8f0' }}>
                  {story.title}
                </h3>
                <p className="text-xs" style={{ color: '#475569' }}>
                  {new Date(story.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #1e1e3a' }}>
                <Link
                  href={`/stories/${story.id}`}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-colors duration-150"
                  style={{ background: '#1e1e2e', color: '#94a3b8' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = '#2a2a4a';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = '#1e1e2e';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8';
                  }}
                >
                  Chat
                </Link>
                <Link
                  href={`/stories/${story.id}/knowledge`}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center transition-colors duration-150"
                  style={{ background: '#1e1e2e', color: '#94a3b8' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = '#2a2a4a';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = '#1e1e2e';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8';
                  }}
                >
                  Graph
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
