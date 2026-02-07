import { createClient } from '@/lib/supabase/server'
import { HistoryItemCard } from '@/components/core/HistoryItemCard'
import { History } from 'lucide-react'

export default async function HistoryPage() {
    const supabase = await createClient()

    // Fetch Completed and Archived items
    const { data: items } = await supabase.from('items').select(`
        *,
        item_tags (
            tag:tags (*)
        )
    `)
        .in('status', ['COMPLETED', 'ARCHIVED'])
        .order('updated_at', { ascending: false })
    // Ordered by updated_at so recently deleted/completed are top

    const formattedItems = items?.map(item => ({
        ...item,
        tags: item.item_tags.map((it: any) => it.tag)
    })) || []

    return (
        <main className="flex min-h-screen flex-col items-center bg-background pb-24">
            <div className="w-full max-w-2xl px-4 pt-12 md:pt-24">
                <header className="mb-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <History className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Geschiedenis</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Items die je hebt afgevinkt of verwijderd.
                    </p>
                </header>

                <div className="space-y-4">
                    {formattedItems.map((item) => (
                        <HistoryItemCard key={item.id} item={item} />
                    ))}

                    {!formattedItems.length && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Je geschiedenis is leeg.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
