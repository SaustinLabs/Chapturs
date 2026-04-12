# Project Deployment Context

This file helps AI agents understand the actual deployment setup. Many agents incorrectly assume Vercel deployment — read this first.

- **Deployment**: VPS (not Vercel) with auto-update via GitHub Actions.
- **Secrets**: Stored in GitHub Secrets (not Vercel env vars).
- **Database**: Supabase.
- **Repository**: https://github.com/SaustinLabs/Chapturs
- **Google OAuth "Access Denied" login issue**: Fixed — environment variables are correctly set via GitHub Secrets for the VPS deploy.
- **Stack**: Next.js App Router, TypeScript, Prisma, Tailwind, Cloudflare R2, OpenRouter
