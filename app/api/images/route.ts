import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, createStoryImage, getImagesByStory } from '@/lib/db';
import { getOpenAIClient, IMAGE_MODEL } from '@/lib/openai';

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get('storyId');
    if (!storyId) {
      return NextResponse.json({ error: 'storyId required' }, { status: 400 });
    }
    const images = await getImagesByStory(storyId);
    return NextResponse.json(images);
  } catch (err) {
    console.error('[GET /api/images]', err);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const {
      storyId,
      prompt,
      messageId,
      triggerReason,
      knowledgeNodeIds,
    } = body as {
      storyId: string;
      prompt: string;
      messageId?: string | null;
      triggerReason?: string;
      knowledgeNodeIds?: string[];
    };

    if (!storyId || !prompt) {
      return NextResponse.json(
        { error: "storyId and prompt are required" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    const imageResponse = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    });

    const imageUrl = imageResponse.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'DALL-E did not return an image URL' }, { status: 502 });
    }

    const revisedPrompt = imageResponse.data?.[0]?.revised_prompt ?? null;
    const savedImage = await createStoryImage({
      storyId,
      messageId: messageId ?? null,
      prompt,
      revisedPrompt,
      modelParams: { model: IMAGE_MODEL, size: '1792x1024', quality: 'standard' },
      url: imageUrl,
      triggerReason: triggerReason ?? null,
      knowledgeNodeIds: knowledgeNodeIds ?? [],
    });

    return NextResponse.json({ image: savedImage });
  } catch (error) {
    console.error("POST /api/images error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
