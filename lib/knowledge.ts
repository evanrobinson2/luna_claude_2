import { getOpenAIClient, CHAT_MODEL } from './openai';
import {
  upsertKnowledgeNode,
  upsertKnowledgeEdge,
  getKnowledgeNodesByStory,
} from './db';
import type { KnowledgeExtractResult, KnowledgeNode, NodeType } from '../types';

const EXTRACT_PROMPT = `Extract knowledge entities from this narrative exchange. Return JSON array of nodes to upsert:
[{ type, name, attributes, links: [{toName, toType, label}] }]
Known types: Character, Location, Event, Mission, StyleRule, WorldRule, Theme
For Characters include: visualDescription, status (extra/sub-main/main), traits[]
Return only a JSON array, no markdown fences.`;

export async function extractKnowledge(
  storyId: string,
  userMessage: string,
  assistantResponse: string
): Promise<KnowledgeNode[]> {
  const client = getOpenAIClient();
  const exchange = `User: ${userMessage}\n\nNarrator: ${assistantResponse}`;

  let extracted: KnowledgeExtractResult[] = [];

  try {
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: exchange },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    // The model may return { nodes: [...] } or just [...]
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      extracted = parsed as KnowledgeExtractResult[];
    } else if (Array.isArray(parsed.nodes)) {
      extracted = parsed.nodes as KnowledgeExtractResult[];
    } else {
      // Try to find the first array value
      const firstArray = Object.values(parsed).find(Array.isArray);
      if (firstArray) extracted = firstArray as KnowledgeExtractResult[];
    }
  } catch (err) {
    console.error('[knowledge] Extraction failed:', err);
    return [];
  }

  if (!extracted.length) return [];

  // Upsert nodes, collect results
  const upsertedNodes: KnowledgeNode[] = [];
  const nameToNode = new Map<string, KnowledgeNode>();

  for (const item of extracted) {
    if (!item.name || !item.type) continue;
    try {
      const node = (await upsertKnowledgeNode({
        storyId,
        type: item.type as NodeType,
        name: item.name,
        attributes: (item.attributes as Record<string, unknown>) ?? {},
      })) as KnowledgeNode;
      upsertedNodes.push(node);
      nameToNode.set(item.name.toLowerCase(), node);
    } catch (err) {
      console.error(`[knowledge] Failed to upsert node "${item.name}":`, err);
    }
  }

  // Build edges — we need to find target nodes by name
  // First fetch all existing nodes for this story so we can resolve names
  let existingNodes: KnowledgeNode[] = [];
  try {
    existingNodes = (await getKnowledgeNodesByStory(storyId)) as KnowledgeNode[];
  } catch {
    existingNodes = [];
  }
  for (const n of existingNodes) {
    if (!nameToNode.has(n.name.toLowerCase())) {
      nameToNode.set(n.name.toLowerCase(), n);
    }
  }

  for (const item of extracted) {
    if (!item.links?.length) continue;
    const fromNode = nameToNode.get(item.name.toLowerCase());
    if (!fromNode) continue;

    for (const link of item.links) {
      const toNode = nameToNode.get(link.toName.toLowerCase());
      if (!toNode) continue;
      try {
        await upsertKnowledgeEdge({
          storyId,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          label: link.label ?? null,
        });
      } catch (err) {
        console.error('[knowledge] Failed to upsert edge:', err);
      }
    }
  }

  return upsertedNodes;
}
