'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Hash, X, MapPin, Target } from 'lucide-react'
import { createItem } from '@/app/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuickInputProps {
    defaultType?: 'INBOX' | 'TASK' | 'MEMORY'
}

interface Tag {
    id: string
    name: string
    color: string
}

export function QuickInput({ defaultType = 'INBOX' }: QuickInputProps) {
    const [content, setContent] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [isTagViewOpen, setIsTagViewOpen] = useState(false)
    const [isLocationMode, setIsLocationMode] = useState(false)
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [isLocating, setIsLocating] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchTags = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('tags').select('*').order('name')
            if (data) setAvailableTags(data)
        }
        fetchTags()
    }, [])

    const handleGetLocation = () => {
        setIsLocating(true)
        if (!navigator.geolocation) {
            alert('Geolocatie wordt niet ondersteund door je browser.')
            setIsLocating(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setIsLocating(false)
                if (!content || content === 'Huidige Locatie') {
                    setContent('Huidige Locatie')
                }
            },
            (error) => {
                console.error('Error getting location:', error)
                alert('Kon locatie niet ophalen. Controleer je instellingen.')
                setIsLocating(false)
            }
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsPending(true)
        try {
            const formData = new FormData()
            formData.append('content', content)
            formData.append('type', isLocationMode ? 'LOCATION' : defaultType)
            formData.append('tags', JSON.stringify(selectedTags))

            if (isLocationMode) {
                // If in location mode, use the content as the location name unless specific coords logic needed
                // For now, we mainly use the content as the 'name' or description
                // The actual 'location_name' field can be the content
                formData.append('location_name', content)
                if (locationCoords) {
                    formData.append('location_lat', locationCoords.lat.toString())
                    formData.append('location_lng', locationCoords.lng.toString())
                }
            }

            await createItem(formData)

            setContent('')
            setSelectedTags([])
            setIsTagViewOpen(false)
            setIsLocationMode(false)
            setLocationCoords(null)
            // Keep focus for rapid entry
            inputRef.current?.focus()
        } catch (error) {
            console.error(error)
        } finally {
            setIsPending(false)
        }
    }

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
    }

    return (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-50">
            <div className="max-w-md mx-auto relative flex flex-col gap-2">
                <AnimatePresence>
                    {isTagViewOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right"
                        >
                            {availableTags.map(tag => {
                                const isSelected = selectedTags.includes(tag.id)
                                return (
                                    <Badge
                                        key={tag.id}
                                        variant={isSelected ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer whitespace-nowrap transition-all",
                                            isSelected ? "text-white" : "hover:bg-muted"
                                        )}
                                        style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : { color: tag.color, borderColor: tag.color }}
                                        onClick={() => toggleTag(tag.id)}
                                    >
                                        {tag.name}
                                    </Badge>
                                )
                            })}
                            {availableTags.length === 0 && (
                                <span className="text-xs text-muted-foreground p-1">Geen tags beschikbaar</span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                    <div className="absolute left-1 z-10 flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "rounded-full h-10 w-10 hover:bg-transparent",
                                (isTagViewOpen || selectedTags.length > 0) && "text-primary"
                            )}
                            onClick={() => setIsTagViewOpen(!isTagViewOpen)}
                        >
                            <Hash className="h-5 w-5" />
                            {selectedTags.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {selectedTags.length}
                                </span>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "rounded-full h-10 w-10 hover:bg-transparent",
                                isLocationMode && "text-blue-500"
                            )}
                            onClick={() => {
                                setIsLocationMode(!isLocationMode)
                                if (!isLocationMode) setLocationCoords(null)
                            }}
                        >
                            <MapPin className="h-5 w-5" />
                        </Button>
                    </div>

                    <Input
                        ref={inputRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isLocationMode ? "Locatie naam of adres..." : "Leeg je hoofd..."}
                        className={cn(
                            "pr-12 h-14 text-lg shadow-lg border-primary/20 focus-visible:ring-primary/30 rounded-full pl-24 transition-all", // Increased pl for 2 icons
                            isLocationMode && "border-blue-500/50 focus-visible:ring-blue-500/30"
                        )}
                        disabled={isPending}
                        autoFocus
                    />

                    <AnimatePresence>
                        {isLocationMode && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-12 top-2 bottom-2"
                            >
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                        "rounded-full h-10 w-10 shrink-0",
                                        locationCoords && "text-green-500",
                                        isLocating && "animate-pulse"
                                    )}
                                    onClick={handleGetLocation}
                                    disabled={isPending || isLocating}
                                    title="Huidige locatie gebruiken"
                                >
                                    {isLocating ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Target className="h-5 w-5" />
                                    )}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {content.trim() && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-2 top-2 bottom-2"
                            >
                                <Button
                                    type="submit"
                                    size="icon"
                                    className={cn(
                                        "rounded-full h-10 w-10 shrink-0",
                                        isLocationMode && "bg-blue-600 hover:bg-blue-700"
                                    )}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                    <span className="sr-only">Opslaan</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </div>
    )
}
