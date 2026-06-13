'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLunaStore } from '../lib/store';
import type { Message, StoryImage } from '../types';

interface ChatPanelProps {
  storyId: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'linear-gradient(135deg, #1a1a3e, #2a1a4e)', maxWidth: '180px' }}
      >
        <span className="text-xs" style={{ color: '#94a3b8' }}>Luna is thinking</span>
        <span
          className="flex gap-0.5 ml-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="inline-block rounded-full"
              style={{ width: '4px', height: '4px', background: '#7c3aed' }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function MessageBubble({ message, inlineImage }: { message: Message; inlineImage?: StoryImage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div style={{ maxWidth: '80%' }}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
          style={
            isUser
              ? {
                  background: '#1e1e2e',
                  border: '1px solid #2a2a4a',
                  color: '#e2e8f0',
                  borderBottomRightRadius: '4px',
                }
              : {
                  background: 'linear-gradient(135deg, #1a1a3e, #2a1a4e)',
                  border: '1px solid #2d1b5e',
                  boxShadow: '0 0 0 1px #7c3aed11, 0 4px 20px rgba(124,58,237,0.1)',
                  color: '#e2e8f0',
                  borderBottomLeftRadius: '4px',
                }
          }
        >
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Inline image preview */}
        {inlineImage && (
          <div className="mt-2 rounded-lg overflow-hidden" style={{ maxWidth: '200px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inlineImage.url}
              alt="Generated scene"
              className="w-full h-auto rounded-lg"
              style={{ border: '1px solid #1e1e3a' }}
            />
            <p className="text-xs mt-1" style={{ color: '#475569' }}>
              Scene generated ✦
            </p>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          style={{ color: '#334155' }}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ storyId }: ChatPanelProps) {
  const { messages, addMessage, addImage, isThinking, setIsThinking, upsertKnowledgeNode } =
    useLunaStore((s) => ({
      messages: s.messages,
      addMessage: s.addMessage,
      addImage: s.addImage,
      isThinking: s.isThinking,
      setIsThinking: s.setIsThinking,
      upsertKnowledgeNode: s.upsertKnowledgeNode,
    }));

  const [input, setInput] = useState('');
  const [messageImages, setMessageImages] = useState<Record<string, StoryImage>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const content = input.trim();
    if (!content || isThinking) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsThinking(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, content }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      addMessage(data.message);

      if (data.image) {
        addImage(data.image);
        // Associate image with assistant message
        setMessageImages((prev) => ({
          ...prev,
          [data.message.id]: data.image,
        }));
      }

      if (Array.isArray(data.knowledgeUpdates)) {
        for (const node of data.knowledgeUpdates) {
          upsertKnowledgeNode(node);
        }
      }
    } catch (err) {
      console.error('[ChatPanel] Failed to send message:', err);
    } finally {
      setIsThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#060612' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1a1a2e' }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: '#7c3aed' }}>
            Luna
          </p>
          <p className="text-xs" style={{ color: '#334155' }}>
            Your AI narrator
          </p>
        </div>
        <div
          className="flex items-center gap-1.5"
        >
          <div
            className="rounded-full"
            style={{ width: '6px', height: '6px', background: '#22c55e' }}
          />
          <span className="text-xs" style={{ color: '#334155' }}>
            Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence>
          {messages.length === 0 && !isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div
                className="text-4xl mb-4"
                style={{ filter: 'drop-shadow(0 0 16px #7c3aed66)' }}
              >
                ✦
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#64748b' }}>
                Begin your story
              </p>
              <p className="text-xs" style={{ color: '#334155' }}>
                Describe a scene, character, or world…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            inlineImage={msg.role === 'assistant' ? messageImages[msg.id] : undefined}
          />
        ))}

        {isThinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid #1a1a2e', background: '#060612' }}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Continue the story…"
            rows={1}
            disabled={isThinking}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
            style={{
              background: '#0f0f1f',
              border: '1px solid #1e1e3a',
              color: '#e2e8f0',
              maxHeight: '120px',
              lineHeight: '1.5',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = '1px solid #7c3aed66';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid #1e1e3a';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-40"
            style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            }}
            onMouseEnter={(e) => {
              if (!isThinking) {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        <p className="text-xs mt-2 text-center" style={{ color: '#1e293b' }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
