'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import TurnaroundSheet from './TurnaroundSheet';
import type { KnowledgeNodeData, NodeType, CharacterAttributes } from '../types';

const NODE_COLORS: Record<NodeType, string> = {
  Character: '#7c3aed',
  Location: '#0891b2',
  Event: '#b45309',
  Mission: '#16a34a',
  StyleRule: '#db2777',
  WorldRule: '#dc2626',
  Theme: '#9333ea',
};

const NODE_ICONS: Record<NodeType, string> = {
  Character: '◉',
  Location: '◎',
  Event: '◆',
  Mission: '◈',
  StyleRule: '◇',
  WorldRule: '▲',
  Theme: '✦',
};

interface NodeCardProps {
  data: KnowledgeNodeData;
}

export default function NodeCard({ data }: NodeCardProps) {
  const { node, turnaroundImages = [], onEdit, onGenerateTurnaround } = data;
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedAttrs, setEditedAttrs] = useState<Record<string, string>>({});
  const [generatingTurnaround, setGeneratingTurnaround] = useState(false);

  const color = NODE_COLORS[node.type] ?? '#64748b';
  const icon = NODE_ICONS[node.type] ?? '●';

  const attrs = node.attributes as Record<string, unknown>;
  const charAttrs = node.attributes as CharacterAttributes;
  const isMainChar =
    node.type === 'Character' &&
    (charAttrs.status === 'main' || charAttrs.status === 'sub-main');

  function startEdit() {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (typeof v === 'string') flat[k] = v;
      else if (Array.isArray(v)) flat[k] = v.join(', ');
      else if (v !== undefined && v !== null) flat[k] = String(v);
    }
    setEditedAttrs(flat);
    setEditMode(true);
  }

  async function saveEdit() {
    const parsed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(editedAttrs)) {
      parsed[k] = v;
    }
    onEdit(node.id, parsed);
    setEditMode(false);
  }

  async function handleGenerateTurnaround() {
    setGeneratingTurnaround(true);
    try {
      await onGenerateTurnaround(node.id);
    } finally {
      setGeneratingTurnaround(false);
    }
  }

  return (
    <div
      style={{
        background: '#0f0f1a',
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: '10px',
        minWidth: '180px',
        maxWidth: '280px',
        boxShadow: `0 0 0 1px ${color}11, 0 4px 20px rgba(0,0,0,0.4)`,
        cursor: 'default',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color, border: 'none', width: '8px', height: '8px' }}
      />

      {/* Header — click to expand/collapse */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => { if (!editMode) setExpanded((v) => !v); }}
      >
        <span style={{ color, fontSize: '14px' }}>{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-semibold truncate" style={{ color: '#e2e8f0' }}>
            {node.name}
          </p>
          <p className="text-xs" style={{ color }}>
            {node.type}
          </p>
        </div>
        <span className="text-xs" style={{ color: '#334155' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{ borderTop: `1px solid ${color}22` }}
          className="px-3 pb-3"
        >
          {/* Attributes */}
          <div className="mt-2 space-y-1.5">
            {editMode ? (
              <>
                {Object.entries(editedAttrs).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs mb-0.5" style={{ color: '#64748b' }}>
                      {k}
                    </p>
                    <input
                      value={v}
                      onChange={(e) =>
                        setEditedAttrs((prev) => ({ ...prev, [k]: e.target.value }))
                      }
                      className="w-full px-2 py-1 rounded text-xs outline-none"
                      style={{
                        background: '#050510',
                        border: `1px solid ${color}55`,
                        color: '#e2e8f0',
                      }}
                    />
                  </div>
                ))}
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 py-1 rounded text-xs font-medium"
                    style={{ background: color, color: '#fff' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: '#1e1e2e', color: '#94a3b8' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {Object.entries(attrs).map(([k, v]) => {
                  if (v === undefined || v === null || v === false) return null;
                  const display = Array.isArray(v) ? v.join(', ') : String(v);
                  return (
                    <div key={k}>
                      <p className="text-xs" style={{ color: '#475569' }}>
                        {k}
                      </p>
                      <p className="text-xs break-words" style={{ color: '#94a3b8' }}>
                        {display}
                      </p>
                    </div>
                  );
                })}

                {/* Edit button */}
                <button
                  onClick={startEdit}
                  className="mt-2 w-full py-1 rounded text-xs font-medium"
                  style={{ background: '#1e1e2e', color: '#64748b' }}
                >
                  Edit attributes
                </button>
              </>
            )}
          </div>

          {/* Turnaround section for main characters */}
          {isMainChar && !charAttrs.turnaround_generated && (
            <button
              onClick={handleGenerateTurnaround}
              disabled={generatingTurnaround}
              className="mt-3 w-full py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
              style={{
                background: `${color}22`,
                border: `1px solid ${color}44`,
                color,
              }}
            >
              {generatingTurnaround ? 'Generating…' : 'Generate Turnaround Sheet'}
            </button>
          )}

          {/* Turnaround images */}
          {turnaroundImages.length > 0 && (
            <TurnaroundSheet images={turnaroundImages} />
          )}
        </motion.div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color, border: 'none', width: '8px', height: '8px' }}
      />
    </div>
  );
}
