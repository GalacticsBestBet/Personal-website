'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSkills() {
    const supabase = await createClient()
    const { data: skills, error } = await supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching skills:', error)
        return []
    }

    return skills
}

export async function getSkill(id: string) {
    const supabase = await createClient()
    const { data: skill, error } = await supabase
        .from('skills')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching skill:', error)
        return null
    }

    return skill
}

export async function createSkill(formData: FormData) {
    const supabase = await createClient()
    const title = formData.get('title') as string
    const color = (formData.get('color') as string) || '#3b82f6' // Default blue
    const target_level = parseInt((formData.get('target_level') as string) || '100')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('skills').insert({
        user_id: user.id,
        title,
        color,
        target_level
    })

    if (error) {
        console.error('Error creating skill:', error)
        throw new Error('Failed to create skill')
    }

    revalidatePath('/skills')
}

export async function deleteSkill(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('skills').delete().eq('id', id)

    if (error) {
        console.error('Error deleting skill:', error)
        throw new Error('Failed to delete skill')
    }

    revalidatePath('/skills')
}

export async function getSkillLogs(skillId: string) {
    const supabase = await createClient()
    const { data: logs, error } = await supabase
        .from('skill_logs')
        .select('*')
        .eq('skill_id', skillId)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching skill logs:', error)
        return []
    }

    return logs
}

export async function addSkillLog(formData: FormData) {
    const supabase = await createClient()
    const skill_id = formData.get('skill_id') as string
    const content = formData.get('content') as string
    const rating = parseInt((formData.get('rating') as string) || '0')
    const date = (formData.get('date') as string) || new Date().toISOString()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('skill_logs').insert({
        user_id: user.id,
        skill_id,
        content,
        rating,
        date
    })

    if (error) {
        console.error('Error adding skill log:', error)
        throw new Error('Failed to add log')
    }

    revalidatePath(`/skills/${skill_id}`)
    revalidatePath('/skills')
}

export async function updateSkillLog(formData: FormData) {
    const supabase = await createClient()
    const log_id = formData.get('log_id') as string
    const skill_id = formData.get('skill_id') as string // Needed for revalidation
    const content = formData.get('content') as string
    const rating = parseInt((formData.get('rating') as string) || '0')
    const date = (formData.get('date') as string)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const updateData: any = { content, rating }
    if (date) updateData.date = date

    const { error } = await supabase
        .from('skill_logs')
        .update(updateData)
        .eq('id', log_id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating skill log:', error)
        throw new Error('Failed to update log')
    }

    revalidatePath(`/skills/${skill_id}`)
    revalidatePath('/skills')
}

export async function deleteSkillLog(logId: string, skillId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('skill_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting skill log:', error)
        throw new Error('Failed to delete log')
    }

    revalidatePath(`/skills/${skillId}`)
    revalidatePath('/skills')
}
