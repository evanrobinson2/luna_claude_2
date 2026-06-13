'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLunaStore } from '../../../../lib/store';
import KnowledgeGraph from '../../../../components/KnowledgeGraph';

export default function KnowledgePage() {
  const params = useParams();
  const storyId = params.id as string;

  const { setKnowledgeNodes, setKnowledgeEdges } = useLunaStore((s) => ({
    setKnowledgeNodes: s.setKnowledgeNodes,
    setKnowledgeEdges: s.setKnowledgeEdges,
  }));

  useEffect(() => {
    if (!storyId) return;
    fetch(`/api/knowledge?storyId=${storyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.nodes) setKnowledgeNodes(data.nodes);
        if (data?.edges) setKnowledgeEdges(data.edges);
      })
      .catch(console.error);
  }, [storyId, setKnowledgeNodes, setKnowledgeEdges]);

  return (
    <div className="relative w-full h-full" style={{ background: '#050510' }}>
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href={`/stories/${storyId}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150"
          style={{ background: '#0a0a1a', color: '#94a3b8', border: '1px solid #1e1e3a' }}
        >
          ← Back to Story
        </Link>
      </div>

      <KnowledgeGraph storyId={storyId} />
    </div>
  );
}
