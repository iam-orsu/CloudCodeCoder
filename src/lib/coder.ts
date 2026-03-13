/**
 * Coder v2 REST API Client
 *
 * Communicates with the self-hosted Coder control plane (coderd)
 * to manage workspace lifecycle: create, start, stop, get status.
 *
 * API Docs: https://coder.com/docs/api
 */

const CODER_URL = process.env.CODER_URL || "http://coder:7080";
const CODER_API_TOKEN = process.env.CODER_API_TOKEN || "";
const CODER_ORG_ID = process.env.CODER_ORG_ID || "default";
const CODER_TEMPLATE_NAME = process.env.CODER_TEMPLATE_NAME || "azure-linux";

interface CoderWorkspace {
  id: string;
  name: string;
  owner_id: string;
  template_id: string;
  latest_build: {
    id: string;
    status: string;
    transition: string;
    resources: Array<{
      id: string;
      type: string;
      agents?: Array<{
        id: string;
        status: string;
        apps?: Array<{
          url: string;
          display_name: string;
        }>;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

interface CoderTemplate {
  id: string;
  name: string;
  organization_id: string;
}

/**
 * Make an authenticated request to the Coder API
 */
async function coderFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${CODER_URL}/api/v2${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Coder-Session-Token": CODER_API_TOKEN,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Coder API error (${res.status}): ${errorText}`);
  }

  return res;
}

/**
 * Get template ID by name
 */
async function getTemplateId(): Promise<string> {
  const res = await coderFetch(
    `/organizations/${CODER_ORG_ID}/templates/${CODER_TEMPLATE_NAME}`
  );

  if (!res.ok) {
    throw new Error(
      `Failed to get template: ${res.status} ${await res.text()}`
    );
  }

  const template: CoderTemplate = await res.json();
  return template.id;
}

/**
 * Create a new workspace for a user
 */
export async function createWorkspace(
  username: string
): Promise<CoderWorkspace> {
  const templateId = await getTemplateId();
  const workspaceName = `ws-${username.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`;

  const res = await coderFetch(
    `/organizations/${CODER_ORG_ID}/members/me/workspaces`,
    {
      method: "POST",
      body: JSON.stringify({
        name: workspaceName,
        template_id: templateId,
        autostart_schedule: null,
        ttl_ms: null,
        automatic_updates: "never",
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create workspace: ${res.status} ${errText}`);
  }

  return res.json();
}

/**
 * Get workspace details by ID
 */
export async function getWorkspace(
  workspaceId: string
): Promise<CoderWorkspace> {
  const res = await coderFetch(`/workspaces/${workspaceId}`);

  if (!res.ok) {
    throw new Error(
      `Failed to get workspace: ${res.status} ${await res.text()}`
    );
  }

  return res.json();
}

/**
 * Start a stopped workspace
 */
export async function startWorkspace(workspaceId: string): Promise<void> {
  const ws = await getWorkspace(workspaceId);

  const res = await coderFetch(
    `/workspaces/${workspaceId}/builds`,
    {
      method: "POST",
      body: JSON.stringify({
        transition: "start",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to start workspace: ${res.status} ${await res.text()}`
    );
  }
}

/**
 * Stop a running workspace
 */
export async function stopWorkspace(workspaceId: string): Promise<void> {
  const res = await coderFetch(
    `/workspaces/${workspaceId}/builds`,
    {
      method: "POST",
      body: JSON.stringify({
        transition: "stop",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to stop workspace: ${res.status} ${await res.text()}`
    );
  }
}

/**
 * Map Coder build status to our internal status
 */
export function mapCoderStatus(
  coderStatus: string
): "RUNNING" | "STOPPED" | "PROVISIONING" | "ERROR" {
  switch (coderStatus) {
    case "running":
      return "RUNNING";
    case "stopped":
    case "canceled":
      return "STOPPED";
    case "starting":
    case "queued":
    case "pending":
      return "PROVISIONING";
    case "failed":
      return "ERROR";
    default:
      return "STOPPED";
  }
}

/**
 * Get the IDE URL for a running workspace
 */
export function getIdeUrl(workspace: CoderWorkspace): string | null {
  // Coder proxies VS Code through its own URL
  return `${CODER_URL}/@me/${workspace.name}`;
}
