// Edge-compatible Supabase REST API helper
// Replaces Prisma for edge runtime API routes

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Prefer': 'return=representation',
}

// Generic query helper
export async function supabaseQuery<T = any>(
  table: string,
  options: {
    select?: string
    filter?: Record<string, string>
    order?: string
    limit?: number
    single?: boolean
  } = {}
): Promise<T | null> {
  const { select = '*', filter, order, limit, single } = options

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`

  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      url += `&${key}=${encodeURIComponent(value)}`
    }
  }
  if (order) url += `&order=${order}`
  if (limit) url += `&limit=${limit}`
  if (single) url += '&limit=1'

  const res = await fetch(url, { headers })

  if (!res.ok) {
    throw new Error(`Supabase query failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return single ? (data[0] ?? null) : data
}

// Insert/upsert
export async function supabaseInsert<T = any>(
  table: string,
  data: Record<string, any>,
  options: { upsert?: boolean } = {}
): Promise<T> {
  const h = { ...headers }
  if (options.upsert) {
    h['Prefer'] = 'resolution=merge-duplicates,return=representation'
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

// Update
export async function supabaseUpdate<T = any>(
  table: string,
  filter: Record<string, string>,
  data: Record<string, any>
): Promise<T> {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`
  const params = Object.entries(filter).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  url += params.join('&')

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error(`Supabase update failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

// Delete
export async function supabaseDelete(
  table: string,
  filter: Record<string, string>
): Promise<void> {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`
  const params = Object.entries(filter).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  url += params.join('&')

  const res = await fetch(url, { method: 'DELETE', headers })

  if (!res.ok) {
    throw new Error(`Supabase delete failed: ${res.status} ${await res.text()}`)
  }
}
