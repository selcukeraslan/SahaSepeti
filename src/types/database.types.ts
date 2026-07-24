/**
 * Supabase şema tipleri — supabase/migrations ile senkron tutulur.
 * Canlı projeye bağlandıktan sonra `supabase gen types typescript` çıktısıyla
 * değiştirilebilir; yapı aynıdır.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: Database['public']['Enums']['user_role']
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string
          city: string
          district: string
          address: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          cover_image_url: string | null
          amenities: string[]
          status: Database['public']['Enums']['venue_status']
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string
          city: string
          district: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          cover_image_url?: string | null
          amenities?: string[]
          status?: Database['public']['Enums']['venue_status']
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string
          city?: string
          district?: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          cover_image_url?: string | null
          amenities?: string[]
          status?: Database['public']['Enums']['venue_status']
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'venues_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      venue_images: {
        Row: {
          id: string
          venue_id: string
          storage_path: string
          url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          storage_path: string
          url: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          storage_path?: string
          url?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'venue_images_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
      sports: {
        Row: {
          id: string
          name: string
          slug: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          icon?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon?: string
          created_at?: string
        }
        Relationships: []
      }
      venue_sports: {
        Row: {
          venue_id: string
          sport_id: string
        }
        Insert: {
          venue_id: string
          sport_id: string
        }
        Update: {
          venue_id?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'venue_sports_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'venue_sports_sport_id_fkey'
            columns: ['sport_id']
            isOneToOne: false
            referencedRelation: 'sports'
            referencedColumns: ['id']
          },
        ]
      }
      courts: {
        Row: {
          id: string
          venue_id: string
          sport_id: string
          name: string
          surface_type: string | null
          is_indoor: boolean
          capacity: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          sport_id: string
          name: string
          surface_type?: string | null
          is_indoor?: boolean
          capacity?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          sport_id?: string
          name?: string
          surface_type?: string | null
          is_indoor?: boolean
          capacity?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'courts_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'courts_sport_id_fkey'
            columns: ['sport_id']
            isOneToOne: false
            referencedRelation: 'sports'
            referencedColumns: ['id']
          },
        ]
      }
      opening_hours: {
        Row: {
          id: string
          venue_id: string
          day_of_week: number
          open_time: string
          close_time: string
          is_closed: boolean
        }
        Insert: {
          id?: string
          venue_id: string
          day_of_week: number
          open_time?: string
          close_time?: string
          is_closed?: boolean
        }
        Update: {
          id?: string
          venue_id?: string
          day_of_week?: number
          open_time?: string
          close_time?: string
          is_closed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'opening_hours_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
      price_rules: {
        Row: {
          id: string
          court_id: string
          day_of_week: number | null
          start_time: string
          end_time: string
          price: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          court_id: string
          day_of_week?: number | null
          start_time: string
          end_time: string
          price: number
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          court_id?: string
          day_of_week?: number | null
          start_time?: string
          end_time?: string
          price?: number
          currency?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'price_rules_court_id_fkey'
            columns: ['court_id']
            isOneToOne: false
            referencedRelation: 'courts'
            referencedColumns: ['id']
          },
        ]
      }
      reservations: {
        Row: {
          id: string
          court_id: string
          venue_id: string
          customer_id: string | null
          reservation_date: string
          start_time: string
          end_time: string
          status: Database['public']['Enums']['reservation_status']
          total_price: number
          deposit_amount: number
          notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          is_block: boolean
          no_show: boolean
          guest_name: string | null
          guest_phone: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          court_id: string
          venue_id?: string
          customer_id?: string | null
          reservation_date: string
          start_time: string
          end_time: string
          status?: Database['public']['Enums']['reservation_status']
          total_price?: number
          deposit_amount?: number
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          is_block?: boolean
          no_show?: boolean
          guest_name?: string | null
          guest_phone?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          court_id?: string
          venue_id?: string
          customer_id?: string | null
          reservation_date?: string
          start_time?: string
          end_time?: string
          status?: Database['public']['Enums']['reservation_status']
          total_price?: number
          deposit_amount?: number
          notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          is_block?: boolean
          no_show?: boolean
          guest_name?: string | null
          guest_phone?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservations_court_id_fkey'
            columns: ['court_id']
            isOneToOne: false
            referencedRelation: 'courts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          reservation_id: string
          amount: number
          type: Database['public']['Enums']['payment_type']
          status: Database['public']['Enums']['payment_status']
          provider: string | null
          provider_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          amount: number
          type: Database['public']['Enums']['payment_type']
          status?: Database['public']['Enums']['payment_status']
          provider?: string | null
          provider_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          amount?: number
          type?: Database['public']['Enums']['payment_type']
          status?: Database['public']['Enums']['payment_status']
          provider?: string | null
          provider_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_reservation_id_fkey'
            columns: ['reservation_id']
            isOneToOne: false
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          venue_id: string
          customer_id: string
          reservation_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          customer_id: string
          reservation_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          customer_id?: string
          reservation_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_reservation_id_fkey'
            columns: ['reservation_id']
            isOneToOne: false
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          },
        ]
      }
      favorites: {
        Row: {
          customer_id: string
          venue_id: string
          created_at: string
        }
        Insert: {
          customer_id: string
          venue_id: string
          created_at?: string
        }
        Update: {
          customer_id?: string
          venue_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorites_venue_id_fkey'
            columns: ['venue_id']
            isOneToOne: false
            referencedRelation: 'venues'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_venue_owner: {
        Args: Record<string, never>
        Returns: boolean
      }
      owns_venue: {
        Args: { vid: string }
        Returns: boolean
      }
      get_booked_slots: {
        Args: { p_venue_id: string; p_date: string }
        Returns: {
          court_id: string
          start_time: string
          end_time: string
        }[]
      }
      get_venue_reviews: {
        Args: { p_venue_id: string }
        Returns: {
          id: string
          rating: number
          comment: string | null
          created_at: string
          reviewer_name: string
        }[]
      }
    }
    Enums: {
      user_role: 'customer' | 'venue_owner' | 'admin'
      venue_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
      reservation_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      payment_type: 'deposit' | 'full'
      payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
    }
    CompositeTypes: Record<string, never>
  }
}

// ---------- Kısayol tipleri ----------
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Profile = Tables<'profiles'>
export type Venue = Tables<'venues'>
export type VenueImage = Tables<'venue_images'>
export type Sport = Tables<'sports'>
export type Court = Tables<'courts'>
export type OpeningHour = Tables<'opening_hours'>
export type PriceRule = Tables<'price_rules'>
export type Reservation = Tables<'reservations'>
export type Review = Tables<'reviews'>
export type Favorite = Tables<'favorites'>
export type UserRole = Enums<'user_role'>
export type VenueStatus = Enums<'venue_status'>
export type ReservationStatus = Enums<'reservation_status'>
