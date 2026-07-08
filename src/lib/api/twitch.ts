/**
 * Twitch API Client
 * 
 * Handles OAuth authentication and API requests to Twitch Helix API.
 * Manages app access tokens and provides methods to fetch channel/stream data.
 * 
 * API Documentation: https://dev.twitch.tv/docs/api/reference
 * Rate Limit: 800 requests/minute
 */

interface TwitchChannel {
  userId: string
  username: string
  displayName: string
  profileImage: string
  description: string
  viewCount: number
  createdAt: string
}

interface TwitchStream {
  isLive: boolean
  viewerCount: number
  title: string
  gameName: string
  gameId: string
  thumbnailUrl: string
  startedAt: string
  language: string
  tags: string[]
}

export interface TwitchData {
  channel: TwitchChannel
  stream: TwitchStream | null
  followers?: number
  error?: string
}

interface TwitchTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface TwitchUser {
  id: string
  login: string
  display_name: string
  type: string
  broadcaster_type: string
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number
  created_at: string
}

interface TwitchStreamResponse {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  type: 'live' | ''
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tag_ids: string[]
  tags: string[]
  is_mature: boolean
}

class TwitchClient {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID || ''
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET || ''

    if (!this.clientId || !this.clientSecret) {
      console.warn('[TwitchClient] Missing credentials. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables.')
    }
  }

  /**
   * Check if client is configured with valid credentials
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret)
  }

  /**
   * Get app access token (OAuth 2.0 Client Credentials flow)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }


    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get Twitch access token: ${response.statusText}`)
    }

    const data: TwitchTokenResponse = await response.json()
    
    this.accessToken = data.access_token
    // Set expiry with 5 minute buffer
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000


    return this.accessToken
  }

  /**
   * Make authenticated request to Twitch Helix API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const token = await this.getAccessToken()

    const response = await fetch(`https://api.twitch.tv/helix${endpoint}`, {
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Twitch API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get channel information by username
   */
  async getUser(username: string): Promise<TwitchUser | null> {
    try {
      const data = await this.request<{ data: TwitchUser[] }>(`/users?login=${username}`)
      return data.data[0] || null
    } catch (error) {
      console.error('[TwitchClient] Error fetching user:', error)
      return null
    }
  }

  /**
   * Get stream information (live status) by username
   */
  async getStream(username: string): Promise<TwitchStreamResponse | null> {
    try {
      const data = await this.request<{ data: TwitchStreamResponse[] }>(`/streams?user_login=${username}`)
      return data.data[0] || null
    } catch (error) {
      console.error('[TwitchClient] Error fetching stream:', error)
      return null
    }
  }

  /**
   * Get follower count for a channel
   */
  async getFollowerCount(userId: string): Promise<number> {
    try {
      const data = await this.request<{ total: number }>(`/channels/followers?broadcaster_id=${userId}`)
      return data.total
    } catch (error) {
      console.error('[TwitchClient] Error fetching followers:', error)
      return 0
    }
  }

  /**
   * Get complete channel data (user + stream + followers)
   */
  async getChannelData(channelName: string): Promise<TwitchData> {
    if (!this.isConfigured()) {
      return {
        channel: {
          userId: '',
          username: channelName,
          displayName: channelName,
          profileImage: '',
          description: '',
          viewCount: 0,
          createdAt: ''
        },
        stream: null,
        error: 'Twitch API not configured. Contact administrator.'
      }
    }

    try {
      // Fetch user data
      const user = await this.getUser(channelName)
      
      if (!user) {
        return {
          channel: {
            userId: '',
            username: channelName,
            displayName: channelName,
            profileImage: '',
            description: '',
            viewCount: 0,
            createdAt: ''
          },
          stream: null,
          error: 'Channel not found'
        }
      }

      // Fetch stream data (if live)
      const streamData = await this.getStream(channelName)

      // Fetch follower count (optional - can be slow)
      const followers = await this.getFollowerCount(user.id)

      const channel: TwitchChannel = {
        userId: user.id,
        username: user.login,
        displayName: user.display_name,
        profileImage: user.profile_image_url,
        description: user.description,
        viewCount: user.view_count,
        createdAt: user.created_at
      }

      const stream: TwitchStream | null = streamData ? {
        isLive: true,
        viewerCount: streamData.viewer_count,
        title: streamData.title,
        gameName: streamData.game_name,
        gameId: streamData.game_id,
        thumbnailUrl: streamData.thumbnail_url.replace('{width}', '1920').replace('{height}', '1080'),
        startedAt: streamData.started_at,
        language: streamData.language,
        tags: streamData.tags || []
      } : null

      return {
        channel,
        stream,
        followers
      }

    } catch (error) {
      console.error('[TwitchClient] Error fetching channel data:', error)
      return {
        channel: {
          userId: '',
          username: channelName,
          displayName: channelName,
          profileImage: '',
          description: '',
          viewCount: 0,
          createdAt: ''
        },
        stream: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate if a channel exists
   */
  async validateChannel(channelName: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    const user = await this.getUser(channelName)
    return user !== null
  }
}

// Singleton instance
const twitchClient = new TwitchClient()

export default twitchClient
