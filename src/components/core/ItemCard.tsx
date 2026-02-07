'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Trash2, ArrowRightCircle, CheckCircle2, Brain, ExternalLink, X, Check, CalendarPlus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { updateItem, deleteItem } from '@/app/actions'
import { Database } from '@/lib/database.types'
import { TagPicker } from './TagPicker'
import { DateTimePicker } from './DateTimePicker'
import { SwipeableItem } from './SwipeableItem'
import { ItemDetailDialog } from './ItemDetailDialog'

// Extend the database item type to include tags (simulated join)
type Item = Database['public']['Tables']['items']['Row'] & {
    tags?: { id: string; name: string; color: string }[]
    url?: string | null
}

interface ItemCardProps {
    item: Item
}

export function ItemCard({ item }: ItemCardProps) {
    const [isPending, setIsPending] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)

    const handleStatusChange = async (checked: boolean) => {
        setIsPending(true)
        try {
            await updateItem(item.id, { status: checked ? 'COMPLETED' : 'OPEN' })
        } finally {
            setIsPending(false)
        }
    }

    const handleConvertToTask = async (date?: Date) => {
        setIsPending(true)
        try {
            await updateItem(item.id, {
                type: 'TASK',
                due_date: date ? date.toISOString() : undefined
            })
        } finally {
            setIsPending(false)
        }
    }

    const handleDelete = () => {
        setIsConfirming(true)
    }

    const confirmDelete = async () => {
        setIsPending(true)
        try {
            await deleteItem(item.id)
        } finally {
            setIsPending(false)
            setIsConfirming(false)
        }
    }

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        <>
            <ItemDetailDialog
                item={item}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />

            <SwipeableItem
                className={cn(
                    "transition-all mb-4",
                    item.status === 'COMPLETED' && "opacity-60"
                )}
                onSwipeLeft={handleDelete}
                onSwipeRight={async () => {
                    if (item.type === 'TASK') {
                        await handleStatusChange(item.status !== 'COMPLETED')
                    } else if (item.type === 'INBOX') {
                        handleConvertToTask()
                    }
                }}
            >
                <Card
                    className={cn(
                        "p-4 group border-transparent shadow-none bg-card transition-colors cursor-pointer hover:bg-accent/50",
                    )}
                    onClick={() => setIsDialogOpen(true)}
                >
                    <div className="flex items-start gap-3">
                        {item.type === 'TASK' && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={item.status === 'COMPLETED'}
                                    onCheckedChange={handleStatusChange}
                                    className="mt-1"
                                    disabled={isPending}
                                />
                            </div>
                        )}

                        <div className="flex-1 space-y-1">
                            <p className={cn(
                                "whitespace-pre-wrap leading-relaxed",
                                item.status === 'COMPLETED' && "line-through text-muted-foreground"
                            )}>
                                {item.content}
                            </p>

                            {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    {item.description}
                                </p>
                            )}

                            {item.due_date && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <CalendarIcon className="mr-1 h-3 w-3" />
                                    {format(new Date(item.due_date), "PPP - HH:mm")}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            {item.type === 'INBOX' && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                        onClick={() => handleStatusChange(true)}
                                        disabled={isPending}
                                        title="Voltooien"
                                    >
                                        <Check className="h-4 w-4" />
                                        <span className="sr-only">Voltooien</span>
                                    </Button>

                                    <DateTimePicker
                                        date={undefined}
                                        setDate={(date) => handleConvertToTask(date)}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <CalendarPlus className="h-4 w-4" />
                                                <span className="sr-only">Maak Taak</span>
                                            </Button>
                                        }
                                    />

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                        onClick={async () => {
                                            setIsPending(true)
                                            try {
                                                await updateItem(item.id, { type: 'MEMORY' })
                                            } finally {
                                                setIsPending(false)
                                            }
                                        }}
                                        disabled={isPending}
                                        title="Opslaan in Brein"
                                    >
                                        <Brain className="h-4 w-4" />
                                        <span className="sr-only">Naar Brein</span>
                                    </Button>
                                </>
                            )}

                            {item.type === 'TASK' && (
                                <DateTimePicker
                                    date={item.due_date ? new Date(item.due_date) : undefined}
                                    setDate={async (date) => {
                                        setIsPending(true)
                                        try {
                                            await updateItem(item.id, {
                                                due_date: date ? date.toISOString() : null
                                            })
                                        } finally {
                                            setIsPending(false)
                                        }
                                    }}
                                />
                            )}

                            {item.url && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(item.url || '', '_blank')
                                    }}
                                    title="Open Link"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">Open Link</span>
                                </Button>
                            )}

                            <TagPicker itemId={item.id} assignedTags={item.tags || []} />

                            <div className="flex items-center">
                                {isConfirming ? (
                                    <>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 text-[10px] px-2 mr-1"
                                            onClick={confirmDelete}
                                            disabled={isPending}
                                        >
                                            Zeker?
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setIsConfirming(false)}
                                            disabled={isPending}
                                            title="Annuleren"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={handleDelete}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Verwijder</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map((tag: any) => (
                                <div
                                    key={tag.id}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full border border-current font-medium opacity-80"
                                    style={{ color: tag.color, borderColor: tag.color }}
                                >
                                    {tag.name}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </SwipeableItem>
        </>
    )
}
