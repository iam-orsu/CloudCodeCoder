"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Workspace {
  id: string;
  coderWorkspaceId: string;
  templateName: string | null;
  status: "RUNNING" | "STOPPED" | "PROVISIONING" | "ERROR";
  createdAt: string;
  lastActiveAt: string;
}

interface Template {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  active_version_id: string;
}

interface RichParameter {
  name: string;
  display_name: string;
  description: string;
  type: string;
  mutable: boolean;
  default_value: string;
  icon: string;
  options: Array<{
    name: string;
    description: string;
    value: string;
    icon: string;
  }>;
  required: boolean;
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [templateDisplayName, setTemplateDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Template picker state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [parameters, setParameters] = useState<RichParameter[]>([]);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [templateLoading, setTemplateLoading] = useState(false);
  const [paramLoading, setParamLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Fetch workspace status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/status");
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace || null);
        if (data.coderWorkspaceName) setWorkspaceName(data.coderWorkspaceName);
        if (data.templateName) setTemplateDisplayName(data.templateName);
      }
    } catch (err) {
      console.error("Failed to fetch workspace status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [authStatus, fetchStatus]);

  // Fetch available templates
  const fetchTemplates = async () => {
    setTemplateLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Fetch parameters for a template
  const fetchParameters = async (template: Template) => {
    setParamLoading(true);
    setSelectedTemplate(template);
    setParameters([]);
    setParameterValues({});
    try {
      const res = await fetch(`/api/templates/${template.id}/parameters`);
      if (res.ok) {
        const data = await res.json();
        const params = data.parameters || [];
        setParameters(params);
        // Set default values
        const defaults: Record<string, string> = {};
        params.forEach((p: RichParameter) => {
          if (p.default_value) defaults[p.name] = p.default_value;
        });
        setParameterValues(defaults);
      }
    } catch (err) {
      console.error("Failed to fetch parameters:", err);
    } finally {
      setParamLoading(false);
    }
  };

  const handleOpenTemplatePicker = () => {
    setShowTemplatePicker(true);
    setSelectedTemplate(null);
    setParameters([]);
    setParameterValues({});
    fetchTemplates();
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    setActionLoading(true);
    try {
      const richParameterValues = Object.entries(parameterValues).map(
        ([name, value]) => ({ name, value })
      );
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.display_name || selectedTemplate.name,
          richParameterValues,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        if (data.coderWorkspaceName) setWorkspaceName(data.coderWorkspaceName);
        setTemplateDisplayName(
          selectedTemplate.display_name || selectedTemplate.name
        );
        setShowTemplatePicker(false);
      }
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/workspace/start", { method: "POST" });
      if (res.status === 410) {
        setWorkspace(null);
        setWorkspaceName(null);
      }
      await fetchStatus();
    } catch (err) {
      console.error("Failed to start workspace:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await fetch("/api/workspace/stop", { method: "POST" });
      await fetchStatus();
    } catch (err) {
      console.error("Failed to stop workspace:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "status-running";
      case "STOPPED":
        return "status-stopped";
      case "PROVISIONING":
        return "status-provisioning";
      case "ERROR":
        return "status-error";
      default:
        return "status-stopped";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "Running";
      case "STOPPED":
        return "Stopped";
      case "PROVISIONING":
        return "Provisioning...";
      case "ERROR":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getUptime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top Nav */}
      <nav className="nav-border sticky top-0 z-50 bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="font-semibold tracking-tight">Cloud Code</span>
            </div>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="h-7 w-7 rounded-full border border-white/10"
              />
            )}
            <span className="text-sm text-zinc-400">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspaces
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your development environments
            </p>
          </div>

          {!workspace && !showTemplatePicker && (
            <button
              onClick={handleOpenTemplatePicker}
              disabled={actionLoading}
              className="saas-button-primary"
            >
              Create Workspace
            </button>
          )}
        </div>

        {/* Template Picker Modal */}
        {showTemplatePicker && !workspace && (
          <div className="saas-card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Choose a Template</h2>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>

            {templateLoading ? (
              <div className="text-center py-8 text-zinc-500">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                No templates available. Ask your admin to create one in the Coder
                dashboard.
              </div>
            ) : !selectedTemplate ? (
              /* Step 1: Pick a template */
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => fetchParameters(t)}
                    className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 text-left
                               transition-all hover:border-purple-500/50 hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {t.icon ? (
                        <img src={t.icon} alt="" className="h-8 w-8" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium text-zinc-200">
                        {t.display_name || t.name}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* Step 2: Configure parameters */
              <div>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setParameters([]);
                  }}
                  className="mb-4 text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to templates
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">
                      {selectedTemplate.display_name || selectedTemplate.name}
                    </div>
                    {selectedTemplate.description && (
                      <div className="text-xs text-zinc-500">
                        {selectedTemplate.description}
                      </div>
                    )}
                  </div>
                </div>

                {paramLoading ? (
                  <div className="text-center py-6 text-zinc-500">
                    Loading options...
                  </div>
                ) : parameters.length > 0 ? (
                  <div className="space-y-5">
                    {parameters.map((param) => (
                      <div key={param.name}>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">
                          {param.display_name || param.name}
                          {param.required && (
                            <span className="ml-1 text-red-400">*</span>
                          )}
                        </label>
                        {param.description && (
                          <p className="mb-2 text-xs text-zinc-500">
                            {param.description}
                          </p>
                        )}

                        {param.options.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto pr-1">
                            {param.options.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() =>
                                  setParameterValues((prev) => ({
                                    ...prev,
                                    [param.name]: opt.value,
                                  }))
                                }
                                className={`rounded-md border p-3 text-left text-sm transition-all ${
                                  parameterValues[param.name] === opt.value
                                    ? "border-purple-500 bg-purple-500/10 text-purple-300"
                                    : "border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20"
                                }`}
                              >
                                <div className="font-medium">
                                  {opt.name || opt.value}
                                </div>
                                {opt.description && (
                                  <div className="mt-0.5 text-xs opacity-60">
                                    {opt.description}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={parameterValues[param.name] || ""}
                            onChange={(e) =>
                              setParameterValues((prev) => ({
                                ...prev,
                                [param.name]: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2
                                       text-sm text-zinc-200 outline-none focus:border-purple-500 transition-colors"
                            placeholder={param.default_value || "Enter value..."}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 py-2">
                    No additional configuration needed for this template.
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCreate}
                    disabled={actionLoading}
                    className="saas-button-primary"
                  >
                    {actionLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="opacity-25"
                          />
                          <path
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            fill="currentColor"
                            className="opacity-75"
                          />
                        </svg>
                        Provisioning...
                      </>
                    ) : (
                      "Create Workspace"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!workspace && !showTemplatePicker && !actionLoading && (
          <div className="saas-card flex flex-col items-center justify-center py-20 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 text-zinc-700"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h3 className="mb-2 text-lg font-medium">No workspace yet</h3>
            <p className="mb-6 max-w-sm text-sm text-zinc-500">
              Create a workspace to get a full Linux development environment
              with VS Code in your browser.
            </p>
            <button
              onClick={handleOpenTemplatePicker}
              disabled={actionLoading}
              className="saas-button-primary"
            >
              Create Workspace
            </button>
          </div>
        )}

        {/* Workspace Card */}
        {workspace && (
          <div className="saas-card">
            <div className="flex items-start justify-between">
              {/* Left: Info */}
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={`status-dot ${getStatusColor(workspace.status)}`}
                  />
                  <span className="text-sm font-medium">
                    {getStatusLabel(workspace.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm lg:grid-cols-4">
                  <div>
                    <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">
                      Workspace ID
                    </div>
                    <div className="mono text-zinc-300">
                      {workspace.coderWorkspaceId?.slice(0, 12) || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">
                      Template
                    </div>
                    <div className="text-zinc-300">
                      {templateDisplayName || workspace.templateName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">
                      Uptime
                    </div>
                    <div className="text-zinc-300">
                      {workspace.status === "RUNNING"
                        ? getUptime(workspace.lastActiveAt || workspace.createdAt)
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1">
                      Created
                    </div>
                    <div className="text-zinc-300">
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex gap-3 ml-6">
                {workspace.status === "RUNNING" && (
                  <>
                    <a
                      href={`${process.env.NEXT_PUBLIC_CODER_URL}/@me/${workspaceName || workspace.coderWorkspaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="saas-button-primary"
                    >
                      Open IDE
                    </a>
                    <button
                      onClick={handleStop}
                      disabled={actionLoading}
                      className="saas-button-danger"
                    >
                      {actionLoading ? "Stopping..." : "Stop"}
                    </button>
                  </>
                )}

                {workspace.status === "STOPPED" && (
                  <button
                    onClick={handleStart}
                    disabled={actionLoading}
                    className="saas-button-primary"
                  >
                    {actionLoading ? "Starting..." : "Start Workspace"}
                  </button>
                )}

                {workspace.status === "PROVISIONING" && (
                  <button disabled className="saas-button-secondary">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        fill="currentColor"
                        className="opacity-75"
                      />
                    </svg>
                    Provisioning...
                  </button>
                )}

                {workspace.status === "ERROR" && (
                  <button
                    onClick={handleOpenTemplatePicker}
                    disabled={actionLoading}
                    className="saas-button-primary"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
