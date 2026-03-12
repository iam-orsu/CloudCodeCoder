import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startWorkspace } from "@/lib/coder";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const workspace = await prisma.workspace.findFirst({
      where: { userId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    // Start via Coder API
    await startWorkspace(workspace.coderWorkspaceId);

    // Update local status
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        status: "PROVISIONING",
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Workspace start error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to start workspace", details: error.message },
      { status: 500 }
    );
  }
}
