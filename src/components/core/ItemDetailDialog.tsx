'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateItem } from '@/app/actions'
import { TagPicker } from './TagPicker'
import { Loader2, CalendarIcon } from 'lucide-react'
import { DateTimePicker } from './DateTimePicker'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'

interface ItemDetailDialogProps {
    item: any // Typed properly in parent, but 'any' facilitates easier integration for now
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ItemDetailDialog({ item, open, onOpenChange }: ItemDetailDialogProps) {
    const [content, setContent] = useState(item.content)
    const [description, setDescription] = useState(item.description || '')
    const [url, setUrl] = useState(item.url || '')
    const [date, setDate] = useState<Date | undefined>(item.due_date ? new Date(item.due_date) : undefined)
    const [reminderOffset, setReminderOffset] = useState<string>('0') // Default to 'On time'
    const [isSaving, setIsSaving] = useState(false)

    // Reset state when item changes or dialog opens
    useEffect(() => {
        if (open) {
            setContent(item.content)
            setDescription(item.description || '')
            setUrl(item.url || '')
            const d = item.due_date ? new Date(item.due_date) : undefined
            setDate(d)

            // Calculate initial offset
            if (d && item.notify_at) {
                const notify = new Date(item.notify_at)
                const diffMinutes = Math.round((d.getTime() - notify.getTime()) / 60000)
                // Match with nearest supported offset option to be safe, or just use it
                // For now, let's map exact matches, default to 0 if close
                if (diffMinutes >= 2800) setReminderOffset('2880') // 2 days
                else if (diffMinutes >= 1400) setReminderOffset('1440') // 1 day
                else if (diffMinutes >= 110) setReminderOffset('120') // 2 hours
                else if (diffMinutes >= 50) setReminderOffset('60') // 1 hour
                else if (diffMinutes >= 25) setReminderOffset('30')
                else if (diffMinutes >= 10) setReminderOffset('15')
                else if (diffMinutes >= 3) setReminderOffset('5')
                else setReminderOffset('0')
            } else {
                setReminderOffset('0') // Default
            }
        }
    }, [open, item])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            let notify_at = null
            if (date) {
                // Parse offset
                const offset = parseInt(reminderOffset)
                if (!isNaN(offset)) {
                    notify_at = new Date(date.getTime() - offset * 60000).toISOString()
                } else {
                    // If offset is 'none' or invalid, logic could vary. 
                    // Assuming 'none' means no notification
                    notify_at = null
                }
            }

            await updateItem(item.id, {
                content,
                description,
                url: url || null,
                due_date: date ? date.toISOString() : null,
                notify_at: notify_at,
                // If adding a date to an Inbox item, promote it to Task?
                // For now, let's keep type as is, unless user explicitly changes it elsewhere
                // But generally due_date implies Task.
                type: (item.type === 'INBOX' && date) ? 'TASK' : item.type
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to save', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Details</DialogTitle>
                    <DialogDescription className="sr-only">
                        Bewerk item details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Taak / Gedachte
                        </label>
                        <Textarea
                            value={content}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                            className="min-h-[80px] text-base resize-none"
                        />
                    </div>

                    {/* Date & Reminder Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <label className="text-sm font-medium leading-none">Datum</label>
                            <DateTimePicker
                                date={date}
                                setDate={setDate}
                                trigger={
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : <span>Kies datum...</span>}
                                    </Button>
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Herinnering</label>
                            <Select
                                value={reminderOffset}
                                onValueChange={setReminderOffset}
                                disabled={!date}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kies..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Op tijdstip zelf</SelectItem>
                                    <SelectItem value="5">5 minuten ervoor</SelectItem>
                                    <SelectItem value="15">15 minuten ervoor</SelectItem>
                                    <SelectItem value="30">30 minuten ervoor</SelectItem>
                                    <SelectItem value="60">1 uur ervoor</SelectItem>
                                    <SelectItem value="120">2 uur ervoor</SelectItem>
                                    <SelectItem value="1440">1 dag ervoor</SelectItem>
                                    <SelectItem value="2880">2 dagen ervoor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Notities (Subtext)
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="Extra info, links, paginanummers..."
                            className="min-h-[120px] resize-y"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Website / Link
                        </label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            type="url"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none block">
                            Tags
                        </label>
                        <div className="border rounded-md p-2">
                            <TagPicker itemId={item.id} assignedTags={item.tags || []} />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-row justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuleren
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Opslaan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
