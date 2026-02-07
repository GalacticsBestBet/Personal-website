import { createClient } from '@/lib/supabase/server'
import { ItemCard } from '@/components/core/ItemCard'
import { DateFilter } from '@/components/core/DateFilter'
import { SearchBar } from '@/components/core/SearchBar'
import { TagFilter } from '@/components/core/TagFilter'
import { CalendarDays } from 'lucide-react'
import { format, startOfDay, endOfDay } from 'date-fns'

export default async function OverviewPage(props: {
    searchParams: Promise<{ from?: string; to?: string; q?: string; tag?: string }>
}) {
    const params = await props.searchParams
    const { from, to, q: query = '', tag } = params
    const supabase = await createClient()

    let queryBuilder = supabase.from('items').select(`
        *,
        item_tags (
            tag:tags (*)
        )
    `)
        .order('created_at', { ascending: false })

    // Apply Date Range Filter
    if (from) {
        // Start of the 'from' day
        const startDate = `${from}T00:00:00.000Z`
        queryBuilder = queryBuilder.gte('created_at', startDate)
    }

    if (to) {
        // End of the 'to' day
        const endDate = `${to}T23:59:59.999Z`
        queryBuilder = queryBuilder.lte('created_at', endDate)
    } else if (from) {
        // If only 'from' is selected, restrict to THAT day
        const endDate = `${from}T23:59:59.999Z`
        queryBuilder = queryBuilder.lte('created_at', endDate)
    }

    const { data: items } = await queryBuilder

    let formattedItems = items?.map((item: any) => ({
        ...item,
        tags: item.item_tags.map((it: any) => it.tag)
    })) || []

    // 1. Derive tags from ALL items in the current date range (before text/tag filtering)
    const uniqueTagsMap = new Map()
    formattedItems.forEach(item => {
        item.tags.forEach((t: any) => {
            if (!uniqueTagsMap.has(t.id)) {
                uniqueTagsMap.set(t.id, t)
            }
        })
    })
    const uniqueTags = Array.from(uniqueTagsMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))

    // 2. Client-side filtering
    if (tag) {
        formattedItems = formattedItems.filter(item => item.tags.some((t: any) => t.id === tag))
    }

    if (query) {
        const lowerQuery = query.toLowerCase()
        formattedItems = formattedItems.filter(item =>
            item.content.toLowerCase().includes(lowerQuery) ||
            item.tags.some((t: any) => t.name.toLowerCase().includes(lowerQuery))
        )
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-background pb-24">
            <div className="w-full max-w-2xl px-4 pt-12 md:pt-24">
                <header className="mb-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Overzicht</h1>
                    </div>
                    <DateFilter />
                    <div className="space-y-2">
                        <SearchBar />
                        <TagFilter availableTags={uniqueTags} />
                    </div>
                </header>

                <div className="space-y-4">
                    {formattedItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}

                    {!formattedItems.length && (
                        <div className="text-center py-12 text-muted-foreground">
                            {query || tag ? (
                                <p>Niets gevonden met deze filters.</p>
                            ) : (
                                from ? (
                                    <p>Geen items gevonden in deze periode.</p>
                                ) : (
                                    <p>Nog geen items.</p>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
