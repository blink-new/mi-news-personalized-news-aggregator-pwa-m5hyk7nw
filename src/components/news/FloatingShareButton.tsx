import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShareDialog } from './ShareDialog'
import { SocialShareService } from '@/services/socialShareService'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Article } from '@/types/news'

interface FloatingShareButtonProps {
  article: Article
  className?: string
}

export function FloatingShareButton({ article, className }: FloatingShareButtonProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const handleQuickShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Try native share first on mobile
    if (SocialShareService.isNativeShareSupported()) {
      const success = await SocialShareService.nativeShare(article)
      if (success) {
        toast.success('Shared successfully!')
        return
      }
    }
    
    // Fallback to share dialog
    setShareDialogOpen(true)
  }

  return (
    <>
      <Button
        onClick={handleQuickShare}
        size="sm"
        variant="outline"
        className={`fixed bottom-24 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white border-2 border-blue-200 hover:border-blue-300 ${className}`}
      >
        <Share2 className="w-5 h-5 text-blue-600" />
      </Button>

      <ShareDialog
        article={article}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  )
}