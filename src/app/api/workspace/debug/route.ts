import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getWorkspace } from "@/lib/coder";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbWorkspace = await prisma.workspace.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    if (!dbWorkspace) return NextResponse.json({ error: "No workspace" });
    
    const coderWorkspace = await getWorkspace(dbWorkspace.coderWorkspaceId);
    return NextResponse.json(coderWorkspace);
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
