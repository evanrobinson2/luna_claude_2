import { create } from 'zustand';
import type {
  LunaStore,
  Story,
  Message,
  StoryImage,
  KnowledgeNode,
  KnowledgeEdge,
  NodeAttributes,
} from '../types/index';

export const useLunaStore = create<LunaStore>((set) => ({
  // Stories
  stories: [],
  activeStoryId: null,
  setActiveStoryId: (id) => set({ activeStoryId: id }),
  setStories: (stories) => set({ stories }),
  addStory: (story) => set((state) => ({ stories: [...state.stories, story] })),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  // Images
  images: [],
  activeImageIndex: 0,
  setImages: (images) => set({ images }),
  addImage: (image) =>
    set((state) => ({ images: [...state.images, image] })),
  setActiveImageIndex: (index) => set({ activeImageIndex: index }),

  // Knowledge
  knowledgeNodes: [],
  knowledgeEdges: [],
  setKnowledgeNodes: (nodes) => set({ knowledgeNodes: nodes }),
  setKnowledgeEdges: (edges) => set({ knowledgeEdges: edges }),
  upsertKnowledgeNode: (node) =>
    set((state) => {
      const exists = state.knowledgeNodes.some((n) => n.id === node.id);
      if (exists) {
        return {
          knowledgeNodes: state.knowledgeNodes.map((n) =>
            n.id === node.id ? node : n
          ),
        };
      }
      return { knowledgeNodes: [...state.knowledgeNodes, node] };
    }),

  // UI
  isThinking: false,
  setIsThinking: (v) => set({ isThinking: v }),
  metadataImage: null,
  setMetadataImage: (image) => set({ metadataImage: image }),
}));
