import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startWorkspace, CoderApiError } from "@/lib/coder";

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
    try {
      await startWorkspace(workspace.coderWorkspaceId);
    } catch (coderErr: any) {
      // If workspace was deleted by admin (410 Gone / 404 Not Found),
      // purge the stale record so the user can create a fresh one
      if (coderErr instanceof CoderApiError && (coderErr.status === 410 || coderErr.status === 404)) {
        await prisma.workspace.delete({ where: { id: workspace.id } });
        return NextResponse.json(
          { error: "Workspace was deleted by admin. Please create a new one.", deleted: true },
          { status: 410 }
        );
      }
      throw coderErr;
    }

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
