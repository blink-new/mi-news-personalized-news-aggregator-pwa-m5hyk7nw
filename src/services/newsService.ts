import { blink } from '../blink/client'
import type { Article, NewsSource, UserPreferences } from '../types/news'

export class NewsService {
  // Fetch RSS feed and parse articles
  static async fetchRSSFeed(url: string): Promise<Article[]> {
    try {
      // Use Blink's data extraction to get RSS content
      const rssContent = await blink.data.extractFromUrl(url)
      
      // Parse RSS content (simplified - in production you'd use a proper RSS parser)
      const articles = this.parseRSSContent(rssContent, url)
      return articles
    } catch (error) {
      console.error('Error fetching RSS feed:', error)
      return []
    }
  }

  // Discover RSS feed URL from website
  static async discoverRSSFeed(websiteUrl: string): Promise<string | null> {
    try {
      const { links } = await blink.data.scrape(websiteUrl)
      
      // Look for RSS/Atom feed links
      const rssLink = links.find(link => 
        link.href?.includes('rss') || 
        link.href?.includes('feed') || 
        link.href?.includes('atom') ||
        link.text?.toLowerCase().includes('rss') ||
        link.text?.toLowerCase().includes('feed')
      )
      
      if (rssLink?.href) {
        // Convert relative URLs to absolute
        const url = new URL(rssLink.href, websiteUrl)
        return url.toString()
      }
      
      // Try common RSS feed paths
      const commonPaths = ['/rss', '/feed', '/rss.xml', '/feed.xml', '/atom.xml']
      for (const path of commonPaths) {
        try {
          const testUrl = new URL(path, websiteUrl).toString()
          await blink.data.extractFromUrl(testUrl)
          return testUrl
        } catch {
          continue
        }
      }
      
      return null
    } catch (error) {
      console.error('Error discovering RSS feed:', error)
      return null
    }
  }

  // Add a new news source
  static async addNewsSource(name: string, url: string, category: string = 'general'): Promise<NewsSource | null> {
    try {
      const user = await blink.auth.me()
      if (!user) throw new Error('User not authenticated')

      // Discover RSS feed
      const rssUrl = await this.discoverRSSFeed(url)
      if (!rssUrl) {
        throw new Error('Could not find RSS feed for this website')
      }

      const sourceId = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const source: NewsSource = {
        id: sourceId,
        userId: user.id,
        name,
        url,
        rssUrl,
        category,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.newsSources.create({
        id: sourceId,
        userId: user.id,
        name,
        url,
        rssUrl,
        category,
        isActive: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Fetch initial articles
      await this.refreshSourceArticles(sourceId)

      return source
    } catch (error) {
      console.error('Error adding news source:', error)
      throw error
    }
  }

  // Get user's news sources
  static async getUserSources(): Promise<NewsSource[]> {
    try {
      const user = await blink.auth.me()
      if (!user) return []

      const sources = await blink.db.newsSources.list({
        where: { userId: user.id, isActive: "1" },
        orderBy: { createdAt: 'desc' }
      })

      return sources.map(source => ({
        id: source.id,
        userId: source.userId,
        name: source.name,
        url: source.url,
        rssUrl: source.rssUrl,
        category: source.category,
        isActive: Number(source.isActive) > 0,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt
      }))
    } catch (error) {
      console.error('Error getting user sources:', error)
      return []
    }
  }

  // Get articles for user
  static async getUserArticles(category?: string, limit: number = 50): Promise<Article[]> {
    try {
      const user = await blink.auth.me()
      if (!user) return []

      const whereClause: any = { userId: user.id }
      if (category && category !== 'all') {
        whereClause.category = category
      }

      const articles = await blink.db.articles.list({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        limit
      })

      return articles.map(article => ({
        id: article.id,
        userId: article.userId,
        sourceId: article.sourceId,
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        imageUrl: article.imageUrl,
        publishedAt: article.publishedAt,
        category: article.category,
        isBookmarked: Number(article.isBookmarked) > 0,
        isRead: Number(article.isRead) > 0,
        contentHash: article.contentHash,
        createdAt: article.createdAt
      }))
    } catch (error) {
      console.error('Error getting user articles:', error)
      return []
    }
  }

  // Refresh articles from a source
  static async refreshSourceArticles(sourceId: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const sources = await blink.db.newsSources.list({
        where: { id: sourceId, userId: user.id }
      })

      if (sources.length === 0) return

      const source = sources[0]
      if (!source.rssUrl) return

      const newArticles = await this.fetchRSSFeed(source.rssUrl)
      
      // Remove duplicates and save new articles
      for (const article of newArticles) {
        const contentHash = this.generateContentHash(article.title + article.description)
        
        // Check if article already exists
        const existing = await blink.db.articles.list({
          where: { userId: user.id, contentHash }
        })

        if (existing.length === 0) {
          const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          await blink.db.articles.create({
            id: articleId,
            userId: user.id,
            sourceId: source.id,
            title: article.title,
            description: article.description || '',
            content: article.content || '',
            url: article.url,
            imageUrl: article.imageUrl || '',
            publishedAt: article.publishedAt || new Date().toISOString(),
            category: source.category,
            isBookmarked: "0",
            isRead: "0",
            contentHash,
            createdAt: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Error refreshing source articles:', error)
    }
  }

  // Toggle bookmark status
  static async toggleBookmark(articleId: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const articles = await blink.db.articles.list({
        where: { id: articleId, userId: user.id }
      })

      if (articles.length > 0) {
        const article = articles[0]
        const newBookmarkStatus = Number(article.isBookmarked) > 0 ? "0" : "1"
        
        await blink.db.articles.update(articleId, {
          isBookmarked: newBookmarkStatus
        })
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  // Mark article as read
  static async markAsRead(articleId: string): Promise<void> {
    try {
      const user = await blink.auth.me()
      if (!user) return

      await blink.db.articles.update(articleId, {
        isRead: "1"
      })
    } catch (error) {
      console.error('Error marking article as read:', error)
    }
  }

  // Search articles
  static async searchArticles(query: string): Promise<Article[]> {
    try {
      const user = await blink.auth.me()
      if (!user) return []

      // Simple search implementation - in production you'd use full-text search
      const articles = await blink.db.articles.list({
        where: { userId: user.id },
        orderBy: { publishedAt: 'desc' },
        limit: 100
      })

      const searchTerm = query.toLowerCase()
      return articles
        .filter(article => 
          article.title.toLowerCase().includes(searchTerm) ||
          article.description?.toLowerCase().includes(searchTerm)
        )
        .map(article => ({
          id: article.id,
          userId: article.userId,
          sourceId: article.sourceId,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          category: article.category,
          isBookmarked: Number(article.isBookmarked) > 0,
          isRead: Number(article.isRead) > 0,
          contentHash: article.contentHash,
          createdAt: article.createdAt
        }))
    } catch (error) {
      console.error('Error searching articles:', error)
      return []
    }
  }

  // Helper methods
  private static parseRSSContent(content: string, sourceUrl: string): Article[] {
    // Simplified RSS parsing - in production use a proper RSS parser library
    const articles: Article[] = []
    
    try {
      // Extract basic article information from RSS content
      // This is a simplified implementation
      const lines = content.split('\n')
      let currentArticle: Partial<Article> = {}
      
      for (const line of lines) {
        if (line.includes('<title>') && !line.includes('<![CDATA[')) {
          const title = line.replace(/<[^>]*>/g, '').trim()
          if (title && title !== 'RSS' && title.length > 10) {
            currentArticle.title = title
          }
        }
        
        if (line.includes('<description>') || line.includes('<summary>')) {
          const description = line.replace(/<[^>]*>/g, '').trim()
          if (description && description.length > 20) {
            currentArticle.description = description.substring(0, 300)
          }
        }
        
        if (line.includes('<link>') && !line.includes('</link>')) {
          const url = line.replace(/<[^>]*>/g, '').trim()
          if (url.startsWith('http')) {
            currentArticle.url = url
          }
        }
        
        if (line.includes('<pubDate>') || line.includes('<published>')) {
          const dateStr = line.replace(/<[^>]*>/g, '').trim()
          try {
            currentArticle.publishedAt = new Date(dateStr).toISOString()
          } catch {
            currentArticle.publishedAt = new Date().toISOString()
          }
        }
        
        // If we have enough info for an article, add it
        if (currentArticle.title && currentArticle.url && articles.length < 20) {
          articles.push({
            id: `temp_${Date.now()}_${Math.random()}`,
            userId: '',
            sourceId: '',
            title: currentArticle.title,
            description: currentArticle.description || '',
            content: '',
            url: currentArticle.url,
            imageUrl: '',
            publishedAt: currentArticle.publishedAt || new Date().toISOString(),
            category: 'general',
            isBookmarked: false,
            isRead: false,
            contentHash: '',
            createdAt: new Date().toISOString()
          })
          currentArticle = {}
        }
      }
    } catch (error) {
      console.error('Error parsing RSS content:', error)
    }
    
    return articles
  }

  private static generateContentHash(content: string): string {
    // Simple hash function for duplicate detection
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }
}