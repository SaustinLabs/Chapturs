# Bugs, Fixes, and Troubleshooting Summary

**Login “Access Denied” after Google OAuth**
- Source: docs/source/fixes/ACCESS_DENIED_DEBUG.md. Root causes: missing DATABASE_URL/DIRECT_URL in Vercel, missing Prisma client generation, schema not pushed. Suggested fixes: add env vars in Vercel, ensure `postinstall` runs `prisma generate`, run `npx prisma db push`, check function logs at `/api/auth/callback/google`.

**Creator Works Missing in Hub**
- Sources: docs/source/fixes/PR_SUMMARY.md, docs/source/fixes/QUICK_START_FIX.md, docs/source/fixes/CREATOR_WORKS_FIX_GUIDE.md, docs/source/fixes/CREATOR_WORKS_INVESTIGATION.md, CREATOR_WORKS_ISSUE_DEBUG.md. Root cause: works linked to a different author profile/user ID. Fix via diagnostic endpoint `/api/creator/debug` and migration endpoint `/api/creator/fix-works`. Important: remove these debug endpoints after resolution (security risk).

**Character Profile 500 Error**
- Source: docs/source/fixes/CHARACTER_PROFILE_FIX_SUMMARY.md. Root cause: missing character tables in production. Fix: apply migration `prisma/migrations/20251014000000_add_character_system/migration.sql` via `npx prisma migrate deploy` or Supabase SQL Editor. API route improved with Zod validation and explicit error handling. See docs/source/database/CHARACTER_SYSTEM_MIGRATION.md and docs/source/testing/MANUAL_TESTING_CHARACTER_PROFILE.md.

**R2 Upload CORS Errors**
- Source: docs/source/fixes/FIX_CORS_ERROR.md. Fix: add CORS policy on Cloudflare R2 bucket to allow `https://chapturs.com` and Vercel preview domains; verify public access and test at `/test-upload`.

**Supabase Connection Errors (Vercel Serverless)**
- Source: docs/source/fixes/SUPABASE_CONNECTION_FIX.md. Fix: use pooled `DATABASE_URL` with `pgbouncer=true&connection_limit=1`, keep `DIRECT_URL` for migrations, and ensure PrismaService uses a global singleton with retry logic.

**Vercel “Server Error” (NextAuth v5)**
- Source: docs/source/fixes/VERCEL_SERVER_ERROR_FIX.md. Root cause: missing `AUTH_SECRET` and OAuth env vars. Fix: add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and production `NEXTAUTH_URL` in Vercel, then redeploy.

**Vercel Auto-Deploy Not Triggering**
- Source: docs/source/fixes/VERCEL_AUTO_DEPLOY_FIX.md. Fix: reconnect GitHub repo in Vercel (refresh webhook), verify production branch and auto-deploy settings, optionally test with empty commit.

**Vercel Build Failures**
- Source: docs/source/fixes/VERCEL_BUILD_FIXES.md. Fixes applied include Prisma client singleton (`src/lib/prisma.ts`), lazy Groq/OpenAI client init, build-safe env validation, and safe Stripe import. Result: builds succeed without env vars; runtime warns if missing.

**Vercel Deployment Troubleshooting**
- Source: docs/source/fixes/VERCEL_DEPLOYMENT_TROUBLESHOOTING.md. Checklist for auto-deploy, build logs, webhooks, manual redeploys, and verifying commit SHA in deployments.

**Other Fixes**
- Source: docs/source/fixes/VERCEL_DATABASE_FIX.md. Database connection fixes specific to Vercel (see file for exact steps).

**Security Note**
- Several fix docs include real secrets (AUTH_SECRET, R2 keys) and temporary diagnostic endpoints. Treat those as compromised: rotate credentials and remove debug endpoints after use.



