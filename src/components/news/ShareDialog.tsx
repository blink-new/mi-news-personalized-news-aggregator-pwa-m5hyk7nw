import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { SocialShareService } from '@/services/socialShareService'
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Send, 
  Facebook, 
  Twitter, 
  Linkedin,
  ExternalLink,
  Check,
  Mail,
  MessageSquare
} from 'lucide-react'
import type { Article } from '@/types/news'

interface ShareDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SocialPlatform {
  name: string
  icon: React.ReactNode
  color: string
  description: string
  key: keyof ReturnType<typeof SocialShareService.getShareUrls>
}

const socialPlatforms: SocialPlatform[] = [
  {
    name: 'LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Share with professional network',
    key: 'linkedin'
  },
  {
    name: 'Twitter',
    icon: <Twitter className="w-5 h-5" />,
    color: 'bg-sky-500 hover:bg-sky-600',
    description: 'Tweet to followers',
    key: 'twitter'
  },
  {
    name: 'Facebook',
    icon: <Facebook className="w-5 h-5" />,
    color: 'bg-blue-700 hover:bg-blue-800',
    description: 'Share on timeline',
    key: 'facebook'
  },
  {
    name: 'WhatsApp',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-green-600 hover:bg-green-700',
    description: 'Send to contacts',
    key: 'whatsapp'
  },
  {
    name: 'Telegram',
    icon: <Send className="w-5 h-5" />,
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'Share in chats',
    key: 'telegram'
  },
  {
    name: 'Email',
    icon: <Mail className="w-5 h-5" />,
    color: 'bg-gray-600 hover:bg-gray-700',
    description: 'Send via email',
    key: 'email'
  },
  {
    name: 'SMS',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-purple-600 hover:bg-purple-700',
    description: 'Send text message',
    key: 'sms'
  }
]

export function ShareDialog({ article, open, onOpenChange }: ShareDialogProps) {
  const [customMessage, setCustomMessage] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

  if (!article) return null

  const handleNativeShare = async () => {
    const success = await SocialShareService.nativeShare(article, customMessage)
    if (success) {
      toast.success('Shared successfully!')
      onOpenChange(false)
    } else {
      toast.error('Native sharing not supported on this device')
    }
  }

  const handleSocialShare = (platform: SocialPlatform) => {
    const shareUrls = SocialShareService.getShareUrls(article, customMessage)
    const shareUrl = shareUrls[platform.key]
    
    if (platform.key === 'email' || platform.key === 'sms') {
      // Direct links for email and SMS
      window.location.href = shareUrl
    } else {
      // Open in popup for social platforms
      SocialShareService.openShareWindow(shareUrl, platform.name.toLowerCase(), article.id, customMessage)
    }
    
    toast.success(`Opening ${platform.name}...`)
  }

  const copyToClipboard = async (text: string, type: 'url' | 'text') => {
    const success = await SocialShareService.copyToClipboard(text, article.id)
    if (success) {
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedText(true)
        setTimeout(() => setCopiedText(false), 2000)
      }
      toast.success('Copied to clipboard!')
    } else {
      toast.error('Failed to copy to clipboard')
    }
  }

  const shareText = SocialShareService.generateShareText(article, 'general', customMessage)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Article
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex gap-3">
              {article.image_url && (
                <img 
                  src={article.image_url} 
                  alt={article.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {article.description}
                </p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {article.source_name}
                </Badge>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Message (Optional)</label>
            <Textarea
              placeholder="Add your thoughts about this article..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={280}
            />
            <div className="text-xs text-gray-500 text-right">
              {customMessage.length}/280
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {SocialShareService.isNativeShareSupported() && (
            <>
              <Button 
                onClick={handleNativeShare}
                className="w-full"
                variant="default"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share via Device
              </Button>
              <Separator />
            </>
          )}

          {/* Social Platforms */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Share on Social Media</h4>
            <div className="grid grid-cols-1 gap-2">
              {socialPlatforms.map((platform) => (
                <Button
                  key={platform.name}
                  onClick={() => handleSocialShare(platform)}
                  variant="outline"
                  className="justify-start h-auto p-3"
                >
                  <div className={`p-2 rounded-lg text-white mr-3 ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-xs text-gray-500">{platform.description}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Copy Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Copy & Share</h4>
            
            {/* Copy URL */}
            <div className="flex gap-2">
              <Input
                value={article.url || ''}
                readOnly
                className="flex-1 text-sm"
                placeholder="Article URL"
              />
              <Button
                onClick={() => copyToClipboard(article.url || '', 'url')}
                variant="outline"
                size="sm"
                className="px-3"
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Copy Full Text */}
            <div className="flex gap-2">
              <Textarea
                value={shareText}
                readOnly
                className="flex-1 text-sm min-h-[60px] resize-none"
                placeholder="Share text"
              />
              <Button
                onClick={() => copyToClipboard(shareText, 'text')}
                variant="outline"
                size="sm"
                className="px-3 self-start"
              >
                {copiedText ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNativeShare}
              className="flex-1"
              disabled={!SocialShareService.isNativeShareSupported()}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}