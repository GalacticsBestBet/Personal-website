export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    settings: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    settings?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    settings?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
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
                    reminder_sent: boolean
                    url: string | null
                    location_lat: number | null
                    location_lng: number | null
                    location_name: string | null
                    notify_at: string | null
                    last_reminded_at: string | null
                    created_at: string
                    updated_at: string
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
                    reminder_sent?: boolean
                    url?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    location_name?: string | null
                    notify_at?: string | null
                    last_reminded_at?: string | null
                    created_at?: string
                    updated_at?: string
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
                    reminder_sent?: boolean
                    url?: string | null
                    location_lat?: number | null
                    location_lng?: number | null
                    location_name?: string | null
                    notify_at?: string | null
                    last_reminded_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "items_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            tags: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    color: string | null
                    notification_rules: Json | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    color?: string | null
                    notification_rules?: Json | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string | null
                    notification_rules?: Json | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tags_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            item_tags: {
                Row: {
                    item_id: string
                    tag_id: string
                    user_id: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    item_id: string
                    tag_id: string
                    user_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    item_id?: string
                    tag_id?: string
                    user_id?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "item_tags_item_id_fkey"
                        columns: ["item_id"]
                        isOneToOne: false
                        referencedRelation: "items"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "item_tags_tag_id_fkey"
                        columns: ["tag_id"]
                        isOneToOne: false
                        referencedRelation: "tags"
                        referencedColumns: ["id"]
                    }
                ]
            }
            push_subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    endpoint: string
                    p256dh: string
                    auth: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    endpoint: string
                    p256dh: string
                    auth: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    endpoint?: string
                    p256dh?: string
                    auth?: string
                    created_at?: string
                }
                Relationships: []
            }
            skills: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    color: string | null
                    target_level: number | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    color?: string | null
                    target_level?: number | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    color?: string | null
                    target_level?: number | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            skill_logs: {
                Row: {
                    id: string
                    skill_id: string
                    user_id: string
                    content: string | null
                    rating: number | null
                    date: string
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    skill_id: string
                    user_id: string
                    content?: string | null
                    rating?: number | null
                    date?: string
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    skill_id?: string
                    user_id?: string
                    content?: string | null
                    rating?: number | null
                    date?: string
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "skill_logs_skill_id_fkey"
                        columns: ["skill_id"]
                        isOneToOne: false
                        referencedRelation: "skills"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            item_status: 'OPEN' | 'COMPLETED' | 'ARCHIVED'
            item_type: 'INBOX' | 'TASK' | 'MEMORY' | 'LOCATION'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
