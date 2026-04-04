// Client-Side Data Service - Uses API endpoints, NOT direct database
import { Work, FeedItem } from '@/types'

export class DataService {
  // Works Operations
  static async getAllWorks(): Promise<Work[]> {
    const response = await fetch('/api/works')
    if (!response.ok) {
      throw new Error('Failed to fetch works')
    }
    return response.json()
  }

  static async getWork(id: string): Promise<Work | null> {
    const response = await fetch(`/api/works/${id}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch work')
    }
    return response.json()
  }

  static async searchWorks(query: string, filters: any = {}): Promise<Work[]> {
    const params = new URLSearchParams({
      q: query,
      ...filters
    })
    const response = await fetch(`/api/works/search?${params}`)
    if (!response.ok) {
      throw new Error('Failed to search works')
    }
    return response.json()
  }

  static async getFeedItems(hubMode: 'reader' | 'creator', userId?: string, page = 1, filter: 'all' | 'following' = 'all'): Promise<FeedItem[]> {
    const limit = 20
    const offset = (page - 1) * limit
    const params = new URLSearchParams({
      hubMode,
      filter,
      limit: String(limit),
      offset: String(offset),
      ...(userId && { userId })
    })
    
    const response = await fetch(`/api/feed?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch feed items')
    }
    
    const data = await response.json()
    return data.data?.items || data.items || []
  }

  // User Operations - API calls only
  static async toggleSubscription(authorId: string, userId: string): Promise<boolean> {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId, userId })
    })
    if (!response.ok) {
      throw new Error('Failed to toggle subscription')
    }
    const data = await response.json()
    return data.subscribed
  }

  static async toggleBookmark(workId: string, userId: string): Promise<boolean> {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId, userId })
    })
    if (!response.ok) {
      throw new Error('Failed to toggle bookmark')
    }
    const data = await response.json()
    return data.bookmarked
  }

  static async checkUserBookmark(userId: string, workId: string): Promise<boolean> {
    const response = await fetch(`/api/bookmarks?userId=${userId}&workId=${workId}`)
    if (!response.ok) {
      throw new Error('Failed to check bookmark')
    }
    const data = await response.json()
    return data.bookmarked
  }

  static async checkUserSubscription(userId: string, authorId: string): Promise<boolean> {
    const response = await fetch(`/api/subscriptions?userId=${userId}&authorId=${authorId}`)
    if (!response.ok) {
      throw new Error('Failed to check subscription')
    }
    const data = await response.json()
    return data.subscribed
  }

  static async toggleLike(workId: string, userId: string): Promise<boolean> {
    const response = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId, userId })
    })
    if (!response.ok) {
      throw new Error('Failed to toggle like')
    }
    const data = await response.json()
    return data.liked
  }

  static async checkUserLike(userId: string, workId: string): Promise<boolean> {
    const response = await fetch(`/api/likes?userId=${userId}&workId=${workId}`)
    if (!response.ok) {
      throw new Error('Failed to check like')
    }
    const data = await response.json()
    return data.liked
  }

  // Library Operations
  static async getUserLibrary(userId: string): Promise<any[]> {
    const response = await fetch(`/api/library?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch library data')
    }
    const data = await response.json()
    return data.items || []
  }

  // Creator Operations
  static async createWork(workData: any): Promise<Work> {
    const response = await fetch('/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workData)
    })
    if (!response.ok) {
      throw new Error('Failed to create work')
    }
    return response.json()
  }

  static async updateWork(id: string, workData: any): Promise<Work> {
    const response = await fetch(`/api/works/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workData)
    })
    if (!response.ok) {
      throw new Error('Failed to update work')
    }
    return response.json()
  }

  static async getUserWorks(userId: string): Promise<{ published: Work[], drafts: Work[] }> {
    const response = await fetch(`/api/works/user/${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user works')
    }
    const data = await response.json()
    return {
      published: data.works || [],
      drafts: data.drafts || []
    }
  }

  // Analytics - API call to analytics endpoint
  static async getAnalytics(userId: string, period: '7d' | '30d' | '90d' = '30d') {
    const response = await fetch(`/api/analytics?userId=${userId}&period=${period}`)
    if (!response.ok) {
      throw new Error('Failed to fetch analytics')
    }
    return response.json()
  }
  
  static async getCreatorAnalytics() {
    const res = await fetch('/api/creator/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }
}

export default DataService
