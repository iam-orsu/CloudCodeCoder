# Cloud Code

**Self-hosted development environments in the browser.**

Launch a full Linux dev environment in seconds. No setup required. Powered by [Coder](https://coder.com) + Azure compute.

## Architecture

```
docker compose up -d  →  5 containers
├── cloudcode-web     →  Next.js 14 (frontend + API)
├── cloudcode-db      →  PostgreSQL 16
├── cloudcode-coder   →  Coder v2 (workspace management)
├── cloudcode-redis   →  Redis 7 (caching)
└── cloudcode-proxy   →  Traefik v3 (reverse proxy)
```

User workspaces run on **Azure VMs** provisioned by Coder via Terraform.

## Deploy on Fresh Ubuntu VPS

### Prerequisites
- Ubuntu 22.04 LTS VPS (4 CPU, 8 GB RAM, 80 GB SSD minimum)
- Docker & Docker Compose installed
- A domain name (optional, for HTTPS)
- Azure account with Service Principal credentials
- GitHub OAuth App

### Step 1: Clone & Configure

```bash
git clone <your-repo-url> cloudcode
cd cloudcode
cp .env.example .env
nano .env   # Fill in all variables
```

### Step 2: Launch

```bash
docker compose up -d
```

The platform starts automatically:
1. PostgreSQL initializes
2. Prisma runs database migrations
3. Coder control plane starts
4. Next.js application starts
5. Traefik routes traffic

### Step 3: Setup Coder

1. Visit `http://your-server:7080` to create the Coder admin account
2. Go to **Settings → Tokens → Create** and copy the API token
3. Add the token to `.env` as `CODER_API_TOKEN`
4. Create an Azure workspace template in the Coder dashboard
5. Restart the stack: `docker compose restart web`

### Step 4: Access

Visit `http://your-server` — the SaaS platform is live.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `NEXTAUTH_URL` | Public URL of the app |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `CODER_URL` | URL of the Coder control plane |
| `CODER_API_TOKEN` | Coder admin API token |
| `CODER_ORG_ID` | Coder organization ID |
| `CODER_TEMPLATE_NAME` | Name of workspace template |
| `AZURE_CLIENT_ID` | Azure Service Principal app ID |
| `AZURE_CLIENT_SECRET` | Azure Service Principal secret |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_TENANT_ID` | Azure tenant ID |

## Local Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## License

MIT
