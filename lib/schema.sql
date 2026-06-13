CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  media_types TEXT[] DEFAULT ARRAY['chat','images']
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  revised_prompt TEXT,
  model_params JSONB DEFAULT '{}',
  url TEXT NOT NULL,
  trigger_reason TEXT,
  knowledge_node_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  attributes JSONB DEFAULT '{}',
  user_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (story_id, name, type)
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  from_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  label TEXT,
  UNIQUE (story_id, from_node_id, to_node_id)
);

CREATE TABLE IF NOT EXISTS turnaround_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  angle TEXT NOT NULL,
  story_image_id UUID REFERENCES story_images(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
