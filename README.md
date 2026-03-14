# ☁️ Cloud Code

Cloud Code is a lightweight, self-hosted Cloud IDE platform. It allows you to spin up personal development environments (via [Coder](https://coder.com)) directly from a dashboard, access your workspaces through the browser, and manage your projects from anywhere. 

This guide will walk you through **exactly** how to deploy Cloud Code on a fresh VPS (Virtual Private Server) using only a public IP address—**no domain name required.**

---

## 🛠 System Requirements

To run Cloud Code, you will need:
*   **Operating System**: Linux (Ubuntu 22.04 LTS or 24.04 LTS recommended)
*   **Memory**: At least 4GB RAM (8GB highly recommended for running VS Code instances)
*   **Storage**: At least 40GB SSD
*   **Network**: A public IPv4 address
*   **Software**: Docker and Docker Compose (we will install these in the steps below)

---

## 🚀 Step 1: Prepare Your VPS

Once you have purchased a VPS from a provider (like DigitalOcean, Linode, AWS, Hetzner, etc.), you need to connect to it.

1.  Open your terminal (Command Prompt/PowerShell on Windows, Terminal on Mac/Linux).
2.  SSH into your server using its public IP address:
    ```bash
    # Replace 203.0.113.50 with your actual VPS IP address
    ssh root@203.0.113.50
    ```
3.  Update your system packages:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
4.  Install **Docker** and **Docker Compose**:
    ```bash
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

    # Enable Docker to start on boot
    sudo systemctl enable docker
    sudo systemctl start docker
    ```

---

## 📥 Step 2: Clone the Project

Now that your server is ready, download the Cloud Code repository.

1.  Install `git` if it's not already installed:
    ```bash
    sudo apt install git -y
    ```
2.  Clone this repository to your server:
    ```bash
    git clone https://github.com/iam-orsu/CloudCodeCoder.git
    cd CloudCodeCoder
    ```

---

## 🔑 Step 3: Setup GitHub Authentication (OAuth)

Cloud Code uses GitHub to log you in. You need to tell GitHub about your new VPS so they can securely connect to each other.

1. Go to GitHub in your browser.
2. In the upper-right corner, click your profile picture > **Settings**.
3. Scroll down the left sidebar and click **Developer settings** (at the very bottom).
4. Click **OAuth Apps** in the left sidebar.
5. Click the **New OAuth App** button (or "Register a new application").
6. Fill out the form **exactly** like this (replace `YOUR_VPS_IP` with your actual server IP, e.g., `203.0.113.50`):
    *   **Application name**: Cloud Code (or whatever you want)
    *   **Homepage URL**: `http://YOUR_VPS_IP:3080`
    *   **Authorization callback URL**: `http://YOUR_VPS_IP:3080/api/auth/callback/github`
7. Click **Register application**.
8. You will now see your **Client ID**. Copy this down.
9. Click **Generate a new client secret**. Copy this secret down immediately (it will disappear when you refresh).

> ℹ️ Note: If you want to use an organization for workspace templates, create a GitHub organization by going to **Settings > Organizations > New organization**, selecting the free plan, and naming it before creating the OAuth app.

---

## ☁️ Step 4: Generate Azure Credentials

Cloud Code uses Azure to spin up the actual Linux Virtual Machines for your workspaces. You need the Azure CLI to generate the four required credentials for your `.env` file.

1.  If you don't have the Azure CLI installed on your local machine, [install it here](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
2.  Open a terminal **on your personal computer** (not the VPS) and log in to Azure:
    ```bash
    az login
    ```
3.  First, we need to get your **Subscription ID** and **Tenant ID**. Run this command:
    ```bash
    az account show
    ```
    The output will be a JSON block that looks something like this:
    ```json
    {
      "environmentName": "AzureCloud",
      "id": "11111111-2222-3333-4444-555555555555",
      "name": "My Subscription",
      "tenantId": "66666666-7777-8888-9999-000000000000",
      "user": { ... }
    }
    ```
    **Where to paste this in your `.env` file (Step 5):**
    *   Copy the value of `"id"` and paste it into `AZURE_SUBSCRIPTION_ID="..."`
    *   Copy the value of `"tenantId"` and paste it into `AZURE_TENANT_ID="..."`

4.  Next, we need to create a Service Principal (a robot account) that gives Cloud Code permission to create VMs. Run this command, replacing `YOUR_SUBSCRIPTION_ID` with the `"id"` value you just copied:
    ```bash
    az ad sp create-for-rbac --name "CloudCodeProvisioner" --role Contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID
    ```
    The output will be another JSON block that looks like this:
    ```json
    {
      "appId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "displayName": "CloudCodeProvisioner",
      "password": "some-very-long-secret-password",
      "tenant": "66666666-7777-8888-9999-000000000000"
    }
    ```
    **Where to paste this in your `.env` file (Step 5):**
    *   Copy the value of `"appId"` and paste it into `AZURE_CLIENT_ID="..."`
    *   Copy the value of `"password"` and paste it into `AZURE_CLIENT_SECRET="..."` *(⚠️ this is the ONLY time Azure will show you this password!)*

---

## ⚙️ Step 5: Configure Environment Variables

Now we need to pass the GitHub secrets, Azure keys, and your VPS IP into Cloud Code. 

1.  Back in your VPS terminal (make sure you are inside the `CloudCodeCoder` folder), copy the template environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open the `.env` file using a text editor like `nano`:
    ```bash
    nano .env
    ```
3.  **Critical Edits**: Find the respective sections in the file and fill them in exactly like below. Make sure the variables stay in their respective spots as you scroll down. **Do NOT include a trailing slash at the ends of URLs.**

    ```env
    # ... (other settings) ...

    # --- Public Host (Required for Production) ---
    NEXT_PUBLIC_APP_URL="http://YOUR_VPS_IP:3080"
    NEXT_PUBLIC_CODER_URL="http://YOUR_VPS_IP:7080"

    # --- NextAuth ---
    NEXTAUTH_URL="${NEXT_PUBLIC_APP_URL}"
    NEXTAUTH_SECRET="your_random_secret"
    GITHUB_CLIENT_ID="paste_your_github_client_id_here"
    GITHUB_CLIENT_SECRET="paste_your_github_client_secret_here"

    # ... (Coder and Database settings) ...

    # --- Azure (used by Coder for VM provisioning) ---
    AZURE_CLIENT_ID="paste_your_azure_appId_here"
    AZURE_CLIENT_SECRET="paste_your_azure_password_here"
    AZURE_SUBSCRIPTION_ID="paste_your_azure_subscription_id_here"
    AZURE_TENANT_ID="paste_your_azure_tenant_id_here"
    ```
4.  Save and exit `nano` (Press `Ctrl+O`, then `Enter` to save. Press `Ctrl+X` to exit).

---

## 🚢 Step 6: Start the Application

Everything is configured. It's time to boot up the platform!

1.  In your terminal, run the following Docker command to build and start everything in the background:
    ```bash
    docker compose up --build -d
    ```
    *(Note: The first time you run this, it will take several minutes to download dependencies and build the Next.js application.)*

2.  Verify the containers are running:
    ```bash
    docker compose ps
    ```
    You should see `cloudcode-web`, `cloudcode-coder`, `cloudcode-db`, `cloudcode-redis`, and `cloudcode-proxy` all showing as `Up`.

---

## 🛠 Step 7: Configure Coder & Workspace Templates

Before you can spin up workspaces in the dashboard, the Coder backend needs to be initialized with your Azure credentials and a template.

1.  Navigate to the Coder backend in your browser: **`http://YOUR_VPS_IP:7080`**
2.  Create your first admin account (username, email, and password).
3.  Go to **Settings** (top right) > **Tokens** > **Create Token**. Copy this token.
4.  Back in your VPS terminal, open your `.env` file again (`nano .env`) and set the token:
    ```env
    CODER_API_TOKEN="paste_your_token_here"
    ```
    Save and exit `nano`, then restart the web service so it picks up the token: 
    ```bash
    docker compose restart cloudcode-web
    ```
5.  In the Coder dashboard, go to **Templates** > **Create Template**.
6.  Select the **Azure Linux** starter template (or similar).
7.  Give the template a descriptive name (e.g., `azure-linux`). Users will see this name when they create a workspace.
8.  Follow the prompts to paste your Azure Client ID, Client Secret, Tenant ID, and Subscription ID into the Template configuration.
9.  Click **Publish** to finish the setup!

---

## 🎉 Step 8: Access Your Platform

1.  Open your web browser.
2.  Navigate to your dashboard:  **`http://YOUR_VPS_IP:3080`**
3.  Click **Login with GitHub**.
4.  Click **Create Workspace**! Since you set up the template in Step 7, Cloud Code will now seamlessly talk to Coder, which will provision the VM in Azure and give you access to your cloud IDE.

---

## 🔧 Troubleshooting

If things aren't working, here are the most common issues:

**1. The screen says "Localhost refused to connect" when I click Open IDE**
*   **Cause**: You didn't set `NEXT_PUBLIC_CODER_URL` correctly in your `.env` file *before* building.
*   **Fix**: Update `.env` to use your VPS IP. Then, rebuild the web container by running:
    `docker compose up --build -d cloudcode-web`

**2. GitHub says "Redirect URI Mismatch" when I specify try to log in**
*   **Cause**: The URL you typed into the browser does not *exactly* match the `Authorization callback URL` you pasted into GitHub in Step 3. 
*   **Fix**: Ensure your GitHub OAuth app callback looks exactly like `http://YOUR_VPS_IP:3080/api/auth/callback/github`. Note that trailing slashes will cause mismatches.

**3. Internal Server Error on Login**
*   **Cause**: Your `NEXTAUTH_SECRET` is missing, or your Database (`DB_PASSWORD`) failed to initialize.
*   **Fix**: Open `.env` and verify `NEXTAUTH_SECRET`. Check the web logs by running `docker logs cloudcode-web`. Ensure the database is running: `docker logs cloudcode-db`.

**4. I can't access Port 3080 or 7080**
*   **Cause**: Your VPS provider (like AWS, Azure, or Google Cloud) has a firewall blocking these ports.
*   **Fix**: Go to your VPS provider's dashboard and configure the Firewall/Security Groups to allow **Inbound TCP traffic** on ports `80`, `443`, `3080`, and `7080`.

---
*Built with Next.js, Coder, and Docker.*
