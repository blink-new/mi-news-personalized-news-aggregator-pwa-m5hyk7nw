import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { NewsService } from './services/newsService'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { CategoryTabs } from './components/news/CategoryTabs'
import { NewsCard } from './components/news/NewsCard'
import { AddSourceDialog } from './components/sources/AddSourceDialog'
import { ShareStats } from './components/analytics/ShareStats'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Skeleton } from './components/ui/skeleton'
import { useToast } from './hooks/use-toast'
import { Toaster } from './components/ui/toaster'
import type { Article, NewsSource } from './types/news'
import { Search, Plus, Settings, Bookmark, RefreshCw } from 'lucide-react'

// Categories for news organization
const categories = [
  { id: 'all', name: 'All', slug: 'all', color: '#6B7280', icon: '📰', isDefault: true },
  { id: 'technology', name: 'Technology', slug: 'technology', color: '#3B82F6', icon: '💻', isDefault: true },
  { id: 'business', name: 'Business', slug: 'business', color: '#10B981', icon: '💼', isDefault: true },
  { id: 'science', name: 'Science', slug: 'science', color: '#8B5CF6', icon: '🔬', isDefault: true },
  { id: 'sports', name: 'Sports', slug: 'sports', color: '#F59E0B', icon: '⚽', isDefault: true },
  { id: 'general', name: 'General', slug: 'general', color: '#6B7280', icon: '📄', isDefault: true },
]

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [activeCategory, setActiveCategory] = useState('all')
  const [articles, setArticles] = useState<Article[]>([])
  const [sources, setSources] = useState<NewsSource[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadUserData = useCallback(async () => {
    try {
      const [userArticles, userSources] = await Promise.all([
        NewsService.getUserArticles(),
        NewsService.getUserSources()
      ])
      
      setArticles(userArticles)
      setSources(userSources)
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Error",
        description: "Failed to load your news data",
        variant: "destructive"
      })
    }
  }, [toast])

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await NewsService.searchArticles(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching articles:', error)
      toast({
        title: "Search Error",
        description: "Failed to search articles",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, toast])

  // Load user data when authenticated
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user, loadUserData])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery, performSearch])

  const handleRefresh = async () => {
    if (!user) return
    
    setIsRefreshing(true)
    try {
      // Refresh articles from all sources
      for (const source of sources) {
        await NewsService.refreshSourceArticles(source.id)
      }
      
      // Reload articles
      const updatedArticles = await NewsService.getUserArticles()
      setArticles(updatedArticles)
      
      toast({
        title: "Refreshed",
        description: "Your news feed has been updated",
      })
    } catch (error) {
      console.error('Error refreshing:', error)
      toast({
        title: "Refresh Error",
        description: "Failed to refresh news feed",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleBookmark = async (articleId: string) => {
    try {
      await NewsService.toggleBookmark(articleId)
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, isBookmarked: !article.isBookmarked }
          : article
      ))
      
      // Update search results if needed
      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(article => 
          article.id === articleId 
            ? { ...article, isBookmarked: !article.isBookmarked }
            : article
        ))
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      })
    }
  }

  const handleShare = async (article: Article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(article.url)
        toast({
          title: "Copied",
          description: "Article link copied to clipboard",
        })
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const handleReadArticle = async (article: Article) => {
    // Mark as read
    try {
      await NewsService.markAsRead(article.id)
      
      // Update local state
      setArticles(prev => prev.map(a => 
        a.id === article.id ? { ...a, isRead: true } : a
      ))
    } catch (error) {
      console.error('Error marking article as read:', error)
    }
    
    // Open article in new tab
    window.open(article.url, '_blank')
  }

  const handleAddSource = async (sourceData: { name: string; url: string; category: string }) => {
    try {
      const newSource = await NewsService.addNewsSource(
        sourceData.name,
        sourceData.url,
        sourceData.category
      )
      
      if (newSource) {
        setSources(prev => [...prev, newSource])
        
        // Reload articles to include new source
        const updatedArticles = await NewsService.getUserArticles()
        setArticles(updatedArticles)
        
        toast({
          title: "Source Added",
          description: `${sourceData.name} has been added to your news sources`,
        })
      }
    } catch (error) {
      console.error('Error adding source:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add news source",
        variant: "destructive"
      })
    }
  }

  // Filter articles based on active category
  const filteredArticles = articles.filter(article => {
    return activeCategory === 'all' || article.category === activeCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">Mi</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Mi News</h1>
          <p className="text-gray-600 mb-6">Your personalized news aggregator</p>
          <Button onClick={() => blink.auth.login()}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="pb-20">
            <CategoryTabs 
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            
            <div className="px-4 py-4 space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📰</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600 mb-4">
                    {sources.length === 0 
                      ? "Add some news sources to get started" 
                      : "Try refreshing or check back later"
                    }
                  </p>
                  {sources.length === 0 && (
                    <AddSourceDialog 
                      categories={categories}
                      onAddSource={handleAddSource}
                      trigger={
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Source
                        </Button>
                      }
                    />
                  )}
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={{
                      id: article.id,
                      title: article.title,
                      description: article.description,
                      url: article.url,
                      imageUrl: article.imageUrl,
                      publishedAt: article.publishedAt,
                      sourceId: article.sourceId,
                      sourceName: sources.find(s => s.id === article.sourceId)?.name || 'Unknown',
                      category: article.category,
                      keywords: [],
                      isDuplicate: false,
                      isBookmarked: article.isBookmarked,
                      readProgress: article.isRead ? 100 : 0,
                      userId: article.userId,
                      createdAt: article.createdAt
                    }}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onRead={handleReadArticle}
                  />
                ))
              )}
            </div>
          </div>
        )

      case 'search':
        return (
          <div className="p-4 pb-20">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search news articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            )}
            
            {searchQuery && !isSearching && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Search results for "{searchQuery}" ({searchResults.length})
                </h3>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No articles found matching your search</p>
                  </div>
                ) : (
                  searchResults.map((article) => (
                    <NewsCard
                      key={article.id}
                      article={{
                        id: article.id,
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        imageUrl: article.imageUrl,
                        publishedAt: article.publishedAt,
                        sourceId: article.sourceId,
                        sourceName: sources.find(s => s.id === article.sourceId)?.name || 'Unknown',
                        category: article.category,
                        keywords: [],
                        isDuplicate: false,
                        isBookmarked: article.isBookmarked,
                        readProgress: article.isRead ? 100 : 0,
                        userId: article.userId,
                        createdAt: article.createdAt
                      }}
                      onBookmark={handleBookmark}
                      onShare={handleShare}
                      onRead={handleReadArticle}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )

      case 'add':
        return (
          <div className="p-4 pb-20">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add News Source</h2>
              <AddSourceDialog 
                categories={categories}
                onAddSource={handleAddSource}
                trigger={
                  <Button className="w-full h-12">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Source
                  </Button>
                }
              />
              
              <div className="mt-8">
                <h3 className="font-medium text-gray-900 mb-4">Your Sources ({sources.length})</h3>
                {sources.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No sources added yet</p>
                ) : (
                  <div className="space-y-3">
                    {sources.map((source) => (
                      <div key={source.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{source.name}</h4>
                            <p className="text-sm text-gray-600">{source.url}</p>
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                              {source.category}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full ${source.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                <h3 className="font-medium text-gray-900 mb-4">Popular Sources</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'TechCrunch', url: 'https://techcrunch.com', category: 'technology' },
                    { name: 'BBC News', url: 'https://www.bbc.com/news', category: 'general' },
                    { name: 'The Verge', url: 'https://www.theverge.com', category: 'technology' },
                    { name: 'Reuters', url: 'https://www.reuters.com', category: 'business' },
                  ].map((source) => (
                    <Button
                      key={source.name}
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center"
                      onClick={() => handleAddSource(source)}
                    >
                      <span className="font-medium text-sm">{source.name}</span>
                      <span className="text-xs text-gray-500">{source.url.replace('https://', '').replace('www.', '')}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'bookmarks': {
        const bookmarkedArticles = articles.filter(article => article.isBookmarked)
        return (
          <div className="p-4 pb-20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Articles</h2>
            {bookmarkedArticles.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved articles</h3>
                <p className="text-gray-600">Bookmark articles to read them later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={{
                      id: article.id,
                      title: article.title,
                      description: article.description,
                      url: article.url,
                      imageUrl: article.imageUrl,
                      publishedAt: article.publishedAt,
                      sourceId: article.sourceId,
                      sourceName: sources.find(s => s.id === article.sourceId)?.name || 'Unknown',
                      category: article.category,
                      keywords: [],
                      isDuplicate: false,
                      isBookmarked: article.isBookmarked,
                      readProgress: article.isRead ? 100 : 0,
                      userId: article.userId,
                      createdAt: article.createdAt
                    }}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onRead={handleReadArticle}
                  />
                ))}
              </div>
            )}
          </div>
        )
      }

      case 'settings':
        return (
          <div className="p-4 pb-20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-2">Account</h3>
                <p className="text-sm text-gray-600 mb-4">{user.email}</p>
                <Button variant="outline" onClick={() => blink.auth.logout()}>
                  Sign Out
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Sources:</span>
                    <span className="ml-2 font-medium">{sources.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Articles:</span>
                    <span className="ml-2 font-medium">{articles.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bookmarked:</span>
                    <span className="ml-2 font-medium">{articles.filter(a => a.isBookmarked).length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Read:</span>
                    <span className="ml-2 font-medium">{articles.filter(a => a.isRead).length}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-2">About Mi News</h3>
                <p className="text-sm text-gray-600">Version 1.0.0 - Personalized News Aggregator</p>
              </div>
              
              <ShareStats />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        unreadCount={articles.filter(a => !a.isRead).length}
      />
      
      {renderContent()}
      
      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <Toaster />
    </div>
  )
}

export default App