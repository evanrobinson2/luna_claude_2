import { NextRequest, NextResponse } from 'next/server';
import {
  ensureSchema,
  createMessage,
  getMessagesByStory,
  getKnowledgeNodesByStory,
  createStoryImage,
} from '@/lib/db';
import { imageReasoning } from '@/lib/imageReasoning';
import { extractKnowledge } from '@/lib/knowledge';
import { buildDallePrompt } from '@/lib/promptBuilder';
import { getOpenAIClient, CHAT_MODEL, IMAGE_MODEL, LUNA_SYSTEM_PROMPT } from '@/lib/openai';
import type { KnowledgeNode, StoryImage } from '@/types';

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');
    if (!storyId) {
      return NextResponse.json({ error: 'storyId required' }, { status: 400 });
    }
    const messages = await getMessagesByStory(storyId);
    return NextResponse.json(messages);
  } catch (err) {
    console.error('[GET /api/messages]', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const { storyId, content } = body as { storyId: string; content: string };

    if (!storyId || !content) {
      return NextResponse.json({ error: 'storyId and content are required' }, { status: 400 });
    }

    // Save user message to DB
    await createMessage(storyId, 'user', content);

    // Fetch last 20 messages for context
    const recentMessages = await getMessagesByStory(storyId, 20);

    // Build message history for OpenAI
    const messageHistory = recentMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Call GPT-4o with system prompt + message history
    const openai = getOpenAIClient();
    const chatResponse = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: 'system', content: LUNA_SYSTEM_PROMPT }, ...messageHistory],
      temperature: 0.85,
      max_tokens: 1024,
    });

    const assistantContent = chatResponse.choices[0]?.message?.content ?? '';

    // Save assistant message to DB
    const assistantMessage = await createMessage(storyId, 'assistant', assistantContent);

    // Fetch knowledge nodes for context
    const knowledgeNodes = (await getKnowledgeNodesByStory(storyId)) as KnowledgeNode[];

    // Run imageReasoning and extractKnowledge in parallel (non-blocking)
    const [imageDecision, knowledgeUpdates] = await Promise.all([
      imageReasoning(content, assistantContent),
      extractKnowledge(storyId, content, assistantContent),
    ]);

    // Conditionally generate an image
    let image: StoryImage | undefined;
    if (imageDecision?.shouldGenerate) {
      try {
        const { prompt: dallePrompt, usedNodeIds } = buildDallePrompt(
          imageDecision.subjectDescription,
          knowledgeNodes
        );

        const imageResponse = await openai.images.generate({
          model: IMAGE_MODEL,
          prompt: dallePrompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
        });

        const imageUrl = imageResponse.data?.[0]?.url;
        const revisedPrompt = imageResponse.data?.[0]?.revised_prompt ?? null;
        if (imageUrl) {
          image = (await createStoryImage({
            storyId,
            messageId: assistantMessage.id,
            prompt: dallePrompt,
            revisedPrompt,
            modelParams: { model: IMAGE_MODEL, size: '1792x1024', quality: 'standard' },
            url: imageUrl,
            triggerReason: imageDecision.reason,
            knowledgeNodeIds: usedNodeIds,
          })) as StoryImage;
        }
      } catch (imageError) {
        console.error('Image generation failed (non-fatal):', imageError);
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      image,
      knowledgeUpdates: (knowledgeUpdates ?? []) as KnowledgeNode[],
    });
  } catch (error) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
