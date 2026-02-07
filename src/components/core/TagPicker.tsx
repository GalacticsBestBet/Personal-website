'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Tag as TagIcon, X, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { createTag, toggleItemTag, deleteTag } from '@/app/tags/actions'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Tag {
    id: string
    name: string
    color: string
}

interface TagPickerProps {
    itemId: string
    assignedTags: Tag[]
}

export function TagPicker({ itemId, assignedTags }: TagPickerProps) {
    const [open, setOpen] = useState(false)
    const [activeTags, setActiveTags] = useState<Tag[]>(assignedTags)
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [newTagName, setNewTagName] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Fetch all tags when popover opens
    useEffect(() => {
        if (open) {
            const fetchTags = async () => {
                const supabase = createClient()
                const { data } = await supabase.from('tags').select('*').order('name')
                if (data) setAllTags(data)
            }
            fetchTags()
        } else {
            setIsEditing(false) // Reset edit mode when closing
        }
    }, [open])

    // Update local state when props change
    useEffect(() => {
        setActiveTags(assignedTags)
    }, [assignedTags])

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return
        setIsPending(true)
        try {
            const newTag = await createTag(newTagName)
            setNewTagName('')

            // Optimistically add to active tags and assign
            if (newTag) {
                await handleToggleTag(newTag)

                // Refresh list to include new tag
                const supabase = createClient()
                const { data } = await supabase.from('tags').select('*').order('name')
                if (data) setAllTags(data)
            }
        } finally {
            setIsPending(false)
        }
    }

    const handleToggleTag = async (tag: Tag) => {
        if (isEditing) {
            if (window.confirm(`Tag "${tag.name}" verwijderen? Dit verwijdert de tag overal.`)) {
                await deleteTag(tag.id)
                setAllTags(allTags.filter(t => t.id !== tag.id))
                setActiveTags(activeTags.filter(t => t.id !== tag.id))
            }
            return
        }

        // Optimistic update
        const isAssigned = activeTags.some(t => t.id === tag.id)
        if (isAssigned) {
            setActiveTags(activeTags.filter(t => t.id !== tag.id))
        } else {
            setActiveTags([...activeTags, tag])
        }

        try {
            await toggleItemTag(itemId, tag.id)
        } catch (error) {
            // Revert on error
            setActiveTags(assignedTags)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <TagIcon className="h-4 w-4" />
                    <span className="sr-only">Tags</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium leading-none text-sm">Tags beheren</h4>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsEditing(!isEditing)}
                            title={isEditing ? "Klaar" : "Tags beheren"}
                        >
                            {isEditing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                        {allTags.map((tag) => {
                            const isActive = activeTags.some(t => t.id === tag.id)
                            return (
                                <Badge
                                    key={tag.id}
                                    variant={isEditing ? "destructive" : (isActive ? "default" : "outline")}
                                    className={cn(
                                        "cursor-pointer select-none",
                                        !isEditing && isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                                        isEditing && "hover:bg-destructive hover:text-destructive-foreground"
                                    )}
                                    onClick={() => handleToggleTag(tag)}
                                    style={isEditing ? {} : (isActive ? { backgroundColor: tag.color } : { borderColor: tag.color, color: tag.color })}
                                >
                                    {tag.name}
                                    {!isEditing && isActive && <Check className="ml-1 h-3 w-3" />}
                                    {isEditing && <X className="ml-1 h-3 w-3" />}
                                </Badge>
                            )
                        })}
                        {allTags.length === 0 && (
                            <p className="text-xs text-muted-foreground">Geen tags gevonden.</p>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                        <Input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="Nieuwe tag..."
                            className="h-8 text-xs"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateTag()
                            }}
                        />
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={handleCreateTag}
                            disabled={isPending || !newTagName.trim()}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
