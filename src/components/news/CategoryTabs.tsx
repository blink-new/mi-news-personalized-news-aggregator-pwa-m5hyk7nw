import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewsCategory } from '@/types/news'

interface CategoryTabsProps {
  categories: NewsCategory[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="sticky top-0 bg-white z-40 border-b border-gray-200 px-4 py-2">
      <Tabs value={activeCategory} onValueChange={onCategoryChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="whitespace-nowrap">
            All News
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.slug}
              className="whitespace-nowrap"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}