import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, updateKnowledgeNode, deleteKnowledgeNode } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    await ensureSchema();
    const { nodeId } = params;

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { attributes } = body as { attributes: Record<string, unknown> };

    if (!attributes || typeof attributes !== "object") {
      return NextResponse.json(
        { error: "attributes object is required" },
        { status: 400 }
      );
    }

    const updatedNode = await updateKnowledgeNode(nodeId, attributes);

    if (!updatedNode) {
      return NextResponse.json(
        { error: "Knowledge node not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ node: updatedNode });
  } catch (error) {
    console.error("PATCH /api/knowledge/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge node" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    await ensureSchema();
    const { nodeId } = params;

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId is required" },
        { status: 400 }
      );
    }

    await deleteKnowledgeNode(nodeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/knowledge/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge node" },
      { status: 500 }
    );
  }
}
