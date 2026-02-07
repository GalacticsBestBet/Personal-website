import { createClient } from '@/lib/supabase/server'
import { QuickInput } from '@/components/core/QuickInput'
import { ItemCard } from '@/components/core/ItemCard'
import { TagFilter } from '@/components/core/TagFilter'
import { PushNotificationManager } from '@/components/core/PushNotificationManager'
import { redirect } from 'next/navigation'
import { CheckSquare } from 'lucide-react'

export default async function TasksPage(props: {
    searchParams: Promise<{ tag?: string }>
}) {
    // Await params first
    const params = await props.searchParams
    const { tag } = params
    const supabase = await createClient()

    let queryBuilder = supabase.from('items').select(`
        *,
        item_tags${tag ? '!inner' : ''} (
            tag:tags (*)
        )
    `)
        .eq('type', 'TASK')
        .eq('status', 'OPEN')
        .order('is_priority', { ascending: false })
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false })

        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false })

    // Removed server-side tag filtering
    const { data: items } = await queryBuilder

    const formattedItems = items?.map((item: any) => ({
        ...item,
        tags: item.item_tags.map((it: any) => it.tag)
    })) || []

    // Derive tags from ALL task items
    const uniqueTagsMap = new Map()
    formattedItems.forEach(item => {
        item.tags.forEach((tag: any) => {
            if (!uniqueTagsMap.has(tag.id)) {
                uniqueTagsMap.set(tag.id, tag)
            }
        })
    })
    const uniqueTags = Array.from(uniqueTagsMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))

    // Filter items for display
    const filteredItems = tag
        ? formattedItems.filter(item => item.tags.some((t: any) => t.id === tag))
        : formattedItems

    return (
        <main className="flex min-h-screen flex-col items-center bg-background pb-24">
            <div className="w-full max-w-2xl px-4 pt-12 md:pt-24">
                <header className="mb-4 space-y-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tight">Taken</h1>
                        </div>
                        <PushNotificationManager />
                    </div>
                    <TagFilter availableTags={uniqueTags} />
                </header>

                <div className="space-y-4">
                    {filteredItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}

                    {!filteredItems.length && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Geen taken gevonden.</p>
                            <p className="text-sm">Maak een taak vanuit je Inbox of typ hieronder.</p>
                        </div>
                    )}
                </div>
            </div>

            <QuickInput defaultType="TASK" />
        </main>
    )
}
