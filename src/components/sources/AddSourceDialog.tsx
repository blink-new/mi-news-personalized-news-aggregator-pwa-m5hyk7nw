import { useState } from 'react'
import { Plus, Globe, Rss } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NewsCategory } from '@/types/news'

interface AddSourceDialogProps {
  categories: NewsCategory[]
  onAddSource: (sourceData: {
    name: string
    url: string
    category: string
  }) => Promise<void>
  trigger?: React.ReactNode
}

export function AddSourceDialog({ categories, onAddSource, trigger }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.url || !formData.category) return

    setLoading(true)
    try {
      await onAddSource(formData)
      setFormData({ name: '', url: '', category: '' })
      setOpen(false)
    } catch (error) {
      console.error('Failed to add source:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectFeedFromUrl = async (url: string) => {
    // Simple heuristic to suggest a name from URL
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      const name = domain.split('.')[0]
      setFormData(prev => ({ 
        ...prev, 
        name: name.charAt(0).toUpperCase() + name.slice(1)
      }))
    } catch (error) {
      // Invalid URL, ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add News Source
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Rss className="w-5 h-5 mr-2 text-blue-600" />
            Add News Source
          </DialogTitle>
          <DialogDescription>
            Add a website URL and we'll automatically detect its RSS feed or news content.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, url: e.target.value }))
                  if (e.target.value) {
                    detectFeedFromUrl(e.target.value)
                  }
                }}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Source Name</Label>
            <Input
              id="name"
              placeholder="e.g., TechCrunch"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Source'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}