import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createWorkspace, mapCoderStatus } from "@/lib/coder";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a workspace
    const existing = await prisma.workspace.findFirst({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Workspace already exists", workspace: existing },
        { status: 409 }
      );
    }

    // Create workspace via Coder API
    const userName = session.user.name || session.user.email || "user";
    const coderWorkspace = await createWorkspace(userName);

    // Store in database
    const workspace = await prisma.workspace.create({
      data: {
        userId,
        coderWorkspaceId: coderWorkspace.id,
        vmInstanceId: null,
        status: mapCoderStatus(coderWorkspace.latest_build.status),
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error: any) {
    console.error("Workspace create error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to create workspace", details: error.message },
      { status: 500 }
    );
  }
}
