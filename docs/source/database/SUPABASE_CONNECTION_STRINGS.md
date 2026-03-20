# 伯 Getting Supabase Connection Strings

## Where to Find Both DATABASE_URL and DIRECT_URL

### Visual Guide

```
Supabase Dashboard
  笏披楳 Settings (笞呻ｸ・
      笏披楳 Database
          笏披楳 Connection string section
              笏披楳 Connection parameters (tabs)
                  笏披楳 URI tab 竊・CLICK THIS
                      笏披楳 Dropdown menu 竊・LOOK HERE!
                          笏懌楳 Session mode      竊・DATABASE_URL
                          笏懌楳 Transaction mode
                          笏披楳 Direct connection 竊・DIRECT_URL
```

---

## Step-by-Step Instructions

### 1・鞘Ε Get DATABASE_URL (Session Pooling)

1. In your Supabase project, click **Settings** (笞呻ｸ・icon in sidebar)
2. Click **Database** in the settings menu
3. Scroll down to **"Connection string"** section
4. Click the **"URI"** tab (not "Session", not "Transaction")
5. You'll see a dropdown - select **"Session mode"**
6. Copy the string that appears - it looks like:

```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

7. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you set when creating the project
8. Notice the port is **6543** - this confirms it's the pooled connection
9. This is your `DATABASE_URL` 笨・

**Example**:
```bash
# Before (what you see):
postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# After (what you use):
DATABASE_URL="postgresql://postgres.abcdefghijk:MySecretPass123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

---

### 2・鞘Ε Get DIRECT_URL (Direct Connection)

1. In the **SAME** location (Settings 竊・Database 竊・Connection string 竊・URI tab)
2. Change the dropdown from "Session mode" to **"Direct connection"**
3. Copy the NEW string that appears - it looks like:

```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

4. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the same password
5. Notice the port is **5432** - this confirms it's the direct connection
6. This is your `DIRECT_URL` 笨・

**Example**:
```bash
# Before (what you see):
postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# After (what you use):
DIRECT_URL="postgresql://postgres.abcdefghijk:MySecretPass123!@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

---

## 泊 Key Differences

| Variable | Port | Use Case | When Used |
|----------|------|----------|-----------|
| `DATABASE_URL` | **5432** | Session pooling (pgBouncer) | App queries, API routes |
| `DIRECT_URL` | **5432*** | Direct connection | Migrations only (`prisma db push`) |

*Note: As of 2025, Supabase uses port 5432 for both pooled and direct connections. The difference is in the hostname:
- Session Pooler: `aws-X-region.pooler.supabase.com`
- Direct Connection: `db.xxxxx.supabase.co`

---

## 搭 Quick Copy Template

Once you have both, add to your `.env.local`:

```bash
# Supabase Connection Strings
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

**Don't forget to**:
- Replace `[YOUR-PASSWORD]` with your actual password
- Replace `YOUR_PROJECT_REF` with your project's reference
- Replace `REGION` with your region (e.g., us-east-1)

---

## 笨・How to Test

After adding both to your `.env.local`:

```bash
# Test the connection
npx prisma db push
```

You should see:
```
笨・Generated Prisma Client
噫 Your database is now in sync with your Prisma schema.
```

---

## 菅 Troubleshooting

### Error: "Can't reach database server"
- 笨・Check: Did you replace `[YOUR-PASSWORD]`?
- 笨・Check: Is your IP allowed? (Supabase allows all by default)
- 笨・Check: Did you wait 2 minutes after project creation?

### Error: "Invalid connection string"
- 笨・Check: No spaces in the connection string
- 笨・Check: Password is URL-encoded if it has special characters
- 笨・Check: Copied the entire string (don't truncate)

### Password has special characters?

If your password contains `@`, `#`, `%`, etc., you need to URL-encode it:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `=` | `%3D` |

**Example**:
```bash
# Password: MyPass@123#
# Encoded:  MyPass%40123%23

DATABASE_URL="postgresql://postgres.abc:MyPass%40123%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

---

## 識 Next Steps

Once you have both connection strings:

1. 笨・Add them to `.env.local` (local development)
2. 笨・Add them to Vercel environment variables (production)
3. 笨・Run `npx prisma db push` to create tables
4. 笨・Continue with docs/source/database/DATABASE_INTEGRATION.md guide

---

## 萄 Visual Reference

**What the Supabase UI looks like:**

```
笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
笏・Connection string                        笏・
笏懌楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏､
笏・笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・笏・
笏・笏・URI | Session | Transaction         笏・笏・竊・Click "URI" tab
笏・笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・笏・
笏・                                         笏・
笏・Connection parameters:                   笏・
笏・笏娯楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・笏・
笏・笏・Session mode                   笆ｼ    笏・笏・竊・Dropdown menu!
笏・笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・笏・
笏・                                         笏・
笏・postgresql://postgres.xxx...             笏・竊・Connection string appears here
笏披楳笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏笏・
```

**Dropdown options:**
- 笨・**Session mode** 竊・DATABASE_URL (port 6543)
- Transaction mode
- 笨・**Direct connection** 竊・DIRECT_URL (port 5432)

---

**That's it!** You now have both connection strings needed for Prisma + Supabase. 噫



