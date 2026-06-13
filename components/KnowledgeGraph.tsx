'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLunaStore } from '../lib/store';
import NodeCard from './NodeCard';
import type { KnowledgeNode, NodeType, NodeAttributes, TurnaroundImage } from '../types';

const nodeTypes = { knowledgeNode: NodeCard };

const NODE_COLORS: Record<NodeType, string> = {
  Character: '#7c3aed',
  Location: '#0891b2',
  Event: '#b45309',
  Mission: '#16a34a',
  StyleRule: '#db2777',
  WorldRule: '#dc2626',
  Theme: '#9333ea',
};

const GRID_COLS = 4;
const NODE_SPACING_X = 300;
const NODE_SPACING_Y = 220;

interface KnowledgeGraphProps {
  storyId: string;
}

export default function KnowledgeGraph({ storyId }: KnowledgeGraphProps) {
  const { knowledgeNodes, knowledgeEdges, upsertKnowledgeNode } = useLunaStore((s) => ({
    knowledgeNodes: s.knowledgeNodes,
    knowledgeEdges: s.knowledgeEdges,
    upsertKnowledgeNode: s.upsertKnowledgeNode,
  }));

  // Handle node attribute edits
  const handleEdit = useCallback(
    async (nodeId: string, attributes: NodeAttributes) => {
      try {
        const res = await fetch(`/api/knowledge/${nodeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributes }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.node) upsertKnowledgeNode(data.node);
        }
      } catch (err) {
        console.error('[KnowledgeGraph] Edit failed:', err);
      }
    },
    [upsertKnowledgeNode]
  );

  // Handle turnaround generation
  const handleGenerateTurnaround = useCallback(
    async (nodeId: string) => {
      try {
        const res = await fetch('/api/turnaround', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterNodeId: nodeId }),
        });
        if (res.ok) {
          const data = await res.json();
          // Refresh node to get turnaround_generated = true
          const nodeRes = await fetch(`/api/knowledge?storyId=${storyId}`);
          if (nodeRes.ok) {
            const nodeData = await nodeRes.json();
            if (nodeData.nodes) {
              for (const n of nodeData.nodes) {
                upsertKnowledgeNode(n);
              }
            }
          }
          return data;
        }
      } catch (err) {
        console.error('[KnowledgeGraph] Turnaround failed:', err);
      }
    },
    [storyId, upsertKnowledgeNode]
  );

  // Build turnaround images map (node id → images)
  // We'll fetch them per-character node when they're Character type
  const turnaroundMap = useMemo<Record<string, TurnaroundImage[]>>(() => {
    return {};
  }, []);

  // Convert KnowledgeNodes to React Flow nodes
  const rfNodes: Node[] = useMemo(() => {
    return knowledgeNodes.map((kn, i) => {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      return {
        id: kn.id,
        type: 'knowledgeNode',
        position: { x: col * NODE_SPACING_X + 60, y: row * NODE_SPACING_Y + 60 },
        data: {
          node: kn,
          turnaroundImages: turnaroundMap[kn.id] ?? [],
          onEdit: handleEdit,
          onGenerateTurnaround: handleGenerateTurnaround,
        },
      };
    });
  }, [knowledgeNodes, turnaroundMap, handleEdit, handleGenerateTurnaround]);

  // Convert KnowledgeEdges to React Flow edges
  const rfEdges: Edge[] = useMemo(() => {
    return knowledgeEdges.map((ke) => ({
      id: ke.id,
      source: ke.from_node_id,
      target: ke.to_node_id,
      label: ke.label ?? undefined,
      animated: true,
      style: {
        stroke: '#3b82f644',
        strokeWidth: 1.5,
        filter: 'drop-shadow(0 0 4px #3b82f644)',
      },
      labelStyle: { fill: '#475569', fontSize: 10 },
      labelBgStyle: { fill: '#0f0f1a' },
    }));
  }, [knowledgeEdges]);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const miniMapNodeColor = useCallback((node: Node) => {
    const kn = node.data?.node as KnowledgeNode | undefined;
    if (!kn) return '#1e1e3a';
    return NODE_COLORS[kn.type] ?? '#1e1e3a';
  }, []);

  if (knowledgeNodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center"
        style={{ background: '#050510' }}
      >
        <div
          className="text-5xl mb-4"
          style={{ filter: 'drop-shadow(0 0 20px #7c3aed44)' }}
        >
          ✦
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: '#334155' }}>
          No knowledge nodes yet
        </p>
        <p className="text-xs" style={{ color: '#1e293b' }}>
          Chat with Luna to build the story world
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#050510' }}>
      {/* Stars background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, #ffffff11 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 80% 10%, #ffffff0a 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 50% 70%, #ffffff0d 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 10% 90%, #ffffff09 0%, transparent 100%), ' +
            'radial-gradient(1px 1px at 95% 50%, #ffffff0b 0%, transparent 100%)',
          zIndex: 0,
        }}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="#1a1a2e"
        />
        <Controls
          style={{
            background: '#0a0a1a',
            border: '1px solid #1e1e3a',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor="rgba(5,5,16,0.85)"
          style={{
            background: '#08080f',
            border: '1px solid #1e1e3a',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
