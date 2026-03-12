# Project: Cloud Code – Self-Hosted Development Environments

## Objective

Build a production-grade full-stack SaaS platform called **Cloud Code** that provides **instant, on-demand Linux development environments in the browser**.

The system replaces GitHub Codespaces entirely.

All development environments must be provisioned using **Coder v2 (self-hosted)** running on **Azure infrastructure**. When a user starts a workspace, the backend triggers the Coder API which automatically provisions a dedicated Azure VM and exposes a browser-based VS Code IDE.

The entire architecture must prioritize:

• fast provisioning
• aggressive idle suspension
• extremely low compute cost
• SaaS-quality UX

---

# Core Product Concept

Cloud Code allows a user to:

1. Sign in using GitHub.
2. Click **Start Workspace**.
3. Automatically provision a Linux VM via Coder on Azure.
4. Open VS Code in the browser.
5. When idle, the workspace auto-suspends to reduce cost.

Think:

**Coder + Azure infrastructure + Vercel-quality SaaS UI.**

---

# CRITICAL UI REQUIREMENT

Before writing any code, search your knowledge items or prior context for:

**"CloudCode UI Revamp"**

The previously designed interface must be **replicated exactly**.

## Design System Rules

Strict minimalist SaaS aesthetic inspired by:

• Vercel
• Linear
• Stripe dashboard

### Colors

Background

```
#000000
```

Text

```
#ffffff
```

Absolutely forbidden:

• gradients
• neon colors
• glow effects
• blur effects
• glassmorphism

Everything should feel **sharp, technical, and minimal.**

---

# UI Components

Use the exact reusable component classes:

### Cards

```
.saas-card
background: zinc-900/50
border: 1px solid white/5
```

### Primary Button

```
.saas-button-primary
background: white
text: black
```

### Secondary Button

```
.saas-button-secondary
background: zinc-900
text: white
```

### Landing Background

```
.bg-dots
```

---

# Pages to Implement

## Landing Page

Headline:

Code anywhere. Zero setup.

Features:

• Instant dev environments
• No installation required
• Runs in browser
• Powered by Azure compute

Minimal hero section with **call-to-action button**.

---

## Authentication Page

Route

```
/login
```

Centered minimal card with:

• GitHub OAuth login
• simple white outline UI

---

## Dashboard

Route

```
/dashboard
```

Vercel-style deployment dashboard showing:

Workspace name
Status (Running / Stopped)
CPU / RAM configuration
Uptime
Start / Stop button
Open IDE button

---

# Technology Stack

Frontend / Backend

```
Next.js 14+
App Router
TypeScript
```

Styling

```
TailwindCSS
strict monochrome configuration
```

Database

```
PostgreSQL
Prisma ORM
```

Authentication

```
NextAuth
GitHub OAuth
```

Workspace Provisioning

```
Coder v2
Self-hosted coderd
```

Cloud Infrastructure

```
Microsoft Azure
```

---

# Infrastructure Model

Architecture overview:

User → Next.js API → Coder API → Azure VM → VS Code IDE

Flow:

1. User presses **Start Workspace**
2. Backend calls **Coder REST API**
3. Coder launches an Azure VM
4. VM runs workspace container
5. IDE is proxied through Coder
6. User accesses IDE via browser

Idle workspaces must automatically suspend.

---

# Economics Goal

Compute cost must be minimized.

Strategies:

Use cheap VM SKUs

Example candidates

```
Standard_B2s
Standard_B1ms
Standard_D2s_v3
```

Enable:

• auto suspend
• workspace shutdown after inactivity
• minimal disk size

Goal:

**maximize margin per workspace.**

---

# System Architecture

## Cloud Components

Azure resources required:

1. Resource Group
2. Primary VM (Coder control plane)
3. PostgreSQL database
4. VNet
5. NSG rules
6. Managed Identity (optional)
7. Public IP for coderd

---

## Coder Control Plane

The system requires a **central control server**.

This server runs:

```
coderd
```

Responsibilities:

• manage workspaces
• run templates
• provision Azure VMs
• proxy IDE traffic

---

# DEVELOPMENT PHASES

---

# Phase 1

## Infrastructure Deployment (MUST HAPPEN FIRST)

Before writing any application code, deploy the **Coder control plane**.

The AI must provide:

Step-by-step terminal instructions for:

1. Creating Azure VM
2. Installing Docker
3. Installing PostgreSQL
4. Installing coderd
5. Configuring TLS
6. Generating Admin API Token
7. Configuring Azure provider
8. Creating first workspace template

The output should include **copy-paste terminal commands**.

Example environment:

```
Ubuntu 22.04 LTS
```

---

# Phase 2

## Local Application Setup

Create the application.

Steps:

1. Initialize Next.js project
2. Configure Tailwind
3. Implement design system
4. Configure Prisma
5. Setup PostgreSQL connection
6. Implement NextAuth GitHub OAuth

---

# Database Schema

Prisma schema must include:

### User

```
id
email
name
githubId
createdAt
```

---

### Workspace

```
id
userId
coderWorkspaceId
vmInstanceId
status
createdAt
lastActiveAt
```

Status enum:

```
RUNNING
STOPPED
PROVISIONING
ERROR
```

---

# Phase 3

## Coder API Integration

The backend communicates directly with the **Coder REST API**.

Required API routes:

```
/api/workspace/create
/api/workspace/status
/api/workspace/stop
/api/workspace/start
```

---

## Workspace Creation Flow

User clicks:

```
Provision Workspace
```

Backend:

1. Validate user session
2. Call Coder API
3. Create workspace from template
4. Store workspace ID in database
5. Return status to UI

---

## Workspace Status Polling

Dashboard should periodically check workspace state.

API endpoint:

```
/api/workspace/status
```

This queries:

```
GET /api/v2/workspaces/{id}
```

---

## Stop Workspace

```
/api/workspace/stop
```

Calls:

```
POST /workspaces/{id}/stop
```

---

# Security Requirements

Secrets must be stored in:

```
.env.local
```

Never expose:

Coder API tokens
Azure credentials

---

# Files to Produce

Before coding anything, the AI must generate:

```
implementation_plan.md
task.md
architecture.md
```

These should explain:

system architecture
deployment sequence
service interactions

---

# FIRST ACTION THE AI MUST TAKE

Do NOT start writing application code yet.

Start with:

**Azure Infrastructure Deployment**

Guide the user through:

1. Creating Azure VM
2. Installing Coder control plane
3. Connecting PostgreSQL
4. Generating Admin API Token

Only after the **Coder server is operational** should application code be generated.

---

# HARD CONSTRAINTS

Do NOT use:

GitHub Codespaces
Gitpod
Replit
GitHub Dev Environments

The platform must rely **only on self-hosted Coder + Azure VMs**.

---

# Follow-up Requirement: Fully Containerized Deployment

We are continuing the **Cloud Code SaaS project**.

The entire system must now be redesigned so the **complete platform runs using Docker containers** and can be deployed on any Ubuntu VPS with a **single command**.

Deployment command:

```
docker compose up -d
```

After running this command, the entire SaaS platform must automatically start.

No manual setup steps should be required other than providing environment variables.

---

# Deployment Goal

A user should be able to:

1. Clone the repository
2. Add environment variables
3. Run

```
docker compose up -d
```

and the entire platform becomes available.

---

# Required Services (Docker Containers)

The Docker Compose stack must include:

### 1. Web Application

Container for the Next.js application.

Responsibilities:

• landing page
• login page
• dashboard
• API routes
• Coder API integration

Tech stack:

Next.js 14
Node.js
TailwindCSS
NextAuth

---

### 2. PostgreSQL Database

Containerized database for:

• users
• sessions
• workspace tracking

Must include:

Persistent volume

---

### 3. Coder Control Plane

Container running:

```
coderd
```

Responsibilities:

• workspace management
• VM provisioning
• IDE proxy

This container should automatically connect to PostgreSQL.

---

### 4. Reverse Proxy

Use **Traefik or Nginx** container to expose services.

Routes:

```
/           → Next.js app
/coder      → Coder control plane
```

Optional:

HTTPS support using Let's Encrypt.

---

### 5. Redis (Optional but Recommended)

Used for:

• background jobs
• workspace status caching
• queue management

---

# Repository Structure

The AI must organize the project like this:

```
cloudcode/
│
├── docker-compose.yml
├── .env.example
├── README.md
│
├── web/
│   ├── Dockerfile
│   ├── next.config.js
│   ├── prisma/
│   └── src/
│
├── coder/
│   └── coder-config.yaml
│
├── database/
│   └── init.sql
│
└── reverse-proxy/
    └── traefik.yml
```

---

# Docker Compose Requirements

The AI must generate a production-ready:

```
docker-compose.yml
```

It should include:

• proper networks
• persistent volumes
• environment variables
• service dependencies
• restart policies

Example features required:

```
depends_on
healthchecks
restart: unless-stopped
```

---

# Automatic Startup Requirements

When the stack starts:

1. PostgreSQL initializes
2. Prisma migrations run automatically
3. Coder control plane starts
4. Next.js application starts
5. Reverse proxy routes traffic

The user should **not need to run migrations manually**.

---

# Environment Variables

Create:

```
.env.example
```

Required variables:

```
DATABASE_URL
NEXTAUTH_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
CODER_API_TOKEN
CODER_URL
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_SUBSCRIPTION_ID
AZURE_TENANT_ID
```

---

# Health Checks

Each container must expose health endpoints.

Examples:

Next.js

```
/api/health
```

Coder

```
/healthz
```

Postgres

standard healthcheck.

---

# Production Requirements

The system must be optimized for a **single VPS deployment**.

Recommended minimum server:

```
4 CPU
8 GB RAM
80 GB SSD
Ubuntu 22.04
```

---

# Security Requirements

Secrets must be read from environment variables.

No credentials should be hardcoded.

Database must not expose public ports.

---

# Final Deliverables

The AI must generate:

1. docker-compose.yml
2. Dockerfiles
3. environment configuration
4. complete project structure
5. README with deployment instructions

The README must include exactly how to deploy the system on a fresh Ubuntu VPS.

---

# Expected Deployment Process

The README should allow a user to deploy the system using:

```
git clone <repo>
cd cloudcode
cp .env.example .env
nano .env
docker compose up -d
```

After this, the SaaS platform must be accessible via browser.

---

# Important

The architecture must remain compatible with:

Coder + Azure VM provisioning.

The Docker deployment is only for:

Control plane
Web application
Database
Reverse proxy.

Actual development environments must still run on **Azure VMs created by Coder**.

---

# Final Goal

Running one command:

```
docker compose up -d
```

should start the entire Cloud Code SaaS platform.


# Goal

By the end of development the platform should allow any user to:

Sign in → Start workspace → Get browser IDE in under 30 seconds.

This is a **developer infrastructure SaaS product**, not just a demo project.
