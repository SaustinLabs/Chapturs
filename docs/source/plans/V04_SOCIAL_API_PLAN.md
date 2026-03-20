# v0.4 - Social Media API Integration

**Status:** 🚧 In Progress  
**Start Date:** October 15, 2025  
**Target Completion:** October 22, 2025 (1 week)

---

## Overview

Enhance 4 social media profile blocks with live data from external APIs:
1. **Twitch** - Live stream status, viewer count, game being played
2. **YouTube** - Subscriber count, video count, latest uploads
3. **Twitter/X** - Follower count, latest tweets
4. **Discord** - Member count, online users

Currently these blocks show **static data** entered in configuration modals. This update will make them **dynamic** with real-time information.

---

## Implementation Priority

### Phase 1: Twitch Integration (Day 1-2) ✅ IN PROGRESS
- Most requested by webnovel community
- Clear API documentation
- No quota limits on free tier
- Shows immediate value (LIVE indicator)

### Phase 2: Discord Integration (Day 3)
- Widget API (no auth required)
- Simple implementation
- High engagement feature

### Phase 3: YouTube Integration (Day 4-5)
- More complex (API key required)
- Quota management needed
- High value (subscriber counts)

### Phase 4: Twitter Integration (Day 6-7)
- Most restrictive API (paid tier preferred)
- Fallback to static if API unavailable
- Lower priority

---

## Architecture Design

### Caching Strategy

**Why Cache:**
- Reduce API calls
- Stay under rate limits
- Improve performance
- Lower costs

**Implementation:**
```typescript
// src/lib/cache/social-cache.ts
const cache = new Map<string, CacheEntry>()

interface CacheEntry {
  data: any
  expiresAt: number
  lastFetch: number
}

// TTL by platform
const CACHE_TTL = {
  twitch: 5 * 60 * 1000,     // 5 minutes (live data changes)
  discord: 5 * 60 * 1000,    // 5 minutes (member count)
  youtube: 60 * 60 * 1000,   // 1 hour (subscriber count)
  twitter: 15 * 60 * 1000,   // 15 minutes (rate limit window)
}
```

### API Route Structure

```
src/app/api/social/
├── twitch/
│   ├── channel/[channelName]/route.ts    # GET channel data
│   └── validate/route.ts                  # Validate channel exists
├── discord/
│   ├── server/[guildId]/route.ts         # GET server stats (widget)
│   └── validate/route.ts                  # Validate invite link
├── youtube/
│   ├── channel/[channelId]/route.ts      # GET channel stats
│   ├── video/[videoId]/route.ts          # GET video data
│   └── validate/route.ts                  # Validate channel ID
└── twitter/
    ├── user/[username]/route.ts          # GET user profile
    └── validate/route.ts                  # Validate username
```

### Environment Variables

```env
# Twitch API
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here

# YouTube API
YOUTUBE_API_KEY=your_api_key_here

# Twitter API (optional - free tier very limited)
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Discord (no API key needed for widget API)
```

---

## Phase 1: Twitch Integration

### API Documentation
- **Endpoint:** https://dev.twitch.tv/docs/api/reference
- **Rate Limit:** 800 requests/minute (Helix API)
- **Auth:** OAuth 2.0 app access token
- **Cost:** Free ✅

### Data to Fetch

1. **Channel Information**
   - `GET https://api.twitch.tv/helix/users?login={channelName}`
   - Returns: user_id, display_name, profile_image_url, description

2. **Stream Status**
   - `GET https://api.twitch.tv/helix/streams?user_login={channelName}`
   - Returns: is_live, viewer_count, title, game_name, thumbnail_url

3. **Follower Count** (optional)
   - `GET https://api.twitch.tv/helix/channels/followers?broadcaster_id={user_id}`
   - Returns: total followers

### Implementation Steps

#### 1. Create Twitch API Client

File: `src/lib/api/twitch.ts`

```typescript
interface TwitchChannel {
  userId: string
  username: string
  displayName: string
  profileImage: string
  description: string
}

interface TwitchStream {
  isLive: boolean
  viewerCount: number
  title: string
  gameName: string
  thumbnailUrl: string
  startedAt: string
}

interface TwitchData {
  channel: TwitchChannel
  stream: TwitchStream | null
  followers?: number
}

export async function getTwitchChannel(channelName: string): Promise<TwitchData>
export async function validateTwitchChannel(channelName: string): Promise<boolean>
```

**Features:**
- OAuth 2.0 app access token management
- Token refresh when expired
- Error handling for invalid channels
- Rate limit tracking

#### 2. Create API Route

File: `src/app/api/social/twitch/channel/[channelName]/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { channelName: string } }
) {
  const { channelName } = params
  
  // Check cache first
  const cached = getFromCache(`twitch:${channelName}`)
  if (cached) return NextResponse.json(cached)
  
  // Fetch from Twitch API
  const data = await getTwitchChannel(channelName)
  
  // Cache for 5 minutes
  setCache(`twitch:${channelName}`, data, 5 * 60 * 1000)
  
  return NextResponse.json(data)
}
```

#### 3. Update TwitchChannelBlock Component

File: `src/components/profile/blocks/TwitchChannelBlock.tsx`

**Current:**
```typescript
// Static data from config
const { channelName, displayName, profileImage } = data
```

**New:**
```typescript
const [liveData, setLiveData] = useState<TwitchData | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  async function fetchTwitchData() {
    try {
      const res = await fetch(`/api/social/twitch/channel/${channelName}`)
      if (!res.ok) throw new Error('Failed to fetch')
      
      const data = await res.json()
      setLiveData(data)
    } catch (err) {
      setError('Failed to load Twitch data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  fetchTwitchData()
  
  // Refresh every 5 minutes if live
  const interval = liveData?.stream?.isLive 
    ? setInterval(fetchTwitchData, 5 * 60 * 1000)
    : null
    
  return () => { if (interval) clearInterval(interval) }
}, [channelName])
```

**UI Updates:**
- Show "LIVE" badge when streaming (pulsing red dot)
- Display viewer count: "1,234 viewers"
- Show stream title and game
- Display stream thumbnail
- Fallback to static data if API fails

#### 4. Update TwitchChannelConfig Modal

File: `src/components/profile/blocks/config/TwitchChannelConfig.tsx`

**Add Validation:**
```typescript
const [isValidating, setIsValidating] = useState(false)
const [isValid, setIsValid] = useState<boolean | null>(null)

async function validateChannel(name: string) {
  setIsValidating(true)
  try {
    const res = await fetch(`/api/social/twitch/validate?channel=${name}`)
    const { valid } = await res.json()
    setIsValid(valid)
  } catch {
    setIsValid(false)
  } finally {
    setIsValidating(false)
  }
}

// Debounced validation on channelName change
useEffect(() => {
  if (!channelName) return
  
  const timeout = setTimeout(() => {
    validateChannel(channelName)
  }, 500)
  
  return () => clearTimeout(timeout)
}, [channelName])
```

**Show Validation Status:**
- ✓ Green checkmark if channel exists
- ✗ Red X if channel not found
- Spinner while validating

---

## Phase 2: Discord Integration

### API Documentation
- **Endpoint:** https://discord.com/developers/docs/resources/guild#get-guild-widget
- **Rate Limit:** ~50 requests/second (very generous)
- **Auth:** None required (widget API is public)
- **Cost:** Free ✅

### Widget API

**No auth required!** Just need guild ID from invite link.

```
GET https://discord.com/api/guilds/{guild_id}/widget.json
```

**Response:**
```json
{
  "id": "123456789",
  "name": "Server Name",
  "instant_invite": "https://discord.gg/invite",
  "channels": [...],
  "members": [...],
  "presence_count": 42
}
```

### Implementation

Much simpler than Twitch:

1. Extract guild ID from invite link
2. Call widget API (no auth)
3. Display member/online counts
4. Cache for 5 minutes

---

## Phase 3: YouTube Integration

### API Documentation
- **Endpoint:** https://developers.google.com/youtube/v3/docs
- **Rate Limit:** 10,000 quota units/day (free tier)
- **Auth:** API key
- **Cost:** Free (with quota) ✅

### Quota Management

**Quota Costs:**
- Channel stats: 1 unit per request
- Video details: 1 unit per request
- Search: 100 units per request ⚠️

**Strategy:**
- Cache aggressively (1 hour)
- Only fetch channel stats (cheap)
- Avoid search API (expensive)
- Monitor quota usage

### Data to Fetch

```
GET https://www.googleapis.com/youtube/v3/channels
  ?part=statistics,snippet
  &id={channel_id}
  &key={API_KEY}
```

**Response:**
- Subscriber count
- Video count
- View count
- Channel description
- Thumbnails

---

## Phase 4: Twitter Integration

### Challenge: API Access

**Twitter API v2 Tiers:**
- **Free:** 500,000 tweets/month, 1,500 requests/month ⚠️
- **Basic:** $100/month, 10,000 requests/month
- **Pro:** $5,000/month, unlimited

**Reality:** Free tier is too restrictive for production.

### Strategy

**Option 1:** Use free tier with heavy caching
- Cache for 24 hours
- Only update once per day per user
- Monitor quota closely

**Option 2:** Fallback to static data
- If quota exceeded, use config data
- Show "updated X hours ago" timestamp
- Graceful degradation

**Option 3:** Skip Twitter for v0.4
- Implement later when funded
- Focus on Twitch/Discord/YouTube first

**Recommendation:** Option 2 (implement with fallback)

---

## Testing Plan

### Twitch
- [ ] Valid channel → Fetches data successfully
- [ ] Invalid channel → Shows error gracefully
- [ ] Offline channel → Shows offline state
- [ ] Live channel → Shows LIVE badge, viewers, game
- [ ] Cache working → Same request uses cache
- [ ] Cache expiry → Refreshes after 5 minutes
- [ ] Config validation → Real-time check works

### Discord
- [ ] Valid invite → Fetches server stats
- [ ] Invalid invite → Shows error
- [ ] Widget enabled → Shows member counts
- [ ] Widget disabled → Fallback message
- [ ] Cache working → Multiple requests use cache

### YouTube
- [ ] Valid channel → Shows subscriber count
- [ ] Invalid channel → Error handling
- [ ] Quota tracking → Monitors daily usage
- [ ] Cache working → 1 hour TTL

### Twitter
- [ ] API available → Fetches data
- [ ] Quota exceeded → Falls back to static
- [ ] Shows timestamp of last update
- [ ] Error handling graceful

---

## Rollout Plan

### Day 1-2: Twitch ✅ Starting Now
1. Set up Twitch dev account
2. Get Client ID and Secret
3. Implement OAuth token management
4. Create API client
5. Create API route with caching
6. Update TwitchChannelBlock component
7. Add validation to config modal
8. Test thoroughly
9. Deploy to production

### Day 3: Discord
1. Test widget API
2. Create guild ID extraction logic
3. Create API route
4. Update DiscordInviteBlock
5. Test and deploy

### Day 4-5: YouTube
1. Set up Google Cloud project
2. Enable YouTube Data API v3
3. Get API key
4. Implement quota tracking
5. Create API client
6. Update YouTubeChannelBlock
7. Test quota management
8. Deploy

### Day 6-7: Twitter
1. Evaluate free tier limits
2. Implement with fallback strategy
3. Heavy caching (24 hours)
4. Update TwitterFeedBlock
5. Test quota handling
6. Deploy

---

## Success Metrics

### Before v0.4
- ❌ Social blocks show static data
- ❌ No live stream indicators
- ❌ No subscriber/follower counts
- ❌ Manual updates required

### After v0.4
- ✅ Twitch shows LIVE status in real-time
- ✅ Discord shows current member counts
- ✅ YouTube shows live subscriber counts
- ✅ Twitter shows latest follower counts
- ✅ Automatic updates (no manual work)
- ✅ Cached for performance
- ✅ Graceful error handling

---

## Next Steps

1. **Set up Twitch Developer Account**
   - Go to: https://dev.twitch.tv/console
   - Create application
   - Get Client ID and Secret
   - Add to Vercel environment variables

2. **Implement Twitch OAuth**
   - App access token flow
   - Token refresh logic
   - Error handling

3. **Create caching layer**
   - In-memory cache with TTL
   - Redis for production (later)

4. **Build API routes**
   - Start with Twitch
   - Add Discord next
   - Then YouTube
   - Finally Twitter

Let's begin! 🚀
