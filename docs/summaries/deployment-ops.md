# Deployment & Ops Summary

**Vercel Deployment**
- Source: docs/source/ops/VERCEL_DEPLOYMENT_GUIDE.md. PlanetScale-centric deployment steps (env vars, `npx prisma db push`, `vercel.json` cron). Note this conflicts with Supabase-based docs; confirm which DB is current.
- Source: docs/source/ops/DEPLOYMENT_COMPLETE.md and docs/source/ops/GO_PUBLIC_CHECKLIST.md. Launch status and go-public checklist.
- Source: docs/source/ops/VERCEL_CRON_LIMITATIONS.md. Hobby plan limits; recommends on-demand processing or external cron/GitHub Actions.

**Environment Variables**
- Source: docs/source/ops/VERCEL_ENV_SETUP.md. R2-related env vars and testing `/test-upload` (contains hard-coded credentials that should be rotated).
- Source: docs/source/ops/AUTH_SETUP_VERCEL.md and docs/source/ops/GOOGLE_OAUTH_SETUP.md. OAuth setup and required Auth.js env vars.

**Image Upload Ops**
- Source: docs/source/ops/IMAGE_UPLOAD_CHECKLIST.md and QUICK_START_IMAGE_UPLOAD.md. Implementation checklist and 5-minute setup flow, with R2 bucket/CORS steps.
- Source: docs/source/ops/R2_CORS_CHECKLIST.md. CORS configuration for R2 bucket to allow uploads from app domains.

**Groq/LLM Ops**
- Source: docs/source/ops/GROQ_INTEGRATION.md. Groq API key setup and model configuration for quality assessment.

**Test & Deploy**
- Source: docs/source/ops/TEST_AND_DEPLOY_GUIDE.md. Combined test/deploy checklist.

**Operational Commands & Paths (common)**
- `npx prisma generate`, `npx prisma db push`, `npx prisma migrate deploy`
- `vercel.json` for cron configuration
- Test endpoints: `/api/test-db`, `/api/quality-assessment/*`, `/api/cron/*`, `/test-upload`

**Note on Conflicting DB Guidance**
- The repo contains PlanetScale and Supabase deployment guidance. The current implementation should pick one primary DB and clean up stale docs accordingly.
