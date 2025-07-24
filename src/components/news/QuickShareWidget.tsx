import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { SocialShareService } from '@/services/socialShareService'
import { 
  Share2, 
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
  Send,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import type { Article } from '@/types/news'

interface QuickShareWidgetProps {
  article: Article
  className?: string
}

const quickSharePlatforms = [
  {
    name: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    key: 'linkedin' as const,
    color: 'text-blue-600'
  },
  {
    name: 'Twitter',
    icon: <Twitter className="w-4 h-4" />,
    key: 'twitter' as const,
    color: 'text-sky-500'
  },
  {
    name: 'Facebook',
    icon: <Facebook className="w-4 h-4" />,
    key: 'facebook' as const,
    color: 'text-blue-700'
  },
  {
    name: 'WhatsApp',
    icon: <MessageCircle className="w-4 h-4" />,
    key: 'whatsapp' as const,
    color: 'text-green-600'
  },
  {
    name: 'Telegram',
    icon: <Send className="w-4 h-4" />,
    key: 'telegram' as const,
    color: 'text-blue-500'
  }
]

export function QuickShareWidget({ article, className }: QuickShareWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePlatformShare = (platformKey: string, platformName: string) => {
    const shareUrls = SocialShareService.getShareUrls(article)
    const shareUrl = shareUrls[platformKey as keyof typeof shareUrls]
    
    SocialShareService.openShareWindow(shareUrl, platformName.toLowerCase(), article.id)
    toast.success(`Opening ${platformName}...`)
    setIsOpen(false)
  }

  const handleCopyLink = async () => {
    const success = await SocialShareService.copyToClipboard(article.url || '', article.id)
    if (success) {
      toast.success('Link copied to clipboard!')
    } else {
      toast.error('Failed to copy link')
    }
    setIsOpen(false)
  }

  const handleNativeShare = async () => {
    const success = await SocialShareService.nativeShare(article)
    if (success) {
      toast.success('Shared successfully!')
      setIsOpen(false)
    } else {
      toast.error('Native sharing not supported')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-2 ${className}`}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Share Article</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Native Share (if supported) */}
        {SocialShareService.isNativeShareSupported() && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share via Device
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Social Platforms */}
        {quickSharePlatforms.map((platform) => (
          <DropdownMenuItem
            key={platform.key}
            onClick={() => handlePlatformShare(platform.key, platform.name)}
          >
            <span className={platform.color}>
              {platform.icon}
            </span>
            <span className="ml-2">{platform.name}</span>
            <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}