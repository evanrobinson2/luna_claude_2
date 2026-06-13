import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

// Re-export sql for convenient use
export { sql };

// Generic query wrapper with typed result
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await sql<T>(strings as TemplateStringsArray, ...values as Parameters<typeof sql>[1][]);
  return result.rows;
}

// Run a raw SQL string (used for schema init)
export async function runRawSQL(sqlString: string): Promise<void> {
  const statements = sqlString
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }
}

// Initialize schema on cold start — idempotent via IF NOT EXISTS
let schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await runRawSQL(schemaSql);
  schemaInitialized = true;
}

// ─── Story helpers ─────────────────────────────────────────────────────────────

export async function getStories() {
  return sql`
    SELECT id, title, created_at, updated_at, media_types
    FROM stories
    ORDER BY updated_at DESC
  `.then((r) => r.rows);
}

export async function getStoryById(id: string) {
  return sql`
    SELECT id, title, created_at, updated_at, media_types
    FROM stories
    WHERE id = ${id}
  `.then((r) => r.rows[0] ?? null);
}

export async function createStory(title: string) {
  return sql`
    INSERT INTO stories (title) VALUES (${title})
    RETURNING *
  `.then((r) => r.rows[0]);
}

export async function updateStory(id: string, title: string) {
  return sql`
    UPDATE stories SET title = ${title}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `.then((r) => r.rows[0] ?? null);
}

// ─── Message helpers ───────────────────────────────────────────────────────────

export async function getMessagesByStory(storyId: string, limit = 100) {
  return sql`
    SELECT id, story_id, role, content, created_at
    FROM messages
    WHERE story_id = ${storyId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `.then((r) => r.rows);
}

export async function createMessage(
  storyId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
) {
  return sql`
    INSERT INTO messages (story_id, role, content)
    VALUES (${storyId}, ${role}, ${content})
    RETURNING *
  `.then((r) => r.rows[0]);
}

// ─── Image helpers ─────────────────────────────────────────────────────────────

export async function getImagesByStory(storyId: string) {
  return sql`
    SELECT id, story_id, message_id, prompt, revised_prompt, model_params, url, trigger_reason, knowledge_node_ids, created_at
    FROM story_images
    WHERE story_id = ${storyId}
    ORDER BY created_at ASC
  `.then((r) => r.rows);
}

export async function createStoryImage(params: {
  storyId: string;
  messageId: string | null;
  prompt: string;
  revisedPrompt: string | null;
  modelParams: Record<string, unknown>;
  url: string;
  triggerReason: string | null;
  knowledgeNodeIds: string[];
}) {
  const knowledgeNodeIdsArray = `{${params.knowledgeNodeIds.join(',')}}`;
  return sql`
    INSERT INTO story_images (story_id, message_id, prompt, revised_prompt, model_params, url, trigger_reason, knowledge_node_ids)
    VALUES (
      ${params.storyId},
      ${params.messageId},
      ${params.prompt},
      ${params.revisedPrompt},
      ${JSON.stringify(params.modelParams)},
      ${params.url},
      ${params.triggerReason},
      ${knowledgeNodeIdsArray}::uuid[]
    )
    RETURNING *
  `.then((r) => r.rows[0]);
}

// ─── Knowledge node helpers ────────────────────────────────────────────────────

export async function getKnowledgeNodesByStory(storyId: string) {
  return sql`
    SELECT id, story_id, type, name, attributes, user_verified, created_at, updated_at
    FROM knowledge_nodes
    WHERE story_id = ${storyId}
    ORDER BY created_at ASC
  `.then((r) => r.rows);
}

export async function getKnowledgeNodeById(nodeId: string) {
  return sql`
    SELECT id, story_id, type, name, attributes, user_verified, created_at, updated_at
    FROM knowledge_nodes
    WHERE id = ${nodeId}
  `.then((r) => r.rows[0] ?? null);
}

export async function upsertKnowledgeNode(params: {
  storyId: string;
  type: string;
  name: string;
  attributes: Record<string, unknown>;
}) {
  return sql`
    INSERT INTO knowledge_nodes (story_id, type, name, attributes)
    VALUES (${params.storyId}, ${params.type}, ${params.name}, ${JSON.stringify(params.attributes)})
    ON CONFLICT (story_id, name, type) DO UPDATE
      SET attributes = knowledge_nodes.attributes || ${JSON.stringify(params.attributes)},
          updated_at = now()
    RETURNING *
  `.then((r) => r.rows[0]);
}

export async function updateKnowledgeNode(
  nodeId: string,
  attributes: Record<string, unknown>
) {
  return sql`
    UPDATE knowledge_nodes
    SET attributes = attributes || ${JSON.stringify(attributes)}, updated_at = now()
    WHERE id = ${nodeId}
    RETURNING *
  `.then((r) => r.rows[0] ?? null);
}

export async function deleteKnowledgeNode(nodeId: string) {
  await sql`DELETE FROM knowledge_nodes WHERE id = ${nodeId}`;
}

// ─── Knowledge edge helpers ────────────────────────────────────────────────────

export async function getKnowledgeEdgesByStory(storyId: string) {
  return sql`
    SELECT id, story_id, from_node_id, to_node_id, label
    FROM knowledge_edges
    WHERE story_id = ${storyId}
  `.then((r) => r.rows);
}

export async function upsertKnowledgeEdge(params: {
  storyId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
}) {
  return sql`
    INSERT INTO knowledge_edges (story_id, from_node_id, to_node_id, label)
    VALUES (${params.storyId}, ${params.fromNodeId}, ${params.toNodeId}, ${params.label})
    ON CONFLICT (story_id, from_node_id, to_node_id) DO UPDATE
      SET label = ${params.label}
    RETURNING *
  `.then((r) => r.rows[0]);
}

// ─── Turnaround helpers ────────────────────────────────────────────────────────

export async function getTurnaroundImagesByCharacter(characterNodeId: string) {
  return sql`
    SELECT ti.id, ti.character_node_id, ti.angle, ti.story_image_id, ti.created_at,
           si.url, si.prompt
    FROM turnaround_images ti
    JOIN story_images si ON si.id = ti.story_image_id
    WHERE ti.character_node_id = ${characterNodeId}
    ORDER BY ti.created_at ASC
  `.then((r) => r.rows);
}

export async function createTurnaroundImage(params: {
  characterNodeId: string;
  angle: string;
  storyImageId: string;
}) {
  return sql`
    INSERT INTO turnaround_images (character_node_id, angle, story_image_id)
    VALUES (${params.characterNodeId}, ${params.angle}, ${params.storyImageId})
    RETURNING *
  `.then((r) => r.rows[0]);
}
