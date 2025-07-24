import React, { useState } from 'react'
import { Clock, ExternalLink, Bookmark, Share2, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShareDialog } from './ShareDialog'
import { QuickShareWidget } from './QuickShareWidget'
import { NewsArticle, Article } from '@/types/news'
import { cn } from '@/lib/utils'

interface NewsCardProps {
  article: NewsArticle
  onBookmark: (articleId: string) => void
  onRead: (article: NewsArticle) => void
}

export function NewsCard({ article, onBookmark, onRead }: NewsCardProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  // Convert NewsArticle to Article format for ShareDialog
  const articleForShare: Article = {
    id: article.id,
    title: article.title,
    description: article.description,
    url: article.url,
    image_url: article.imageUrl,
    published_at: article.publishedAt,
    source_name: article.sourceName,
    category: article.category,
    content_hash: '',
    is_bookmarked: article.isBookmarked ? 1 : 0,
    is_read: article.readProgress > 0 ? 1 : 0,
    user_id: '',
    created_at: article.publishedAt
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  return (
    <>
      <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          {article.imageUrl && (
            <div className="relative h-48 overflow-hidden">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
              {article.isDuplicate && (
                <Badge className="absolute top-2 right-2 bg-amber-500">
                  Duplicate
                </Badge>
              )}
              {/* Quick Share Widget on Image */}
              <div className="absolute top-2 left-2">
                <QuickShareWidget 
                  article={articleForShare}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white"
                />
              </div>
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                {article.category}
              </Badge>
              <div className="flex items-center text-gray-500 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeAgo(article.publishedAt)}
              </div>
            </div>
            
            <h3 
              className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onRead(article)}
            >
              {article.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {article.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <span className="font-medium">{article.sourceName}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBookmark(article.id)}
                  className={cn(
                    "p-2",
                    article.isBookmarked && "text-amber-600"
                  )}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="p-2"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(article.url, '_blank')}
                  className="p-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {article.readProgress > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all"
                    style={{ width: `${article.readProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ShareDialog
        article={articleForShare}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  )
}