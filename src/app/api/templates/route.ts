import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listTemplates } from "@/lib/coder";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await listTemplates();

    // Return only the fields the frontend needs
    const cleaned = templates.map((t) => ({
      id: t.id,
      name: t.name,
      display_name: t.display_name || t.name,
      description: t.description || "",
      icon: t.icon || "",
      active_version_id: t.active_version_id,
    }));

    return NextResponse.json({ templates: cleaned });
  } catch (error: any) {
    console.error("Templates list error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch templates", details: error.message },
      { status: 500 }
    );
  }
}
