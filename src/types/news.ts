export interface NewsSource {
  id: string
  name: string
  url: string
  rssUrl?: string
  category: string
  isActive: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  content?: string
  url: string
  imageUrl?: string
  publishedAt: string
  sourceId: string
  sourceName: string
  category: string
  keywords: string[]
  isDuplicate: boolean
  isBookmarked: boolean
  readProgress: number
  userId: string
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  keywords: string[]
  categories: string[]
  isActive: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface NewsCategory {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  isDefault: boolean
}