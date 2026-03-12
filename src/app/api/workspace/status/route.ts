import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWorkspace, mapCoderStatus } from "@/lib/coder";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get workspace from database
    const dbWorkspace = await prisma.workspace.findFirst({
      where: { userId },
    });

    if (!dbWorkspace) {
      return NextResponse.json({ workspace: null });
    }

    // Sync status with Coder
    try {
      const coderWorkspace = await getWorkspace(dbWorkspace.coderWorkspaceId);
      const newStatus = mapCoderStatus(coderWorkspace.latest_build.status);

      // Update local status if changed
      if (newStatus !== dbWorkspace.status) {
        await prisma.workspace.update({
          where: { id: dbWorkspace.id },
          data: {
            status: newStatus,
            lastActiveAt:
              newStatus === "RUNNING" ? new Date() : dbWorkspace.lastActiveAt,
          },
        });
        dbWorkspace.status = newStatus;
      }

      return NextResponse.json({ 
        workspace: dbWorkspace,
        coderWorkspaceName: coderWorkspace.name 
      });
    } catch (coderErr) {
      console.error("Coder status sync error:", coderErr);
      // Return DB status if Coder is unreachable
      return NextResponse.json({ workspace: dbWorkspace });
    }
  } catch (error) {
    console.error("Workspace status error:", error);
    return NextResponse.json(
      { error: "Failed to get workspace status" },
      { status: 500 }
    );
  }
}
