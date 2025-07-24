import { blink } from '@/blink/client'
import type { Article } from '@/types/news'

export interface ShareAnalytics {
  id: string
  article_id: string
  platform: string
  shared_at: string
  user_id: string
  custom_message?: string
  share_method: 'native' | 'social' | 'copy'
}

export class SocialShareService {
  // Track share analytics
  static async trackShare(
    articleId: string, 
    platform: string, 
    method: 'native' | 'social' | 'copy',
    customMessage?: string
  ): Promise<void> {
    try {
      const user = await blink.auth.me()
      if (!user) return

      await blink.db.share_analytics.create({
        id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        article_id: articleId,
        platform,
        shared_at: new Date().toISOString(),
        user_id: user.id,
        custom_message: customMessage,
        share_method: method
      })

      // Track analytics event
      blink.analytics.log('article_shared', {
        article_id: articleId,
        platform,
        share_method: method,
        has_custom_message: !!customMessage
      })
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }

  // Get share statistics for user
  static async getShareStats(): Promise<{
    totalShares: number
    platformBreakdown: Record<string, number>
    recentShares: ShareAnalytics[]
  }> {
    try {
      const user = await blink.auth.me()
      if (!user) throw new Error('User not authenticated')

      const shares = await blink.db.share_analytics.list({
        where: { user_id: user.id },
        orderBy: { shared_at: 'desc' },
        limit: 100
      })

      const platformBreakdown: Record<string, number> = {}
      shares.forEach(share => {
        platformBreakdown[share.platform] = (platformBreakdown[share.platform] || 0) + 1
      })

      return {
        totalShares: shares.length,
        platformBreakdown,
        recentShares: shares.slice(0, 10)
      }
    } catch (error) {
      console.error('Error getting share stats:', error)
      return {
        totalShares: 0,
        platformBreakdown: {},
        recentShares: []
      }
    }
  }

  // Generate optimized share text for different platforms
  static generateShareText(article: Article, platform: string, customMessage?: string): string {
    const baseMessage = customMessage || article.title
    const url = article.url || ''

    switch (platform.toLowerCase()) {
      case 'twitter': {
        // Twitter has 280 character limit
        const maxLength = 280 - url.length - 3 // 3 for spaces and ellipsis
        const truncatedMessage = baseMessage.length > maxLength 
          ? baseMessage.substring(0, maxLength - 3) + '...'
          : baseMessage
        return `${truncatedMessage} ${url}`
      }

      case 'linkedin':
        // LinkedIn allows longer posts, include more context
        return customMessage 
          ? `${customMessage}\n\n${article.title}\n${url}`
          : `Interesting read: ${article.title}\n\n${article.description || ''}\n\n${url}`

      case 'facebook':
        // Facebook supports rich previews, keep it simple
        return customMessage 
          ? `${customMessage}\n\n${url}`
          : `${article.title}\n\n${url}`

      case 'whatsapp':
      case 'telegram':
        // Messaging apps - include context
        return customMessage
          ? `${customMessage}\n\n📰 ${article.title}\n\n${url}`
          : `📰 ${article.title}\n\n${article.description || ''}\n\n${url}`

      default:
        return `${baseMessage}\n\n${url}`
    }
  }

  // Get popular articles based on share count
  static async getPopularArticles(limit: number = 10): Promise<Article[]> {
    try {
      const user = await blink.auth.me()
      if (!user) return []

      // Get articles with share counts
      const query = `
        SELECT a.*, COUNT(sa.id) as share_count
        FROM articles a
        LEFT JOIN share_analytics sa ON a.id = sa.article_id
        WHERE a.user_id = ?
        GROUP BY a.id
        ORDER BY share_count DESC, a.created_at DESC
        LIMIT ?
      `

      const result = await blink.db.sql(query, [user.id, limit])
      return result || []
    } catch (error) {
      console.error('Error getting popular articles:', error)
      return []
    }
  }

  // Check if Web Share API is supported
  static isNativeShareSupported(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator
  }

  // Native share with fallback
  static async nativeShare(article: Article, customMessage?: string): Promise<boolean> {
    if (!this.isNativeShareSupported()) {
      return false
    }

    try {
      await navigator.share({
        title: article.title,
        text: customMessage || article.description || '',
        url: article.url || ''
      })

      // Track the share
      await this.trackShare(article.id, 'native', 'native', customMessage)
      return true
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Native share failed:', error)
      }
      return false
    }
  }

  // Copy to clipboard with tracking
  static async copyToClipboard(text: string, articleId: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      await this.trackShare(articleId, 'clipboard', 'copy')
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  // Generate share URLs for different platforms
  static getShareUrls(article: Article, customMessage?: string) {
    const encodedUrl = encodeURIComponent(article.url || '')
    const encodedTitle = encodeURIComponent(article.title)
    const encodedMessage = encodeURIComponent(customMessage || article.title)
    const encodedDescription = encodeURIComponent(article.description || '')

    return {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.generateShareText(article, 'twitter', customMessage))}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(this.generateShareText(article, 'whatsapp', customMessage))}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedMessage}%0A%0A${encodedUrl}`,
      sms: `sms:?body=${encodeURIComponent(this.generateShareText(article, 'sms', customMessage))}`
    }
  }

  // Open social share window
  static openShareWindow(url: string, platform: string, articleId: string, customMessage?: string): void {
    const width = 600
    const height = 400
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    const popup = window.open(
      url,
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    if (popup) {
      // Track the share attempt
      this.trackShare(articleId, platform, 'social', customMessage)
      
      // Focus the popup
      popup.focus()
    }
  }
}