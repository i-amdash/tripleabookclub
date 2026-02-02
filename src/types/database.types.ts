export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'member' | 'admin' | 'super_admin'
export type BookCategory = 'fiction' | 'non-fiction'
export type MediaType = 'image' | 'video'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          bio: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          bio?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author: string
          synopsis: string
          image_url: string | null
          category: BookCategory
          month: number
          year: number
          is_selected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          synopsis: string
          image_url?: string | null
          category: BookCategory
          month: number
          year: number
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          synopsis?: string
          image_url?: string | null
          category?: BookCategory
          month?: number
          year?: number
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string
          synopsis: string
          image_url: string | null
          category: BookCategory
          month: number
          year: number
          vote_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author: string
          synopsis: string
          image_url?: string | null
          category: BookCategory
          month: number
          year: number
          vote_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string
          synopsis?: string
          image_url?: string | null
          category?: BookCategory
          month?: number
          year?: number
          vote_count?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          suggestion_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          suggestion_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          suggestion_id?: string
          created_at?: string
        }
      }
      gallery: {
        Row: {
          id: string
          type: MediaType
          url: string
          title: string
          description: string | null
          month: number
          year: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: MediaType
          url: string
          title: string
          description?: string | null
          month: number
          year: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: MediaType
          url?: string
          title?: string
          description?: string | null
          month?: number
          year?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          profile_id: string | null
          name: string
          role: string
          bio: string | null
          image_url: string | null
          order_index: number
          is_visible: boolean
          social_links: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          name: string
          role: string
          bio?: string | null
          image_url?: string | null
          order_index?: number
          is_visible?: boolean
          social_links?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          name?: string
          role?: string
          bio?: string | null
          image_url?: string | null
          order_index?: number
          is_visible?: boolean
          social_links?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      portal_status: {
        Row: {
          id: string
          month: number
          year: number
          category: BookCategory
          nomination_open: boolean
          voting_open: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          month: number
          year: number
          category: BookCategory
          nomination_open?: boolean
          voting_open?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          month?: number
          year?: number
          category?: BookCategory
          nomination_open?: boolean
          voting_open?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      site_content: {
        Row: {
          id: string
          page: string
          section: string
          content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page: string
          section: string
          content: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page?: string
          section?: string
          content?: Json
          created_at?: string
          updated_at?: string
        }
      }
      meetups: {
        Row: {
          id: string
          title: string
          description: string | null
          venue_name: string
          address: string
          city: string
          latitude: number | null
          longitude: number | null
          google_maps_url: string | null
          event_date: string
          end_time: string | null
          month: number
          year: number
          image_url: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          venue_name: string
          address: string
          city?: string
          latitude?: number | null
          longitude?: number | null
          google_maps_url?: string | null
          event_date: string
          end_time?: string | null
          month: number
          year: number
          image_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          venue_name?: string
          address?: string
          city?: string
          latitude?: number | null
          longitude?: number | null
          google_maps_url?: string | null
          event_date?: string
          end_time?: string | null
          month?: number
          year?: number
          image_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
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
      user_role: UserRole
      book_category: BookCategory
      media_type: MediaType
    }
  }
}

// Row types (for reading data)
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Book = Database['public']['Tables']['books']['Row']
export type Suggestion = Database['public']['Tables']['suggestions']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type GalleryItem = Database['public']['Tables']['gallery']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type PortalStatus = Database['public']['Tables']['portal_status']['Row']
export type SiteContent = Database['public']['Tables']['site_content']['Row']
export type Meetup = Database['public']['Tables']['meetups']['Row']

// Insert types (for creating data)
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type BookInsert = Database['public']['Tables']['books']['Insert']
export type SuggestionInsert = Database['public']['Tables']['suggestions']['Insert']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']
export type GalleryItemInsert = Database['public']['Tables']['gallery']['Insert']
export type MemberInsert = Database['public']['Tables']['members']['Insert']
export type PortalStatusInsert = Database['public']['Tables']['portal_status']['Insert']
export type SiteContentInsert = Database['public']['Tables']['site_content']['Insert']
export type MeetupInsert = Database['public']['Tables']['meetups']['Insert']

// Update types (for updating data)
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type BookUpdate = Database['public']['Tables']['books']['Update']
export type SuggestionUpdate = Database['public']['Tables']['suggestions']['Update']
export type VoteUpdate = Database['public']['Tables']['votes']['Update']
export type GalleryItemUpdate = Database['public']['Tables']['gallery']['Update']
export type MemberUpdate = Database['public']['Tables']['members']['Update']
export type PortalStatusUpdate = Database['public']['Tables']['portal_status']['Update']
export type SiteContentUpdate = Database['public']['Tables']['site_content']['Update']
export type MeetupUpdate = Database['public']['Tables']['meetups']['Update']

