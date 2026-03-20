# Supabase Connection Error Fix

## Error
```
Can't reach database server at `aws-1-us-east-2.pooler.supabase.com:5432`
```

## Root Cause
Vercel serverless functions have connection pooling limits and timeouts when connecting to Supabase. The default Prisma Client doesn't handle connection pooling properly for Supabase's pooler.

## Solution

### 1. Environment Variables in Vercel
Make sure you have both connection strings set in Vercel environment variables:

**DATABASE_URL** (Transaction Mode - for connection pooling):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**DIRECT_URL** (Session Mode - for migrations):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 2. Get Your Connection Strings from Supabase

1. Go to your Supabase project dashboard
2. Click **Settings** → **Database**
3. Scroll to **Connection string**
4. Copy **Transaction mode** (port 6543) → Use as `DATABASE_URL`
5. Copy **Session mode** (port 5432) → Use as `DIRECT_URL`

### 3. Important Connection Parameters

Add these parameters to your `DATABASE_URL`:
- `?pgbouncer=true` - Enables PgBouncer compatibility
- `&connection_limit=1` - Limits connections per serverless function
- `&pool_timeout=0` - Prevents timeout errors
- `&connect_timeout=30` - Gives more time to establish connection

**Full Example:**
```
DATABASE_URL="postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0&connect_timeout=30"
DIRECT_URL="postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 4. Vercel Deployment

After updating environment variables:
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Update `DATABASE_URL` and `DIRECT_URL`
4. Redeploy your application

### 5. Code Changes Made

Updated `/src/lib/database/PrismaService.ts`:
- Global Prisma instance to prevent multiple connections
- Connection retry logic with exponential backoff
- Proper disconnection on shutdown
- Development vs production logging

## Testing

After applying the fix:
1. Try creating a new work on `/creator/upload`
2. Check Vercel logs for connection errors
3. If still failing, check Supabase dashboard → Database → Connection pooling

## Additional Resources

- [Supabase Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Vercel + Supabase Connection Pooling](https://vercel.com/guides/deploying-prisma-with-postgres-on-vercel)
- [Prisma Connection Pool Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
