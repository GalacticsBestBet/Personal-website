'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react'
import { updateSkillLog, deleteSkillLog } from '../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface LogItemProps {
    log: any
    skillId: string
    color: string
}

export function LogItem({ log, skillId, color }: LogItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [rating, setRating] = useState(log.rating)
    const [content, setContent] = useState(log.content)
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

    // Format date for display
    const dateObj = new Date(log.date)
    const dateStr = dateObj.toLocaleDateString('nl-NL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    })
    const timeStr = dateObj.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsConfirmingDelete(true)
    }

    const confirmDelete = () => {
        startTransition(async () => {
            await deleteSkillLog(log.id, skillId)
        })
        setIsPopoverOpen(false)
    }

    const handleUpdate = async (formData: FormData) => {
        startTransition(async () => {
            await updateSkillLog(formData)
            setIsEditing(false)
        })
    }

    // Reset confirmation state when popover closes
    const onPopoverOpenChange = (open: boolean) => {
        setIsPopoverOpen(open)
        if (!open) setIsConfirmingDelete(false)
    }

    if (isEditing) {
        return (
            <div className="p-4 border rounded-xl bg-card transition-all ring-2 ring-primary">
                <form action={handleUpdate} className="space-y-4">
                    <input type="hidden" name="log_id" value={log.id} />
                    <input type="hidden" name="skill_id" value={skillId} />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bewerken</label>
                        <Textarea
                            name="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Score</label>
                            <span className="text-sm font-bold text-primary">{rating}/100</span>
                        </div>
                        <input
                            type="range"
                            name="rating"
                            min="0"
                            max="100"
                            value={rating}
                            onChange={(e) => setRating(parseInt(e.target.value))}
                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                            disabled={isPending}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Annuleren
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isPending}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Opslaan
                        </Button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="group flex gap-4 p-4 border rounded-xl bg-card hover:bg-accent/5 transition-colors relative">
            <div className="flex flex-col items-center">
                <div className="h-full w-px bg-border absolute mt-2" />
                <div
                    className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 z-10"
                    style={{ backgroundColor: color }}
                >
                    {log.rating}
                </div>
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">
                            {dateStr}
                        </p>
                        <span className="text-xs text-muted-foreground">
                            {timeStr}
                        </span>
                    </div>

                    <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1" align="end">
                            {isConfirmingDelete ? (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium px-2 py-1 text-center">Zeker weten?</p>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full justify-center text-xs h-7"
                                        onClick={confirmDelete}
                                        disabled={isPending}
                                    >
                                        Ja, verwijder
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-center text-xs h-7"
                                        onClick={() => setIsConfirmingDelete(false)}
                                    >
                                        Annuleren
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs font-normal"
                                        onClick={() => {
                                            setIsEditing(true)
                                            setIsPopoverOpen(false)
                                        }}
                                    >
                                        <Pencil className="h-3 w-3 mr-2" />
                                        Bewerken
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-xs font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={handleDeleteClick}
                                    >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Verwijderen
                                    </Button>
                                </>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {log.content}
                </p>
            </div>
        </div>
    )
}
