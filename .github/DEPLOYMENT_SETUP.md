# Chapturs: GitHub-to-VPS Automated Deployment Setup

This guide walks you through setting up automated deployment from GitHub to your VPS running PM2.

## Overview

When you push to the `main` branch on GitHub, the deployment workflow will:
1. Pull the latest code from GitHub
2. Install dependencies
3. Build the Next.js application
4. Sync Prisma migrations with Supabase
5. Reload the PM2 application

## Prerequisites

- Ubuntu 24.04 VPS with Node.js and PM2 already running
- Supabase PostgreSQL database (already configured)
- GitHub repository access (https://github.com/SaustinLabs/Chapturs)

## Setup Instructions

### Step 1: Generate SSH Key for GitHub-to-VPS Authentication

On your **local machine**, generate an SSH key pair:

```bash
ssh-keygen -t ed25519 -C "chapturs-deployment" -f ~/.ssh/chapturs-deploy
```

When prompted, press Enter to use the default location and leave the passphrase empty (or set one if you prefer).

This creates two files:
- `~/.ssh/chapturs-deploy` (private key - secret)
- `~/.ssh/chapturs-deploy.pub` (public key - will be added to VPS)

### Step 2: Add Public Key to VPS

On your **VPS**, add the public key to your SSH authorized keys:

```bash
# SSH into VPS as the deploy user (e.g., root or ubuntu)
ssh root@YOUR_VPS_IP

# Paste the contents of chapturs-deploy.pub into authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAbcdef..." >> ~/.ssh/authorized_keys

# Ensure proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**To get the public key contents**, on your local machine run:
```bash
cat ~/.ssh/chapturs-deploy.pub
```

### Step 3: Add GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add the following:

| Secret Name | Value | Example |
|---|---|---|
| `VPS_HOST` | Your VPS IP or hostname | `192.168.1.100` or `vps.example.com` |
| `VPS_USER` | SSH username on VPS | `root` or `ubuntu` |
| `VPS_SSH_KEY` | Contents of `~/.ssh/chapturs-deploy` (PRIVATE key) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (default: 22) | `22` (optional) |
| `VPS_APP_DIR` | Path to Chapturs app on VPS | `/root/chapturs` or `~/chapturs` (optional, defaults to ~/chapturs) |
| `PM2_APP_NAME` | PM2 app name | `chapturs` (optional, defaults to chapturs) |

**Important**: The `VPS_SSH_KEY` secret should contain the **PRIVATE** key (`~/.ssh/chapturs-deploy`), not the public key.

### Step 4: Verify PM2 Setup on VPS

On your VPS, verify that PM2 is running and note the app name:

```bash
# Check PM2 status
pm2 status

# If Chapturs app is not running, start it:
cd ~/chapturs
pm2 start npm --name chapturs -- start

# Save PM2 config so app restarts on VPS reboot
pm2 startup
pm2 save
```

Note the app name shown in `pm2 status` (likely `chapturs`). Use this for the `PM2_APP_NAME` secret.

### Step 5: Test Deployment

**Manual Test** (recommended first):

1. Go to GitHub repo → **Actions** tab
2. Select **Deploy to VPS** workflow
3. Click **Run workflow** → **Run workflow** button
4. Monitor the workflow run

**Expected output**:
```
✓ Deployment successful!
Application is now running on VPS at YOUR_VPS_IP
```

If it fails, check:
- VPS SSH connectivity: `ssh -i ~/.ssh/chapturs-deploy root@VPS_IP`
- GitHub secrets are correctly set (no typos)
- VPS has Git, Node.js, npm, and PM2 installed

### Step 6: Automatic Deployments

Now, every time you push to the `main` branch, the workflow automatically runs:

```bash
# On your local machine
git add .
git commit -m "Feature: Add new content type"
git push origin main

# Workflow triggers automatically → deploys to VPS → PM2 reloads
```

**To monitor** deployments:
1. Go to GitHub repo → **Actions** tab
2. Click on the latest workflow run to see logs

## Troubleshooting

### "SSH permission denied"
- Verify public key is in VPS `~/.ssh/authorized_keys`
- Check file permissions: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

### "git pull origin main" fails
- Verify GitHub repo SSH URL is correct in VPS
- Check that VPS has read access to the repository (SSH key or HTTPS auth)

### "PM2 reload" fails
- App may not be running. Check: `pm2 status`
- Ensure app name matches `PM2_APP_NAME` secret
- Try: `pm2 restart chapturs` manually on VPS

### "npm install" or "build" fails
- Check Node.js version: `node -v` (should be 20.x or higher, 22.x also works)
- Check available disk space: `df -h`
- Check env vars are loaded: `cat .env.local | head -5`

### Database migrations fail
- Verify `DATABASE_URL` in VPS `.env.local` points to correct Supabase instance
- Test connection: `psql $DATABASE_URL -c "SELECT NOW();"`

## Environment Variables

Ensure your VPS `.env.local` has all required variables:

```bash
# .env.local on VPS
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"
AUTH_SECRET="your-secret-here"
AUTH_GOOGLE_ID="your-google-id"
AUTH_GOOGLE_SECRET="your-google-secret"
# ... other variables from .env.example
```

**Never** commit real secrets to GitHub. Keep them in VPS `.env.local` only.

## Manual Deployment (Fallback)

If GitHub Actions isn't working, SSH into VPS and run manually:

```bash
ssh root@YOUR_VPS_IP
cd ~/chapturs
./.github/scripts/deploy.sh
```

## Next Steps

- [Pretext Integration Guide](../PRETEXT_INTEGRATION.md) - Using Pretext for text measurement
- Monitor deployment logs in GitHub Actions
- Set up monitoring/alerting for VPS application health

---

**Questions?** Check GitHub Actions logs or VPS logs for error details.
