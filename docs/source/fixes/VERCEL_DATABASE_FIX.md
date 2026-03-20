# Vercel Database Connection Fix

## Issue
Vercel deployment was failing with database connection errors:
```
Can't reach database server at aws-1-us-east-2.pooler.supabase.com:5432
```

## Root Cause
Supabase connection pooling requires different connection strings for serverless environments like Vercel:
- Session pooler (port 5432) is for long-lived connections
- Transaction pooler (port 6543) is for serverless/short-lived connections

## Solution

### Vercel Environment Variables (CRITICAL)
Set these in Vercel Dashboard 竊・Settings 竊・Environment Variables:

```bash
# For serverless functions (Vercel)
DATABASE_URL=postgresql://postgres.bfsgyutvcatpadtvegjd:9W5HXuNrxepvIBCF@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# For migrations only
DIRECT_URL=postgresql://postgres.bfsgyutvcatpadtvegjd:9W5HXuNrxepvIBCF@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Auth (also required)
AUTH_SECRET=<AUTH_SECRET>
NEXTAUTH_URL=https://your-app.vercel.app  # Update with your actual Vercel domain
```

### Key Differences
- **DATABASE_URL**: Port **6543** + `?pgbouncer=true&connection_limit=1`
- **DIRECT_URL**: Port **5432** (for migrations)

### After Updating
1. Save environment variables in Vercel
2. Redeploy the application
3. Check function logs to verify database connectivity

## Local Development
Local `.env` file can use either connection string since it's long-lived:
```bash
DATABASE_URL="postgresql://postgres.bfsgyutvcatpadtvegjd:9W5HXuNrxepvIBCF@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.bfsgyutvcatpadtvegjd:9W5HXuNrxepvIBCF@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

## Testing
After deployment, test:
1. Sign in (tests auth + database)
2. Go to Manage Stories (tests user works query)
3. Upload and publish content (tests write operations)
4. View home feed (tests read operations)

## References
- [Supabase Serverless Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)

