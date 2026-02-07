'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateItem } from '@/app/actions'
import { TagPicker } from './TagPicker'
import { Loader2 } from 'lucide-react'

interface ItemDetailDialogProps {
    item: any // Typed properly in parent, but 'any' facilitates easier integration for now
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ItemDetailDialog({ item, open, onOpenChange }: ItemDetailDialogProps) {
    const [content, setContent] = useState(item.content)
    const [description, setDescription] = useState(item.description || '')
    const [url, setUrl] = useState(item.url || '')
    const [isSaving, setIsSaving] = useState(false)

    // Reset state when item changes or dialog opens
    useEffect(() => {
        if (open) {
            setContent(item.content)
            setDescription(item.description || '')
            setUrl(item.url || '')
        }
    }, [open, item])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateItem(item.id, {
                content,
                description,
                url: url || null
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
