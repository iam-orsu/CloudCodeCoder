"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Workspace {
  id: string;
  coderWorkspaceId: string;
  status: "RUNNING" | "STOPPED" | "PROVISIONING" | "ERROR";
  createdAt: string;
  lastActiveAt: string;
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
      // Poll every 5 seconds
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [authStatus, fetchStatus]);

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/workspace/create", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        if (data.coderWorkspaceName) setWorkspaceName(data.coderWorkspaceName);
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
      await fetch("/api/workspace/start", { method: "POST" });
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

          {!workspace && (
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
                "Provision Workspace"
              )}
            </button>
          )}
        </div>

        {/* Empty State */}
        {!workspace && !actionLoading && (
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
              Provision a workspace to get a full Linux development environment
              with VS Code in your browser.
            </p>
            <button
              onClick={handleCreate}
              disabled={actionLoading}
              className="saas-button-primary"
            >
              Provision Workspace
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
                      Configuration
                    </div>
                    <div className="text-zinc-300">2 vCPU · 4 GB RAM</div>
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
                    onClick={handleCreate}
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
