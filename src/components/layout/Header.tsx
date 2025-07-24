import { Bell, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  user: any
  onRefresh: () => void
  isRefreshing: boolean
  unreadCount: number
}

export function Header({ user, onRefresh, isRefreshing, unreadCount }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-50">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Mi</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Mi News</h1>
            <p className="text-xs text-gray-500">Personalized for you</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="sm" className="p-2 relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center bg-red-500">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}