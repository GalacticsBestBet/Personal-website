import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { LocationItemCard } from '@/components/core/LocationItem'

export default async function LocationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: locationsData } = await supabase
        .from('items')
        .select(`
            *,
            item_tags (
                tag:tags (*)
            )
        `)
        .eq('user_id', user.id)
        .eq('type', 'LOCATION')
        .neq('status', 'ARCHIVED')
        .order('created_at', { ascending: false })

    const locations = locationsData?.map((item: any) => ({
        ...item,
        tags: item.item_tags?.map((it: any) => it.tag) || []
    }))

    return (
        <div className="pb-24 pt-4 md:pt-24 px-4 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-blue-500" />
                        Locatie Logboek
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Al je opgeslagen plekken.
                    </p>
                </div>
            </div>

            <div className="grid gap-3">
                {locations?.map((location) => (
                    <LocationItemCard key={location.id} item={location} />
                ))}

                {(!locations || locations.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Nog geen locaties opgeslagen.</p>
                        <p className="text-sm">Gebruik het 📍 icoontje in de invoerbalk.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
