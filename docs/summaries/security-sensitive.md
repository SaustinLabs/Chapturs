# Security-Sensitive Notes

This repo contains documentation files that include real credentials. Treat these as compromised and rotate them.

**Known Files with Secrets**
- docs/source/ops/VERCEL_ENV_SETUP.md: R2 account ID, access key, secret key, public URL.
- docs/source/fixes/VERCEL_SERVER_ERROR_FIX.md: hard-coded AUTH_SECRET value.
- docs/source/ops/AUTH_SETUP_VERCEL.md and docs/source/ops/GOOGLE_OAUTH_SETUP.md: instructions that may reference real OAuth credentials.

**Recommended Actions**
- Rotate R2 access keys and update environment variables.
- Rotate AUTH_SECRET and any OAuth client secrets.
- Scrub secrets from documentation once rotated.

**Local Secrets**
- `.env.local` exists under `.preclone-backup/` from the pre-clone move; verify it is not committed or shared.
