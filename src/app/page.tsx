import { createClient } from '@/lib/supabase/server'
import { QuickInput } from '@/components/core/QuickInput'
import { ItemCard } from '@/components/core/ItemCard'
import { TagFilter } from '@/components/core/TagFilter'
import { redirect } from 'next/navigation'

export default async function Home(props: {
  searchParams: Promise<{ tag?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let queryBuilder = supabase.from('items').select(`
        *,
        item_tags${searchParams?.tag ? '!inner' : ''} (
            tag:tags (*)
        )
    `)
    .eq('type', 'INBOX')
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false })

    .eq('type', 'INBOX')
    .order('created_at', { ascending: false })

  // Removed server-side tag filtering to allow deriving available tags from full set
  const { data: items } = await queryBuilder

  const formattedItems = items?.map((item: any) => ({
    ...item,
    tags: item.item_tags.map((it: any) => it.tag)
  })) || []

  // Derive tags from ALL inbox items (before filtering)
  const uniqueTagsMap = new Map()
  formattedItems.forEach(item => {
    item.tags.forEach((tag: any) => {
      if (!uniqueTagsMap.has(tag.id)) {
        uniqueTagsMap.set(tag.id, tag)
      }
    })
  })
  const uniqueTags = Array.from(uniqueTagsMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))

  // Filter items for display based on selected tag
  const filteredItems = searchParams?.tag
    ? formattedItems.filter(item => item.tags.some((t: any) => t.id === searchParams.tag))
    : formattedItems

  return (
    <main className="flex min-h-screen flex-col items-center bg-background pb-40">
      <div className="w-full max-w-2xl px-4 pt-12 md:pt-24">
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Inbox</h1>
          <p className="text-muted-foreground mb-4">Leeg je hoofd, {user?.email}.</p>
          <TagFilter availableTags={uniqueTags} />
        </header>

        <div className="space-y-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}

          {!filteredItems.length && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Geen items gevonden.</p>
            </div>
          )}
        </div>
      </div>

      <QuickInput />
    </main>
  )
}
