export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            items: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    description: string | null
                    type: 'INBOX' | 'TASK' | 'MEMORY' | 'LOCATION'
                    status: 'OPEN' | 'COMPLETED' | 'ARCHIVED'
                    due_date: string | null
                    is_priority: boolean
                    created_at: string
                    updated_at: string
                    url: string | null
                    location_lat: number | null
                    location_lng: number | null
                    location_name: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    description?: string | null
                    type?: 'INBOX' | 'TASK' | 'MEMORY' | 'LOCATION'
                    status?: 'OPEN' | 'COMPLETED' | 'ARCHIVED'
                    due_date?: string | null
                    is_priority?: boolean
                    created_at?: string
                    updated_at?: string
                    url?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    location_name?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    description?: string | null
                    type?: 'INBOX' | 'TASK' | 'MEMORY' | 'LOCATION'
                    status?: 'OPEN' | 'COMPLETED' | 'ARCHIVED'
                    due_date?: string | null
                    is_priority?: boolean
                    created_at?: string
                    updated_at?: string
                    url?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    location_name?: string | null
                }
            }
            tags: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    color: string | null
                    notification_rules: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    color?: string | null
                    notification_rules?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string | null
                    notification_rules?: Json | null
                    created_at?: string
                }
            }
        }
    }
}
