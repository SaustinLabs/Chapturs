# 🚀 Push Database Schema to Supabase

## You're Here: Environment Variables Added to Vercel ✅

Now you need to push your Prisma schema to create the database tables.

---

## Step 1: Add Variables to Local `.env.local`

I just created a template at `.env.local`. Edit it with your actual values:

```bash
# Open the file
code .env.local

# Or edit it directly:
nano .env.local
```

**Replace the placeholder values** with your actual:
- `DATABASE_URL` from Supabase (Session mode - port 6543)
- `DIRECT_URL` from Supabase (Direct connection - port 5432)
- `UPSTASH_REDIS_REST_URL` from Upstash
- `UPSTASH_REDIS_REST_TOKEN` from Upstash

---

## Step 2: Generate Prisma Client

This creates the TypeScript types for your database:

```bash
npx prisma generate
```

You should see:
```
✔ Generated Prisma Client
```

---

## Step 3: Push Schema to Supabase

This creates all your database tables:

```bash
npx prisma db push
```

You'll see:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public"

🚀 Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

**What this does:**
- Creates all tables (User, Work, Chapter, Comment, etc.)
- Sets up relationships and constraints
- Creates indexes for performance
- NO migration files needed (db push is simpler than migrations)

---

## Step 4: Verify in Supabase Dashboard

1. Go to your Supabase project
2. Click **Table Editor** (📊 icon in sidebar)
3. You should see all your tables:
   - User
   - Work
   - Chapter
   - Section
   - Comment
   - Translation
   - Like
   - Subscription
   - etc.

---

## Step 5: (Optional) Seed Sample Data

If you want to test with some sample data:

```bash
npx prisma db seed
```

This will run the seed script if you have one configured.

---

## ✅ Verification Checklist

- [ ] `.env.local` has all 4 new variables
- [ ] `npx prisma generate` ran successfully
- [ ] `npx prisma db push` completed without errors
- [ ] Supabase Table Editor shows all tables
- [ ] No error messages in terminal

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Fix:** Check your connection strings in `.env.local`
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"
```

### Error: "Environment variable not found: DATABASE_URL"

**Fix:** Make sure `.env.local` is in the root directory
```bash
# Check if file exists
ls -la .env.local

# Check if variables are set
cat .env.local
```

### Error: "Invalid connection string format"

**Fix:** Make sure you replaced `[YOUR-PASSWORD]` with actual password
```bash
# Connection string should NOT have [YOUR-PASSWORD]
# It should be: postgresql://postgres.xxx:ActualPassword123@...
```

### Error: "SSL connection required"

**Fix:** Add `?sslmode=require` to end of DATABASE_URL
```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

---

## 🎯 Next Step: Create vercel.json

Once your database is set up, you need to configure the cron jobs.

Create `vercel.json` in the root:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-assessments",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/flush-analytics",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Then commit and push:
```bash
git add vercel.json .env.local
git commit -m "feat: Add cron jobs configuration"
git push origin main
```

**Note:** `.env.local` is in `.gitignore` so it won't be pushed (that's good - keeps secrets local!)

---

## 🚀 After This

Your app will be ready to deploy! The next automatic Vercel build will:
- ✅ Use your environment variables
- ✅ Connect to Supabase
- ✅ Use Redis for batching
- ✅ Run cron jobs every 5 minutes

---

## Quick Command Reference

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# View database in browser GUI
npx prisma studio

# Check what's in the database
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\""

# Reset database (careful - deletes all data!)
npx prisma db push --force-reset
```

---

**Ready?** Run the commands in Step 2 and Step 3! 🚀
