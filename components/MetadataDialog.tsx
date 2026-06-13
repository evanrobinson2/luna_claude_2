'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLunaStore } from '../lib/store';

export default function MetadataDialog() {
  const { metadataImage, setMetadataImage, knowledgeNodes } = useLunaStore((s) => ({
    metadataImage: s.metadataImage,
    setMetadataImage: s.setMetadataImage,
    knowledgeNodes: s.knowledgeNodes,
  }));

  if (!metadataImage) return null;

  const usedNodes = knowledgeNodes.filter((n) =>
    (metadataImage.knowledge_node_ids ?? []).includes(n.id)
  );

  const promptDiffers =
    metadataImage.revised_prompt &&
    metadataImage.revised_prompt !== metadataImage.prompt;

  return (
    <AnimatePresence>
      {metadataImage && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.72)' }}
          onClick={() => setMetadataImage(null)}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6"
            style={{
              background: '#0f0f1a',
              border: '1px solid #1e1e3a',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMetadataImage(null)}
              className="absolute top-4 right-4 flex items-center justify-center rounded-lg transition-colors duration-150"
              style={{
                width: '28px',
                height: '28px',
                background: '#1e1e2e',
                color: '#64748b',
              }}
            >
              ×
            </button>

            <h2 className="text-sm font-semibold mb-5" style={{ color: '#e2e8f0' }}>
              Image Metadata
            </h2>

            {/* Prompt */}
            <section className="mb-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                Prompt
              </p>
              <pre
                className="text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words"
                style={{
                  background: '#050510',
                  border: '1px solid #1e1e3a',
                  color: '#a78bfa',
                  fontFamily: 'monospace',
                }}
              >
                {metadataImage.prompt}
              </pre>
            </section>

            {/* Revised prompt */}
            {promptDiffers && (
              <section className="mb-4">
                <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Revised Prompt (by DALL-E)
                </p>
                <pre
                  className="text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words"
                  style={{
                    background: '#050510',
                    border: '1px solid #1e1e3a',
                    color: '#67e8f9',
                    fontFamily: 'monospace',
                  }}
                >
                  {metadataImage.revised_prompt}
                </pre>
              </section>
            )}

            {/* Model parameters */}
            <section className="mb-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                Model Parameters
              </p>
              <pre
                className="text-xs rounded-lg p-3 overflow-x-auto"
                style={{
                  background: '#050510',
                  border: '1px solid #1e1e3a',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(metadataImage.model_params, null, 2)}
              </pre>
            </section>

            {/* Trigger reason */}
            {metadataImage.trigger_reason && (
              <section className="mb-4">
                <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                  Trigger Reason
                </p>
                <p className="text-xs rounded-lg px-3 py-2" style={{
                  background: '#050510',
                  border: '1px solid #1e1e3a',
                  color: '#94a3b8',
                }}>
                  {metadataImage.trigger_reason}
                </p>
              </section>
            )}

            {/* Timestamp */}
            <section className="mb-4">
              <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>
                Generated At
              </p>
              <p className="text-xs" style={{ color: '#475569' }}>
                {new Date(metadataImage.created_at).toLocaleString()}
              </p>
            </section>

            {/* Knowledge nodes used */}
            {usedNodes.length > 0 && (
              <section>
                <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>
                  Knowledge Nodes Used
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {usedNodes.map((n) => (
                    <span
                      key={n.id}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#1e1e3a', color: '#a78bfa' }}
                    >
                      {n.type}: {n.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
