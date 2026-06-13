'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/stories');
      } else if (res.status === 401) {
        setError('Incorrect password');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050510' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm px-8 py-10 rounded-2xl"
        style={{ background: '#0a0a1a', border: '1px solid #1e1e3a' }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Luna
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#64748b' }}>
            Creative AI Storytelling
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#94a3b8' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
              style={{
                background: '#0f0f1f',
                border: '1px solid #1e1e3a',
                color: '#e2e8f0',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid #7c3aed';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124, 58, 237, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid #1e1e3a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs"
              style={{ color: '#f87171' }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity duration-200 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              color: '#ffffff',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
