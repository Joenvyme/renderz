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
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          subscription_tier: 'free' | 'pro' | 'enterprise'
          credits_remaining: number
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          credits_remaining?: number
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          credits_remaining?: number
        }
      }
      renders: {
        Row: {
          id: string
          user_id: string
          original_image_url: string
          prompt: string
          generated_image_url: string | null
          upscaled_image_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          original_image_url: string
          prompt: string
          generated_image_url?: string | null
          upscaled_image_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          original_image_url?: string
          prompt?: string
          generated_image_url?: string | null
          upscaled_image_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}





