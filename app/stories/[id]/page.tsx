'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLunaStore } from '../../../lib/store';
import ChatPanel from '../../../components/ChatPanel';
import VisualCanvas from '../../../components/VisualCanvas';
import MetadataDialog from '../../../components/MetadataDialog';

export default function StoryPage() {
  const params = useParams();
  const storyId = params.id as string;

  const { setMessages, setImages, setActiveStoryId, upsertKnowledgeNode } = useLunaStore((s) => ({
    setMessages: s.setMessages,
    setImages: s.setImages,
    setActiveStoryId: s.setActiveStoryId,
    upsertKnowledgeNode: s.upsertKnowledgeNode,
  }));

  useEffect(() => {
    if (!storyId) return;
    setActiveStoryId(storyId);

    // Fetch messages
    fetch(`/api/messages?storyId=${storyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);

    // Fetch images
    fetch(`/api/images?storyId=${storyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setImages(data);
      })
      .catch(console.error);

    // Fetch knowledge nodes for this story
    fetch(`/api/knowledge?storyId=${storyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.nodes && Array.isArray(data.nodes)) {
          data.nodes.forEach((n: Parameters<typeof upsertKnowledgeNode>[0]) =>
            upsertKnowledgeNode(n)
          );
        }
      })
      .catch(console.error);
  }, [storyId, setMessages, setImages, setActiveStoryId, upsertKnowledgeNode]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat Panel — left half */}
      <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid #1e1e3a' }}>
        <ChatPanel storyId={storyId} />
      </div>

      {/* Visual Canvas — right half */}
      <div className="flex-1 overflow-hidden">
        <VisualCanvas storyId={storyId} />
      </div>

      {/* Metadata Dialog — global overlay */}
      <MetadataDialog />
    </div>
  );
}
