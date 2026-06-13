import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getStoryById, updateStory } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const story = await getStoryById(id);

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error("GET /api/stories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const body = await req.json();

    const story = await getStoryById(id);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const updated = await updateStory(id, body);

    return NextResponse.json({ story: updated });
  } catch (error) {
    console.error("PATCH /api/stories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}
