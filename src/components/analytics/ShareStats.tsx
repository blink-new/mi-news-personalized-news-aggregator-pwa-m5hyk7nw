import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SocialShareService, ShareAnalytics } from '@/services/socialShareService'
import { 
  Share2, 
  TrendingUp, 
  Users, 
  Calendar,
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
  Send,
  Mail,
  MessageSquare,
  Copy
} from 'lucide-react'

interface ShareStatsProps {
  className?: string
}

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  telegram: <Send className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
  clipboard: <Copy className="w-4 h-4" />,
  native: <Share2 className="w-4 h-4" />
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-800',
  twitter: 'bg-sky-100 text-sky-800',
  facebook: 'bg-blue-100 text-blue-800',
  whatsapp: 'bg-green-100 text-green-800',
  telegram: 'bg-blue-100 text-blue-800',
  email: 'bg-gray-100 text-gray-800',
  sms: 'bg-purple-100 text-purple-800',
  clipboard: 'bg-orange-100 text-orange-800',
  native: 'bg-indigo-100 text-indigo-800'
}

export function ShareStats({ className }: ShareStatsProps) {
  const [stats, setStats] = useState<{
    totalShares: number
    platformBreakdown: Record<string, number>
    recentShares: ShareAnalytics[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const shareStats = await SocialShareService.getShareStats()
        setStats(shareStats)
      } catch (error) {
        console.error('Error loading share stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-4">
              Unable to load share statistics
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const topPlatforms = Object.entries(stats.platformBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Shares</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.totalShares}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Platforms Used</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {Object.keys(stats.platformBreakdown).length}
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          {topPlatforms.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Platforms</h4>
              <div className="space-y-2">
                {topPlatforms.map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${platformColors[platform] || 'bg-gray-100 text-gray-800'}`}>
                        {platformIcons[platform] || <Share2 className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {platform === 'clipboard' ? 'Copy Link' : platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(count / stats.totalShares) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Shares */}
          {stats.recentShares.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
              <div className="space-y-3">
                {stats.recentShares.slice(0, 5).map((share) => (
                  <div key={share.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${platformColors[share.platform] || 'bg-gray-100 text-gray-800'}`}>
                        {platformIcons[share.platform] || <Share2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {share.platform === 'clipboard' ? 'Copied Link' : `Shared on ${share.platform}`}
                        </div>
                        {share.custom_message && (
                          <div className="text-xs text-gray-600 line-clamp-1">
                            "{share.custom_message}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {share.share_method}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(share.shared_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalShares === 0 && (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shares yet</h3>
              <p className="text-gray-600">
                Start sharing articles to see your analytics here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}