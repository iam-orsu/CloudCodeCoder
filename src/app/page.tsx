import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black bg-dots">
      {/* Navigation */}
      <nav className="nav-border sticky top-0 z-50 bg-black/80 backdrop-blur-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
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
            <span className="text-lg font-semibold tracking-tight">
              Cloud Code
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link href="/login" className="saas-button-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6">
        <section className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-400">
            <span className="status-dot status-running" />
            Powered by Azure Compute
          </div>

          <h1 className="mb-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Code anywhere.
            <br />
            <span className="text-zinc-500">Zero setup.</span>
          </h1>

          <p className="mb-10 max-w-xl text-lg text-zinc-400">
            Launch a full Linux development environment in your browser in under
            30 seconds. No installation. No configuration. Just code.
          </p>

          <div className="flex gap-4">
            <Link href="/login" className="saas-button-primary px-8 py-3 text-base">
              Start Coding →
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="saas-button-secondary px-8 py-3 text-base"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* Terminal Preview */}
        <section className="mx-auto mb-20 max-w-3xl">
          <div className="saas-card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-2 text-xs text-zinc-500 mono">
                cloudcode ~ workspace
              </span>
            </div>
            <div className="p-6 mono text-sm leading-relaxed">
              <div className="text-zinc-500">
                $ cloudcode workspace start
              </div>
              <div className="mt-2 text-zinc-400">
                ⠋ Provisioning Azure VM...
              </div>
              <div className="text-zinc-400">
                ✓ VM created (Standard_B2s, East US)
              </div>
              <div className="text-zinc-400">
                ✓ Development tools installed
              </div>
              <div className="text-zinc-400">
                ✓ VS Code server ready
              </div>
              <div className="mt-2 text-green-500">
                ✓ Workspace available at https://ide.cloudcode.dev
              </div>
              <div className="mt-2 text-zinc-600">
                Ready in 24s
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-32">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
            Everything you need
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Instant Environments",
                desc: "Full Linux dev environment provisioned in seconds. Ready when you are.",
                icon: "⚡",
              },
              {
                title: "No Installation",
                desc: "Everything runs in your browser. Works on any device with a web connection.",
                icon: "🌐",
              },
              {
                title: "VS Code in Browser",
                desc: "Full VS Code experience with extensions, terminal, and Git — all in your browser.",
                icon: "💻",
              },
              {
                title: "Azure Powered",
                desc: "Dedicated VMs on Azure infrastructure. Auto-suspend when idle to minimize cost.",
                icon: "☁️",
              },
            ].map((feature) => (
              <div key={feature.title} className="saas-card">
                <div className="mb-4 text-2xl">{feature.icon}</div>
                <h3 className="mb-2 text-sm font-semibold">{feature.title}</h3>
                <p className="text-sm text-zinc-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-600">
          Cloud Code — Self-hosted development environments.
        </footer>
      </main>
    </div>
  );
}
