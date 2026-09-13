/**
 * Supabase şema tipleri — supabase/migrations ile senkron tutulur.
 * Canlı projeye bağlandıktan sonra `supabase gen types typescript` çıktısıyla
 * değiştirilebilir; yapı aynıdır.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type StaffRole = 'manager' | 'reception' | 'viewer'
export type VenueStaffRow = {
  id: string; venue_id: string; user_id: string; role: StaffRole
  created_at: string; updated_at: string
}
export type StaffInviteRow = {
  id: string; venue_id: string; email: string; role: StaffRole; token_hash: string
  invited_by: string; expires_at: string; accepted_at: string | null; revoked_at: string | null
  created_at: string; updated_at: string
}

export type ReservationSeriesRow = {
  id: string; venue_id: string; court_id: string; name: string; guest_name: string
  guest_phone: string | null; weekday: number; start_time: string; end_time: string
  start_date: string; end_date: string; source: 'manual'; status: 'active' | 'cancelled'
  created_by: string | null; created_at: string; updated_at: string
}
type SeriesDefaultFields = 'id' | 'guest_phone' | 'source' | 'status' | 'created_by' | 'created_at' | 'updated_at'

export type VenueCustomerRow = {
  id: string; venue_id: string; normalized_phone: string; display_name: string; notes: string
  profile_id: string | null; is_blacklisted: boolean; blacklist_reason: string
  last_booking_at: string | null; created_at: string; updated_at: string; deleted_at: string | null
}

export interface Database {
  public: {
    Tables: {
      venue_staff: {
        Row: VenueStaffRow
        Insert: Pick<VenueStaffRow, 'venue_id' | 'user_id' | 'role'> & Partial<VenueStaffRow>
        Update: Partial<VenueStaffRow>
        Relationships: []
      }
      staff_invites: {
        Row: StaffInviteRow
        Insert: Pick<StaffInviteRow, 'venue_id' | 'email' | 'role' | 'token_hash' | 'invited_by'> & Partial<StaffInviteRow>
        Update: Partial<StaffInviteRow>
        Relationships: []
      }
      reservation_notification_deliveries: {
        Row: { reservation_id: string; owner_id: string; request_body: Json | null; started_at: string; sent_at: string | null; created_at: string; updated_at: string }
        Insert: { reservation_id: string; owner_id: string; request_body?: Json | null; started_at?: string; sent_at?: string | null; created_at?: string; updated_at?: string }
        Update: { request_body?: Json | null; sent_at?: string | null; updated_at?: string }
        Relationships: []
      }
      venue_customers: {
        Row: VenueCustomerRow
        Insert: Pick<VenueCustomerRow, 'venue_id' | 'normalized_phone' | 'display_name'> & Partial<VenueCustomerRow>
        Update: Partial<VenueCustomerRow>
        Relationships: []
      }
      reservation_series: {
        Row: ReservationSeriesRow
        Insert: Omit<ReservationSeriesRow, SeriesDefaultFields> & Partial<Pick<ReservationSeriesRow, SeriesDefaultFields>>
        Update: Partial<ReservationSeriesRow>
        Relationships: []
      }
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
          source: Database['public']['Enums']['reservation_source']
          series_id: string | null
          venue_customer_id: string | null
          occurrence_date: string | null
          series_superseded: boolean
          guest_reference: string | null
          client_request_id: string | null
          external_provider: string | null
          external_reservation_id: string | null
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
          source?: Database['public']['Enums']['reservation_source']
          series_id?: string | null
          venue_customer_id?: string | null
          occurrence_date?: string | null
          series_superseded?: boolean
          guest_reference?: string | null
          client_request_id?: string | null
          external_provider?: string | null
          external_reservation_id?: string | null
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
          source?: Database['public']['Enums']['reservation_source']
          series_id?: string | null
          venue_customer_id?: string | null
          occurrence_date?: string | null
          series_superseded?: boolean
          guest_reference?: string | null
          external_provider?: string | null
          external_reservation_id?: string | null
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
      list_panel_venues: { Args: Record<string, never>; Returns: { id: string; name: string; role: string }[] }
      list_venue_staff: { Args: { p_venue_id: string }; Returns: { id: string; venue_id: string; user_id: string; role: string; full_name: string; created_at: string }[] }
      get_panel_schedule: { Args: { p_venue_id: string; p_date: string }; Returns: {
        id: string; series_id: string | null; source: Database['public']['Enums']['reservation_source']; court_id: string
        start_time: string; end_time: string; status: Database['public']['Enums']['reservation_status']; is_block: boolean
        no_show: boolean; guest_name: string | null; guest_phone: string | null; notes: string | null; profiles: Json
      }[] }
      has_venue_permission: { Args: { p_venue_id: string; p_permission: string }; Returns: boolean }
      manage_venue_staff: { Args: { p_input: Json }; Returns: Json }
      accept_staff_invite: { Args: { p_token: string }; Returns: string }
      create_marketplace_reservation: {
        Args: {
          p_court_id: string
          p_venue_id: string
          p_reservation_date: string
          p_start_time: string
          p_end_time: string
          p_expected_total_price: number
          p_notes?: string | null
          p_request_id?: string | null
        }
        Returns: Json
      }
      save_venue_customer: { Args: { p_input: Json }; Returns: string }
      delete_venue_customer: { Args: { p_id: string }; Returns: undefined }
      search_venue_customers: {
        Args: { p_venue_id: string; p_query: string; p_filter: string; p_limit: number; p_offset: number }
        Returns: Json
      }
      normalize_customer_phone: { Args: { p_phone: string }; Returns: string | null }
      manage_reservation_series: {
        Args: { p_input: Json; p_preview: boolean }
        Returns: Json
      }
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
          owner_reply: string | null
          owner_reply_at: string | null
        }[]
      }
      get_venue_rating_summaries: {
        Args: { p_venue_ids: string[] }
        Returns: {
          venue_id: string
          avg_rating: number
          review_count: number
        }[]
      }
    }
    Enums: {
      user_role: 'customer' | 'venue_owner' | 'admin'
      venue_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
      reservation_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      reservation_source: 'marketplace' | 'manual' | 'block' | 'external'
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
export type ReservationSource = Enums<'reservation_source'>
