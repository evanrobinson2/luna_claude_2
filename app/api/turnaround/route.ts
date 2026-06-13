import { NextRequest, NextResponse } from 'next/server';
import {
  ensureSchema,
  getKnowledgeNodeById,
  getKnowledgeNodesByStory,
  createStoryImage,
  createTurnaroundImage,
  updateKnowledgeNode,
} from '@/lib/db';
import { getOpenAIClient, IMAGE_MODEL } from '@/lib/openai';
import { buildTurnaroundPrompt } from '@/lib/promptBuilder';
import type { KnowledgeNode, CharacterAttributes, StoryImage } from '@/types';

const TURNAROUND_ANGLES = [
  'front view, full body',
  '3/4 view, full body',
  'side profile, full body',
  'back view, full body',
  'face close-up, neutral expression',
  'face close-up, smiling expression',
] as const;

type TurnaroundResult = StoryImage & { angle: string };

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const { characterNodeId } = body as { characterNodeId: string };

    if (!characterNodeId) {
      return NextResponse.json({ error: 'characterNodeId is required' }, { status: 400 });
    }

    // Load the character node
    const characterNode = (await getKnowledgeNodeById(characterNodeId)) as KnowledgeNode | null;
    if (!characterNode) {
      return NextResponse.json({ error: 'Character knowledge node not found' }, { status: 404 });
    }

    if (characterNode.type !== 'Character') {
      return NextResponse.json({ error: 'Knowledge node is not a Character' }, { status: 400 });
    }

    // Get all knowledge nodes for the story (for style rules)
    const allKnowledgeNodes = (await getKnowledgeNodesByStory(characterNode.story_id)) as KnowledgeNode[];

    const openai = getOpenAIClient();
    const images: TurnaroundResult[] = [];

    const charAttrs = characterNode.attributes as CharacterAttributes;
    const visualDescription = charAttrs.visualDescription ?? characterNode.name;

    // Generate 6 images sequentially, one per angle
    for (const angle of TURNAROUND_ANGLES) {
      const dallePrompt = buildTurnaroundPrompt(
        characterNode.name,
        visualDescription,
        angle,
        allKnowledgeNodes
      );

      const imageResponse = await openai.images.generate({
        model: IMAGE_MODEL,
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const imageUrl = imageResponse.data?.[0]?.url;
      const revisedPrompt = imageResponse.data?.[0]?.revised_prompt ?? null;
      if (!imageUrl) {
        console.error(`No image URL returned for angle: ${angle}`);
        continue;
      }

      // Save as story_images row (message_id = null)
      const storyImage = (await createStoryImage({
        storyId: characterNode.story_id,
        messageId: null,
        prompt: dallePrompt,
        revisedPrompt,
        modelParams: { model: IMAGE_MODEL, size: '1024x1024', quality: 'standard' },
        url: imageUrl,
        triggerReason: `turnaround:${angle}`,
        knowledgeNodeIds: [characterNodeId],
      })) as StoryImage;

      // Save as turnaround_images row
      await createTurnaroundImage({
        characterNodeId,
        angle,
        storyImageId: storyImage.id,
      });

      images.push({ ...storyImage, angle });
    }

    // Update character node attributes with turnaround_generated: true
    await updateKnowledgeNode(characterNodeId, {
      ...(charAttrs as Record<string, unknown>),
      turnaround_generated: true,
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('POST /api/turnaround error:', error);
    return NextResponse.json({ error: 'Failed to generate turnaround sheet' }, { status: 500 });
  }
}
