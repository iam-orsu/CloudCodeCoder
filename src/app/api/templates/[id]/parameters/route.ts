import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplate, getTemplateRichParameters } from "@/lib/coder";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;

    // Fetch the template to get its active version ID
    const template = await getTemplate(templateId);

    // Fetch rich parameters for the active version
    const parameters = await getTemplateRichParameters(
      template.active_version_id
    );

    // Filter to only non-ephemeral parameters with options (user-facing choices)
    const userParams = parameters.filter(
      (p) => !p.ephemeral && (p.options.length > 0 || p.required)
    );

    return NextResponse.json({ parameters: userParams });
  } catch (error: any) {
    console.error("Template parameters error:", error.message || error);
    return NextResponse.json(
      { error: "Failed to fetch template parameters", details: error.message },
      { status: 500 }
    );
  }
}
