import { NextRequest, NextResponse } from "next/server";
import {
  ensureSchema,
  getKnowledgeNodesByStory,
  getKnowledgeEdgesByStory,
  upsertKnowledgeNode,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId query parameter is required" },
        { status: 400 }
      );
    }

    const [nodes, edges] = await Promise.all([
      getKnowledgeNodesByStory(storyId),
      getKnowledgeEdgesByStory(storyId),
    ]);

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("GET /api/knowledge error:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge graph" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const body = await req.json();
    const { storyId, type, name, attributes } = body as {
      storyId: string;
      type: string;
      name: string;
      attributes?: Record<string, unknown>;
    };

    if (!storyId || !type || !name) {
      return NextResponse.json(
        { error: "storyId, type, and name are required" },
        { status: 400 }
      );
    }

    const node = await upsertKnowledgeNode({
      storyId,
      type,
      name,
      attributes: attributes ?? {},
    });

    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error("POST /api/knowledge error:", error);
    return NextResponse.json(
      { error: "Failed to upsert knowledge node" },
      { status: 500 }
    );
  }
}
