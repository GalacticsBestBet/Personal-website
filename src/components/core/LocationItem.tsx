'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { deleteItem } from '@/app/actions'
import { useState } from 'react'
import { ItemDetailDialog } from '@/components/core/ItemDetailDialog'
import { Separator } from '@/components/ui/separator'

interface LocationItemProps {
    item: any
}

export function LocationItemCard({ item }: LocationItemProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Weet je zeker dat je deze locatie wilt verwijderen?')) return

        setIsDeleting(true)
        try {
            await deleteItem(item.id)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Card
                className="p-4 flex justify-between items-center group cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setIsDialogOpen(true)}
            >
                <div className="flex-1">
                    <h3 className="font-medium text-lg leading-tight">{item.content}</h3>
                    {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        {item.location_lat && item.location_lng ? (
                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                                GPS: {item.location_lat.toFixed(4)}, {item.location_lng.toFixed(4)}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">
                                Handmatig adres
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                            • {format(new Date(item.created_at), "d MMM yyyy")}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Verwijderen"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="ml-2 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link
                            href={
                                item.location_lat && item.location_lng
                                    ? `https://www.google.com/maps/search/?api=1&query=${item.location_lat},${item.location_lng}`
                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location_name || item.content)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Navigation className="h-4 w-4" />
                            Navigeer
                        </Link>
                    </Button>
                </div>
            </Card>

            <ItemDetailDialog
                item={item}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </>
    )
}
