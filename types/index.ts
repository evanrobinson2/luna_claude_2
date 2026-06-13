// ─── Enums ────────────────────────────────────────────────────────────────────

export type NodeType =
  | 'Character'
  | 'Location'
  | 'Event'
  | 'Mission'
  | 'StyleRule'
  | 'WorldRule'
  | 'Theme';

export type CharacterStatus = 'extra' | 'sub-main' | 'main';

export type MessageRole = 'user' | 'assistant' | 'system';

// ─── Database entity types ─────────────────────────────────────────────────────

export interface Story {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  media_types: string[];
}

export interface Message {
  id: string;
  story_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface StoryImage {
  id: string;
  story_id: string;
  message_id: string | null;
  prompt: string;
  revised_prompt: string | null;
  model_params: Record<string, unknown>;
  url: string;
  trigger_reason: string | null;
  knowledge_node_ids: string[];
  created_at: string;
}

export interface TurnaroundImage {
  id: string;
  character_node_id: string;
  angle: string;
  story_image_id: string;
  created_at: string;
  // Joined fields
  url?: string;
  prompt?: string;
}

export type TurnaroundSheet = TurnaroundImage[];

// ─── Knowledge node attribute shapes ──────────────────────────────────────────

export interface CharacterAttributes {
  visualDescription?: string;
  status?: CharacterStatus;
  traits?: string[];
  age?: string;
  occupation?: string;
  backstory?: string;
  relationships?: string[];
  turnaround_generated?: boolean;
  [key: string]: unknown;
}

export interface LocationAttributes {
  description?: string;
  climate?: string;
  significance?: string;
  connectedLocations?: string[];
  [key: string]: unknown;
}

export interface EventAttributes {
  description?: string;
  participants?: string[];
  outcome?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface MissionAttributes {
  objective?: string;
  status?: 'active' | 'completed' | 'failed' | 'pending';
  participants?: string[];
  stakes?: string;
  [key: string]: unknown;
}

export interface StyleRuleAttributes {
  promptFragment?: string;
  description?: string;
  priority?: number;
  [key: string]: unknown;
}

export interface WorldRuleAttributes {
  description?: string;
  implications?: string[];
  [key: string]: unknown;
}

export interface ThemeAttributes {
  description?: string;
  motifs?: string[];
  [key: string]: unknown;
}

export type NodeAttributes =
  | CharacterAttributes
  | LocationAttributes
  | EventAttributes
  | MissionAttributes
  | StyleRuleAttributes
  | WorldRuleAttributes
  | ThemeAttributes;

export interface KnowledgeNode {
  id: string;
  story_id: string;
  type: NodeType;
  name: string;
  attributes: NodeAttributes;
  user_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEdge {
  id: string;
  story_id: string;
  from_node_id: string;
  to_node_id: string;
  label: string | null;
}

// ─── API request / response shapes ────────────────────────────────────────────

export interface PostMessageRequest {
  storyId: string;
  content: string;
}

export interface PostMessageResponse {
  message: Message;
  image?: StoryImage;
  knowledgeUpdates: KnowledgeNode[];
}

export interface PostImageRequest {
  storyId: string;
  prompt: string;
  messageId?: string;
  triggerReason?: string;
  knowledgeNodeIds?: string[];
}

export interface PostTurnaroundRequest {
  characterNodeId: string;
}

export interface PostTurnaroundResponse {
  images: (StoryImage & { angle: string })[];
}

export interface ImageReasoningResult {
  shouldGenerate: boolean;
  reason: string;
  subjectDescription: string;
}

export interface KnowledgeExtractResult {
  type: NodeType;
  name: string;
  attributes: NodeAttributes;
  links: { toName: string; toType: NodeType; label: string }[];
}

// ─── React Flow node / edge data ──────────────────────────────────────────────

export interface KnowledgeNodeData {
  node: KnowledgeNode;
  turnaroundImages?: TurnaroundImage[];
  onEdit: (nodeId: string, attributes: NodeAttributes) => void;
  onGenerateTurnaround: (nodeId: string) => void;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export interface LunaStore {
  // Stories
  stories: Story[];
  activeStoryId: string | null;
  setActiveStoryId: (id: string | null) => void;
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  // Images
  images: StoryImage[];
  activeImageIndex: number;
  setImages: (images: StoryImage[]) => void;
  addImage: (image: StoryImage) => void;
  setActiveImageIndex: (index: number) => void;

  // Knowledge
  knowledgeNodes: KnowledgeNode[];
  knowledgeEdges: KnowledgeEdge[];
  setKnowledgeNodes: (nodes: KnowledgeNode[]) => void;
  setKnowledgeEdges: (edges: KnowledgeEdge[]) => void;
  upsertKnowledgeNode: (node: KnowledgeNode) => void;

  // UI
  isThinking: boolean;
  setIsThinking: (v: boolean) => void;
  metadataImage: StoryImage | null;
  setMetadataImage: (image: StoryImage | null) => void;
}
