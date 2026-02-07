'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTag(name: string, color: string = '#64748b') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase.from('tags').insert({
        name,
        color,
        user_id: user.id
    }).select().single()

    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/locations')
    return data
}

export async function deleteTag(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('tags').delete().eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/')
    revalidatePath('/locations')
}

export async function toggleItemTag(itemId: string, tagId: string) {
    const supabase = await createClient()

    // Check if link exists
    const { data: existing } = await supabase
        .from('item_tags')
        .select('*')
        .eq('item_id', itemId)
        .eq('tag_id', tagId)
        .single()

    if (existing) {
        await supabase.from('item_tags').delete().eq('item_id', itemId).eq('tag_id', tagId)
    } else {
        await supabase.from('item_tags').insert({ item_id: itemId, tag_id: tagId })
    }

    revalidatePath('/')
    revalidatePath('/locations')
}
