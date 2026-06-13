import { NextRequest, NextResponse } from 'next/server';
import { getStories, createStory, ensureSchema } from '../../../lib/db';

export async function GET() {
  try {
    await ensureSchema();
    const stories = await getStories();
    return NextResponse.json(stories);
  } catch (err) {
    console.error('[GET /api/stories]', err);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const title: string = body.title?.trim() || 'Untitled Story';
    const story = await createStory(title);
    return NextResponse.json(story, { status: 201 });
  } catch (err) {
    console.error('[POST /api/stories]', err);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}
