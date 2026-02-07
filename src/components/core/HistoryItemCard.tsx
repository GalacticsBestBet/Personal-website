'use client'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Undo2, Trash2, CheckCircle2, Archive, X } from "lucide-react"
import { restoreItem, hardDeleteItem } from "@/app/actions"
import { useState } from "react"
import { format } from "date-fns"

interface HistoryItemCardProps {
    item: any
}

export function HistoryItemCard({ item }: HistoryItemCardProps) {
    const [isPending, setIsPending] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)

    const handleRestore = async () => {
        setIsPending(true)
        try {
            await restoreItem(item.id)
        } finally {
            setIsPending(false)
        }
    }

    const handleHardDelete = async () => {
        setIsPending(true)
        try {
            await hardDeleteItem(item.id)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card className="p-4 flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {item.status === 'COMPLETED' ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Voltooid
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                <Archive className="h-3 w-3 mr-1" />
                                Gearchiveerd
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {format(new Date(item.updated_at), "d MMM HH:mm")}
                        </span>
                    </div>
                    <p className={cn("text-base", item.status === 'COMPLETED' && "line-through text-muted-foreground")}>
                        {item.content}
                    </p>
                    {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {item.description}
                        </p>
                    )}
                </div>

                <div className="flex gap-1 shrink-0 ml-2 items-center">
                    {isConfirming ? (
                        <>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleHardDelete}
                                disabled={isPending}
                                className="h-8 text-xs font-medium px-2"
                            >
                                Zeker?
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsConfirming(false)}
                                disabled={isPending}
                                title="Annuleren"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={handleRestore}
                                disabled={isPending}
                                title="Herstellen"
                                className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setIsConfirming(true)}
                                disabled={isPending}
                                title="Definitief verwijderen"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map((tag: any) => (
                        <div
                            key={tag.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                            title={tag.name}
                        />
                    ))}
                </div>
            )}
        </Card>
    )
}
