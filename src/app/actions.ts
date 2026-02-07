'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
    const supabase = await createClient()
    const content = formData.get('content') as string
    const type = (formData.get('type') as string) || 'INBOX'
    const tagsJson = formData.get('tags') as string
    const tags = tagsJson ? JSON.parse(tagsJson) : []

    const locationLatStr = formData.get('location_lat') as string
    const locationLngStr = formData.get('location_lng') as string
    const locationName = formData.get('location_name') as string

    const location_lat = locationLatStr ? parseFloat(locationLatStr) : null
    const location_lng = locationLngStr ? parseFloat(locationLngStr) : null

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    if (!content) return

    const { data: item, error } = await supabase.from('items').insert({
        content,
        type: type as any,
        user_id: user.id,
        created_at: new Date().toISOString(),
        location_lat,
        location_lng,
        location_name: locationName
    }).select().single()

    if (error) {
        console.error('Error creating item:', error)
        throw new Error('Failed to create item')
    }

    if (tags.length > 0 && item) {
        const tagInserts = tags.map((tagId: string) => ({
            item_id: item.id,
            tag_id: tagId
        }))

        const { error: tagError } = await supabase.from('item_tags').insert(tagInserts)
        if (tagError) {
            console.error('Error adding tags:', tagError)
            // Don't throw here, item is created
        }
    }

    revalidatePath('/')
    revalidatePath('/locations')
}

export async function updateItem(id: string, updates: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('items').update(updates).eq('id', id)

    if (error) {
        console.error('Error updating item:', error)
        throw new Error('Failed to update item')
    }

    revalidatePath('/')
    revalidatePath('/tasks')
    revalidatePath('/locations')
}

export async function deleteItem(id: string) {
    const supabase = await createClient()
    // Soft delete: set status to ARCHIVED
    const { error } = await supabase.from('items').update({ status: 'ARCHIVED' }).eq('id', id)

    if (error) {
        console.error('Error archiving item:', error)
        throw new Error('Failed to archive item')
    }

    revalidatePath('/')
    revalidatePath('/tasks')
    revalidatePath('/memories')
    revalidatePath('/history')
    revalidatePath('/locations')
}

export async function hardDeleteItem(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) {
        console.error('Error permanently deleting item:', error)
        throw new Error('Failed to delete item')
    }

    revalidatePath('/history')
    revalidatePath('/locations')
}

export async function restoreItem(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('items').update({ status: 'OPEN' }).eq('id', id)

    if (error) {
        console.error('Error restoring item:', error)
        throw new Error('Failed to restore item')
    }

    revalidatePath('/')
    revalidatePath('/tasks')
    revalidatePath('/memories')
    revalidatePath('/history')
    revalidatePath('/locations')
}
