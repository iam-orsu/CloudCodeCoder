import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createWorkspace, mapCoderStatus, CoderApiError } from "@/lib/coder";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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

    // Parse the request body for template selection
    const body = await request.json().catch(() => ({}));
    const { templateId, richParameterValues = [], templateName } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    // Create workspace via Coder API with user's chosen template + params
    const userName = session.user.name || session.user.email || "user";
    const coderWorkspace = await createWorkspace(
      userName,
      templateId,
      richParameterValues
    );

    // Store in database
    const workspace = await prisma.workspace.create({
      data: {
        userId,
        coderWorkspaceId: coderWorkspace.id,
        vmInstanceId: null,
        templateName: templateName || coderWorkspace.template_name || null,
        status: mapCoderStatus(coderWorkspace.latest_build.status),
      },
    });

    return NextResponse.json(
      { workspace, coderWorkspaceName: coderWorkspace.name },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Workspace create error:", error.message || error);
    if (error instanceof CoderApiError) {
      return NextResponse.json(
        { error: "Failed to create workspace", details: error.details },
        { status: error.status >= 400 && error.status < 600 ? error.status : 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create workspace", details: error.message },
      { status: 500 }
    );
  }
}
