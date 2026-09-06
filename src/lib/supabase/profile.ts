import { SupabaseClient } from '@supabase/supabase-js'

export async function ensureProfileExists(
    supabase: SupabaseClient<any>,
    user: { id: string; email?: string | null }
) {
    if (!user || !user.id) return

    const { error } = await supabase
        .from('profiles')
        .upsert(
            {
                id: user.id,
                email: user.email ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
        )

    if (error) {
        console.error('Error ensuring profile exists:', error)
    }
}
