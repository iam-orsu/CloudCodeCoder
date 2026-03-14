import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWorkspace, mapCoderStatus, CoderApiError } from "@/lib/coder";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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
        coderWorkspaceName: coderWorkspace.name,
        templateName: dbWorkspace.templateName || coderWorkspace.template_name,
      });
    } catch (coderErr: any) {
      console.error("Coder status sync error:", coderErr);

      // If Coder says workspace is gone (410) or not found (404),
      // the admin deleted it — purge the stale record from our DB
      if (coderErr instanceof CoderApiError && (coderErr.status === 410 || coderErr.status === 404)) {
        await prisma.workspace.delete({ where: { id: dbWorkspace.id } });
        return NextResponse.json({ workspace: null });
      }

      // Return DB status if Coder is just temporarily unreachable
      return NextResponse.json({ workspace: dbWorkspace });
    }
  } catch (error: any) {
    console.error("Workspace status error:", error);
    if (error instanceof CoderApiError) {
      return NextResponse.json(
        { error: "Failed to get workspace status", details: error.details },
        { status: error.status >= 400 && error.status < 600 ? error.status : 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to get workspace status" },
      { status: 500 }
    );
  }
}
