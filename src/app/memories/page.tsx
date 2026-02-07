import { createClient } from '@/lib/supabase/server'
import { QuickInput } from '@/components/core/QuickInput'
import { ItemCard } from '@/components/core/ItemCard'
import { SearchBar } from '@/components/core/SearchBar'
import { TagFilter } from '@/components/core/TagFilter'
import { redirect } from 'next/navigation'
import { Brain } from 'lucide-react'

export default async function MemoriesPage(props: {
    searchParams: Promise<{ q?: string; tag?: string }>
}) {
    // Await params first
    const params = await props.searchParams
    const { q: query = '', tag } = params
    const supabase = await createClient()

    let queryBuilder = supabase.from('items').select(`
    *,
    item_tags${tag ? '!inner' : ''} (
        tag: tags (*)
    )
`)
        .eq('type', 'MEMORY')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })

    if (tag) {
        queryBuilder = queryBuilder.eq('item_tags.tag_id', tag)
    }

    const { data: items } = await queryBuilder

    let formattedItems = items?.map((item: any) => ({
        ...item,
        tags: item.item_tags.map((it: any) => it.tag)
    })) || []

    // Client-side filtering for search (to include tags)
    if (query) {
        const lowerQuery = query.toLowerCase()
        formattedItems = formattedItems.filter(item =>
            item.content.toLowerCase().includes(lowerQuery) ||
            item.tags.some((t: any) => t.name.toLowerCase().includes(lowerQuery))
        )
    }

    // Extract unique tags from the items (before search filtering if we want to show all available in context, 
    // or after if we want to narrow down further? Usually "in context" means "in this folder/category", so before search is better).
    // Actually, let's use the full list of items (before client-side search query filtering) for the tags,
    // so you can see what tags are available to filter by.
    // Wait, the client-side search filtering happens inside the component body, but we need to pass props to TagFilter.

    // Let's iterate over `formattedItems` (which is ALL items for this page, before search query refines it further down? 
    // No, `formattedItems` is receiving the items from DB. 
    // Note: I modified page.tsx previously to do client side filtering at the END of the function, but my view_file showed it implicitly?
    // Let's re-read page.tsx to be sure where `formattedItems` is defined vs used.

    // In previous turn I did: `formattedItems = formattedItems.filter(...)` if query exists.
    // So if I calculate tags from `formattedItems` *after* filter, the tags disappear if I type?
    // User wants: "Enkel tags als optie displayen als er items bestaan met die tags in de categorie"
    // So: In "Brain" category -> Show all tags used by Brain items.

    // So I should calculate unique tags from `formattedItems` BEFORE the search query filter.
    // But wait, `formattedItems` is modified in place in my previous edit? 
    // "formattedItems = formattedItems.filter" -> Yes.

    // So I need to grab tags before that filter.
    // Use `items` (from DB query) which has `item_tags`.

    const uniqueTagsMap = new Map()
    items?.forEach((item: any) => {
        item.item_tags.forEach((it: any) => {
            if (!uniqueTagsMap.has(it.tag.id)) {
                uniqueTagsMap.set(it.tag.id, it.tag)
            }
        })
    })
    const uniqueTags = Array.from(uniqueTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    return (
        <main className="flex min-h-screen flex-col items-center bg-background pb-24">
            <div className="w-full max-w-2xl px-4 pt-12 md:pt-24">
                <header className="mb-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Brain className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Brein</h1>
                    </div>
                    <SearchBar />
                    <TagFilter availableTags={uniqueTags} />
                </header>

                <div className="space-y-4">
                    {formattedItems?.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}

                    {!formattedItems?.length && (
                        <div className="text-center py-12 text-muted-foreground">
                            {query || tag ? (
                                <p>Niets gevonden.</p>
                            ) : (
                                <>
                                    <p>Je externe brein is nog leeg.</p>
                                    <p className="text-sm">Sla dingen op om te onthouden.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <QuickInput defaultType="MEMORY" />
        </main>
    )
}
