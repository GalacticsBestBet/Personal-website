'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Tag {
    id: string
    name: string
    color: string
}

interface TagFilterProps {
    availableTags?: Tag[]
}

export function TagFilter({ availableTags }: TagFilterProps) {
    const [fetchedTags, setFetchedTags] = useState<Tag[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const currentTag = searchParams.get('tag')

    const tags = availableTags || fetchedTags

    useEffect(() => {
        if (availableTags) return

        const fetchTags = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('tags').select('*').order('name')
            if (data) setFetchedTags(data)
        }
        fetchTags()
    }, [availableTags])

    const handleTagSelect = (tagId: string) => {
        const params = new URLSearchParams(searchParams)
        if (currentTag === tagId) {
            params.delete('tag')
        } else {
            params.set('tag', tagId)
        }
        router.replace(`${pathname}?${params.toString()}`)
    }

    if (tags.length === 0) return null

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
            <Badge
                variant={!currentTag ? "default" : "outline"}
                className={cn(
                    "cursor-pointer whitespace-nowrap",
                    !currentTag ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
                onClick={() => handleTagSelect('')} // Clear filter
            >
                Alles
            </Badge>
            {tags.map((tag) => {
                const isActive = currentTag === tag.id
                return (
                    <Badge
                        key={tag.id}
                        variant={isActive ? "default" : "outline"}
                        className={cn(
                            "cursor-pointer whitespace-nowrap",
                            isActive ? "text-white" : "hover:bg-muted"
                        )}
                        style={isActive ? { backgroundColor: tag.color, borderColor: tag.color } : { color: tag.color, borderColor: tag.color }}
                        onClick={() => handleTagSelect(tag.id)}
                    >
                        {tag.name}
                    </Badge>
                )
            })}
        </div>
    )
}
