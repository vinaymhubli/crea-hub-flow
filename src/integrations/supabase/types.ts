export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      about_page_content: {
        Row: {
          background_image_url: string | null
          color_scheme: string | null
          content: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_position: string | null
          image_url: string | null
          is_published: boolean | null
          section_type: string
          sort_order: number | null
          stats: Json | null
          subtitle: string | null
          team_member: Json | null
          title: string | null
          updated_at: string | null
          value_item: Json | null
        }
        Insert: {
          background_image_url?: string | null
          color_scheme?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          is_published?: boolean | null
          section_type: string
          sort_order?: number | null
          stats?: Json | null
          subtitle?: string | null
          team_member?: Json | null
          title?: string | null
          updated_at?: string | null
          value_item?: Json | null
        }
        Update: {
          background_image_url?: string | null
          color_scheme?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          is_published?: boolean | null
          section_type?: string
          sort_order?: number | null
          stats?: Json | null
          subtitle?: string | null
          team_member?: Json | null
          title?: string | null
          updated_at?: string | null
          value_item?: Json | null
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_id: string
          designer_id: string
          ended_at: string | null
          id: string
          session_id: string
          session_type: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_id: string
          designer_id: string
          ended_at?: string | null
          id?: string
          session_id: string
          session_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string
          designer_id?: string
          ended_at?: string | null
          id?: string
          session_id?: string
          session_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "active_sessions_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_availability"
            referencedColumns: ["designer_id"]
          },
          {
            foreignKeyName: "active_sessions_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          description: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          description: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_earnings: {
        Row: {
          commission_amount: number
          commission_type: string
          commission_value: number
          created_at: string | null
          customer_id: string | null
          designer_id: string | null
          id: string
          original_amount: number
          session_id: string | null
          transaction_id: string
        }
        Insert: {
          commission_amount: number
          commission_type: string
          commission_value: number
          created_at?: string | null
          customer_id?: string | null
          designer_id?: string | null
          id?: string
          original_amount: number
          session_id?: string | null
          transaction_id: string
        }
        Update: {
          commission_amount?: number
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          customer_id?: string | null
          designer_id?: string | null
          id?: string
          original_amount?: number
          session_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_earnings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_earnings_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_wallet: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          read_count: number | null
          scheduled_for: string | null
          sent_count: number | null
          target: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          read_count?: number | null
          scheduled_for?: string | null
          sent_count?: number | null
          target?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          read_count?: number | null
          scheduled_for?: string | null
          sent_count?: number | null
          target?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          account_type: string | null
          bank_name: string
          created_at: string
          id: string
          ifsc_code: string
          is_primary: boolean | null
          is_verified: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          account_type?: string | null
          bank_name: string
          created_at?: string
          id?: string
          ifsc_code: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          created_at?: string
          id?: string
          ifsc_code?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_keywords: string[] | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          channel_name: string | null
          created_at: string
          customer_id: string
          description: string | null
          designer_id: string
          duration_hours: number
          id: string
          requirements: string | null
          scheduled_date: string
          service: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          designer_id: string
          duration_hours?: number
          id?: string
          requirements?: string | null
          scheduled_date: string
          service: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          designer_id?: string
          duration_hours?: number
          id?: string
          requirements?: string | null
          scheduled_date?: string
          service?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_availability"
            referencedColumns: ["designer_id"]
          },
          {
            foreignKeyName: "bookings_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_settings: {
        Row: {
          commission_type: string
          commission_value: number
          created_at: string | null
          id: string
          is_active: boolean
          max_transaction_amount: number | null
          min_transaction_amount: number
          updated_at: string | null
        }
        Insert: {
          commission_type: string
          commission_value: number
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_transaction_amount?: number | null
          min_transaction_amount?: number
          updated_at?: string | null
        }
        Update: {
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_transaction_amount?: number | null
          min_transaction_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_page_content: {
        Row: {
          action_text: string | null
          address_heading: string | null
          booking_heading: string | null
          booking_url: string | null
          color_scheme: string | null
          contact_info: string | null
          content: string | null
          created_at: string | null
          description: string | null
          hours_heading: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          map_embed_url: string | null
          office_address: string | null
          office_hours: string | null
          parking_heading: string | null
          parking_info: string | null
          public_transport: string | null
          section_type: string
          sort_order: number | null
          title: string | null
          transport_heading: string | null
          updated_at: string | null
        }
        Insert: {
          action_text?: string | null
          address_heading?: string | null
          booking_heading?: string | null
          booking_url?: string | null
          color_scheme?: string | null
          contact_info?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          hours_heading?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          map_embed_url?: string | null
          office_address?: string | null
          office_hours?: string | null
          parking_heading?: string | null
          parking_info?: string | null
          public_transport?: string | null
          section_type: string
          sort_order?: number | null
          title?: string | null
          transport_heading?: string | null
          updated_at?: string | null
        }
        Update: {
          action_text?: string | null
          address_heading?: string | null
          booking_heading?: string | null
          booking_url?: string | null
          color_scheme?: string | null
          contact_info?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          hours_heading?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          map_embed_url?: string | null
          office_address?: string | null
          office_hours?: string | null
          parking_heading?: string | null
          parking_info?: string | null
          public_transport?: string | null
          section_type?: string
          sort_order?: number | null
          title?: string | null
          transport_heading?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_keywords: string[] | null
          page_type: string
          sort_order: number | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          page_type: string
          sort_order?: number | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          page_type?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          message_type: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          designer_id: string
          id: string
          last_message_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          designer_id: string
          id?: string
          last_message_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          designer_id?: string
          id?: string
          last_message_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_designer_fk"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_availability"
            referencedColumns: ["designer_id"]
          },
          {
            foreignKeyName: "conversations_designer_fk"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_complaints: {
        Row: {
          admin_notes: string | null
          booking_id: string | null
          complaint_type: string
          created_at: string | null
          customer_id: string
          description: string
          designer_id: string
          file_id: string | null
          id: string
          priority: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_id?: string | null
          complaint_type: string
          created_at?: string | null
          customer_id: string
          description: string
          designer_id: string
          file_id?: string | null
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string | null
          complaint_type?: string
          created_at?: string | null
          customer_id?: string
          description?: string
          designer_id?: string
          file_id?: string | null
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_complaints_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "session_files"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_activity: {
        Row: {
          activity_status: string
          created_at: string | null
          designer_id: string
          id: string
          is_online: boolean | null
          last_seen: string | null
          updated_at: string | null
        }
        Insert: {
          activity_status?: string
          created_at?: string | null
          designer_id: string
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_status?: string
          created_at?: string | null
          designer_id?: string
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      designer_availability_settings: {
        Row: {
          auto_accept_bookings: boolean
          buffer_time_minutes: number
          created_at: string
          designer_id: string
          id: string
          updated_at: string
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          auto_accept_bookings?: boolean
          buffer_time_minutes?: number
          created_at?: string
          designer_id: string
          id?: string
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          auto_accept_bookings?: boolean
          buffer_time_minutes?: number
          created_at?: string
          designer_id?: string
          id?: string
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      designer_special_days: {
        Row: {
          created_at: string
          date: string
          designer_id: string
          end_time: string | null
          id: string
          is_available: boolean
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          designer_id: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          designer_id?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      designer_weekly_schedule: {
        Row: {
          created_at: string
          day_of_week: number
          designer_id: string
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          designer_id: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          designer_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      designers: {
        Row: {
          available_for_urgent: boolean | null
          average_rating: number | null
          bio: string | null
          completion_rate: number | null
          created_at: string
          display_hourly_rate: boolean | null
          experience_years: number | null
          hourly_rate: number
          id: string
          is_online: boolean | null
          location: string | null
          portfolio_images: string[] | null
          rating: number | null
          response_time: string | null
          reviews_count: number | null
          skills: string[] | null
          specialty: string
          total_reviews: number | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          available_for_urgent?: boolean | null
          average_rating?: number | null
          bio?: string | null
          completion_rate?: number | null
          created_at?: string
          display_hourly_rate?: boolean | null
          experience_years?: number | null
          hourly_rate?: number
          id?: string
          is_online?: boolean | null
          location?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          response_time?: string | null
          reviews_count?: number | null
          skills?: string[] | null
          specialty: string
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          available_for_urgent?: boolean | null
          average_rating?: number | null
          bio?: string | null
          completion_rate?: number | null
          created_at?: string
          display_hourly_rate?: boolean | null
          experience_years?: number | null
          hourly_rate?: number
          id?: string
          is_online?: boolean | null
          location?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          response_time?: string | null
          reviews_count?: number | null
          skills?: string[] | null
          specialty?: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "designers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      file_reviews: {
        Row: {
          action: string
          created_at: string | null
          file_id: string
          id: string
          notes: string | null
          reviewer_id: string
          reviewer_type: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          file_id: string
          id?: string
          notes?: string | null
          reviewer_id: string
          reviewer_type: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          file_id?: string
          id?: string
          notes?: string | null
          reviewer_id?: string
          reviewer_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_reviews_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "session_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          hsn_code: string | null
          id: string
          invoice_id: string
          item_name: string
          quantity: number | null
          tax_rate: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          invoice_id: string
          item_name: string
          quantity?: number | null
          tax_rate?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          item_name?: string
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          cgst_rate: number | null
          created_at: string | null
          id: string
          igst_rate: number | null
          is_active: boolean | null
          sgst_rate: number | null
          state_code: string
          state_name: string
          updated_at: string | null
        }
        Insert: {
          cgst_rate?: number | null
          created_at?: string | null
          id?: string
          igst_rate?: number | null
          is_active?: boolean | null
          sgst_rate?: number | null
          state_code: string
          state_name: string
          updated_at?: string | null
        }
        Update: {
          cgst_rate?: number | null
          created_at?: string | null
          id?: string
          igst_rate?: number | null
          is_active?: boolean | null
          sgst_rate?: number | null
          state_code?: string
          state_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_templates: {
        Row: {
          admin_commission_rate: number | null
          background_color: string | null
          bank_details: Json | null
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string
          company_phone: string | null
          company_website: string | null
          created_at: string | null
          created_by: string | null
          footer_text: string | null
          gst_number: string | null
          hsn_code: string | null
          id: string
          invoice_postfix: string | null
          invoice_prefix: string | null
          invoice_type: string | null
          is_active: boolean | null
          pan_number: string | null
          template_name: string
          terms_conditions: string | null
          updated_at: string | null
          yearly_reset: boolean | null
        }
        Insert: {
          admin_commission_rate?: number | null
          background_color?: string | null
          bank_details?: Json | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          created_by?: string | null
          footer_text?: string | null
          gst_number?: string | null
          hsn_code?: string | null
          id?: string
          invoice_postfix?: string | null
          invoice_prefix?: string | null
          invoice_type?: string | null
          is_active?: boolean | null
          pan_number?: string | null
          template_name: string
          terms_conditions?: string | null
          updated_at?: string | null
          yearly_reset?: boolean | null
        }
        Update: {
          admin_commission_rate?: number | null
          background_color?: string | null
          bank_details?: Json | null
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          created_by?: string | null
          footer_text?: string | null
          gst_number?: string | null
          hsn_code?: string | null
          id?: string
          invoice_postfix?: string | null
          invoice_prefix?: string | null
          invoice_type?: string | null
          is_active?: boolean | null
          pan_number?: string | null
          template_name?: string
          terms_conditions?: string | null
          updated_at?: string | null
          yearly_reset?: boolean | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          designer_id: string | null
          due_date: string | null
          hsn_code: string | null
          id: string
          invoice_number: string
          invoice_type: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          place_of_supply: string | null
          session_duration: number | null
          session_id: string
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_details: Json | null
          template_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          designer_id?: string | null
          due_date?: string | null
          hsn_code?: string | null
          id?: string
          invoice_number: string
          invoice_type: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          place_of_supply?: string | null
          session_duration?: number | null
          session_id: string
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          tax_details?: Json | null
          template_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          designer_id?: string | null
          due_date?: string | null
          hsn_code?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          place_of_supply?: string | null
          session_duration?: number | null
          session_id?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_details?: Json | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      live_session_requests: {
        Row: {
          created_at: string | null
          customer_id: string
          designer_id: string
          id: string
          message: string
          rejection_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          designer_id: string
          id?: string
          message: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          designer_id?: string
          id?: string
          message?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_session_requests_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_availability"
            referencedColumns: ["designer_id"]
          },
          {
            foreignKeyName: "live_session_requests_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      logo_management: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_type: string
          logo_url: string
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_type: string
          logo_url: string
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_type?: string
          logo_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          file_url: string | null
          id: string
          message_type: string | null
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string | null
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_date: string | null
          payment_method: string
          session_id: string
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method: string
          session_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string
          session_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          default_currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          default_currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          default_currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_platform_settings_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          category: string | null
          client: string | null
          created_at: string
          description: string | null
          designer_id: string
          id: string
          image_url: string
          is_active: boolean
          project_link: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string | null
          client?: string | null
          created_at?: string
          description?: string | null
          designer_id: string
          id?: string
          image_url: string
          is_active?: boolean
          project_link?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string | null
          client?: string | null
          created_at?: string
          description?: string | null
          designer_id?: string
          id?: string
          image_url?: string
          is_active?: boolean
          project_link?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_availability"
            referencedColumns: ["designer_id"]
          },
          {
            foreignKeyName: "portfolio_items_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_policy_content: {
        Row: {
          card_items: Json | null
          content: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          section_type: string
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          card_items?: Json | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          section_type: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          card_items?: Json | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          section_type?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          location: string | null
          phone: string | null
          rate_per_minute: number | null
          role: string | null
          specialization: string | null
          updated_at: string
          user_id: string
          user_type: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          location?: string | null
          phone?: string | null
          rate_per_minute?: number | null
          role?: string | null
          specialization?: string | null
          updated_at?: string
          user_id: string
          user_type: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          location?: string | null
          phone?: string | null
          rate_per_minute?: number | null
          role?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          website?: string | null
        }
        Relationships: []
      }
      service_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          service_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          service_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          created_at: string
          delivery_time_days: number
          description: string | null
          features: string[]
          id: string
          price: number
          revisions: number
          service_id: string
          tier: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_time_days: number
          description?: string | null
          features?: string[]
          id?: string
          price: number
          revisions?: number
          service_id: string
          tier: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_time_days?: number
          description?: string | null
          features?: string[]
          id?: string
          price?: number
          revisions?: number
          service_id?: string
          tier?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          currency: string
          delivery_time_days: number
          description: string | null
          designer_id: string
          gallery_urls: string[]
          id: string
          is_active: boolean
          price: number
          rating: number
          reviews_count: number
          revisions: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          delivery_time_days?: number
          description?: string | null
          designer_id: string
          gallery_urls?: string[]
          id?: string
          is_active?: boolean
          price: number
          rating?: number
          reviews_count?: number
          revisions?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          delivery_time_days?: number
          description?: string | null
          designer_id?: string
          gallery_urls?: string[]
          id?: string
          is_active?: boolean
          price?: number
          rating?: number
          reviews_count?: number
          revisions?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_designer_fk"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designer_availability"
            referencedColumns: ["designer_id"]
          },
          {
            foreignKeyName: "services_designer_fk"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      session_approval_requests: {
        Row: {
          created_at: string | null
          customer_id: string
          designer_id: string
          file_downloaded_at: string | null
          file_uploaded_at: string | null
          id: string
          payment_id: string | null
          review_id: string | null
          session_id: string
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          designer_id: string
          file_downloaded_at?: string | null
          file_uploaded_at?: string | null
          id?: string
          payment_id?: string | null
          review_id?: string | null
          session_id: string
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          designer_id?: string
          file_downloaded_at?: string | null
          file_uploaded_at?: string | null
          id?: string
          payment_id?: string | null
          review_id?: string | null
          session_id?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_approval_requests_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_approval_requests_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "session_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      session_files: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_id: string | null
          created_at: string | null
          file_size: number
          file_type: string
          file_url: string
          id: string
          name: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_id: string | null
          session_id: string
          status: string
          updated_at: string | null
          uploaded_by: string
          uploaded_by_id: string | null
          uploaded_by_type: string
          work_description: string | null
          work_status: string | null
          work_type: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          created_at?: string | null
          file_size: number
          file_type: string
          file_url: string
          id?: string
          name: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_id?: string | null
          session_id: string
          status?: string
          updated_at?: string | null
          uploaded_by: string
          uploaded_by_id?: string | null
          uploaded_by_type: string
          work_description?: string | null
          work_status?: string | null
          work_type?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string | null
          created_at?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          name?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_id?: string | null
          session_id?: string
          status?: string
          updated_at?: string | null
          uploaded_by?: string
          uploaded_by_id?: string | null
          uploaded_by_type?: string
          work_description?: string | null
          work_status?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_files_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "session_files_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_invoice_messages: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          message_id: string | null
          session_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          session_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_invoice_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_invoice_messages_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "session_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_invoice_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      session_invoices: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_name: string
          designer_name: string
          duration_minutes: number
          gst_amount: number
          id: string
          invoice_date: string
          rate_per_minute: number
          session_id: string
          status: string
          subtotal: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_name: string
          designer_name: string
          duration_minutes: number
          gst_amount: number
          id?: string
          invoice_date: string
          rate_per_minute: number
          session_id: string
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_name?: string
          designer_name?: string
          duration_minutes?: number
          gst_amount?: number
          id?: string
          invoice_date?: string
          rate_per_minute?: number
          session_id?: string
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      session_messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          sender_id: string | null
          sender_name: string
          sender_type: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_name: string
          sender_type: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_name?: string
          sender_type?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_reviews: {
        Row: {
          created_at: string | null
          customer_id: string
          designer_name: string
          id: string
          rating: number
          review_date: string | null
          review_text: string | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          designer_name: string
          id?: string
          rating: number
          review_date?: string | null
          review_text?: string | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          designer_name?: string
          id?: string
          rating?: number
          review_date?: string | null
          review_text?: string | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_work_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          review_notes: string | null
          review_status: string
          reviewer_id: string
          reviewer_type: string
          session_id: string
          updated_at: string | null
          work_file_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          review_status: string
          reviewer_id: string
          reviewer_type: string
          session_id: string
          updated_at?: string | null
          work_file_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          review_status?: string
          reviewer_id?: string
          reviewer_type?: string
          session_id?: string
          updated_at?: string | null
          work_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_work_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_work_reviews_work_file_id_fkey"
            columns: ["work_file_id"]
            isOneToOne: false
            referencedRelation: "session_files"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_links: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          platform: string
          sort_order: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          sort_order?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          sort_order?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      success_stories_content: {
        Row: {
          achievements: Json | null
          category: string | null
          content: string | null
          created_at: string | null
          cta_data: Json | null
          description: string | null
          designer_data: Json | null
          duration: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          metrics: Json | null
          section_type: string
          sort_order: number | null
          stats_data: Json | null
          subtitle: string | null
          testimonial_data: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          achievements?: Json | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          cta_data?: Json | null
          description?: string | null
          designer_data?: Json | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          metrics?: Json | null
          section_type: string
          sort_order?: number | null
          stats_data?: Json | null
          subtitle?: string | null
          testimonial_data?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          achievements?: Json | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          cta_data?: Json | null
          description?: string | null
          designer_data?: Json | null
          duration?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          metrics?: Json | null
          section_type?: string
          sort_order?: number | null
          stats_data?: Json | null
          subtitle?: string | null
          testimonial_data?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_page_content: {
        Row: {
          card_data: Json | null
          content: string | null
          created_at: string | null
          description: string | null
          form_fields: Json | null
          id: string
          is_published: boolean | null
          section_type: string
          sort_order: number | null
          status_data: Json | null
          subtitle: string | null
          tab_name: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          card_data?: Json | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          form_fields?: Json | null
          id?: string
          is_published?: boolean | null
          section_type: string
          sort_order?: number | null
          status_data?: Json | null
          subtitle?: string | null
          tab_name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          card_data?: Json | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          form_fields?: Json | null
          id?: string
          is_published?: boolean | null
          section_type?: string
          sort_order?: number | null
          status_data?: Json | null
          subtitle?: string | null
          tab_name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_collections: {
        Row: {
          cgst_amount: number
          cgst_rate: number
          created_at: string | null
          id: string
          igst_amount: number
          igst_rate: number
          original_amount: number
          sgst_amount: number
          sgst_rate: number
          total_tax_amount: number
          transaction_id: string
          transaction_type: string
          user_id: string | null
          user_state: string
          user_state_code: string
        }
        Insert: {
          cgst_amount: number
          cgst_rate: number
          created_at?: string | null
          id?: string
          igst_amount: number
          igst_rate: number
          original_amount: number
          sgst_amount: number
          sgst_rate: number
          total_tax_amount: number
          transaction_id: string
          transaction_type: string
          user_id?: string | null
          user_state: string
          user_state_code: string
        }
        Update: {
          cgst_amount?: number
          cgst_rate?: number
          created_at?: string | null
          id?: string
          igst_amount?: number
          igst_rate?: number
          original_amount?: number
          sgst_amount?: number
          sgst_rate?: number
          total_tax_amount?: number
          transaction_id?: string
          transaction_type?: string
          user_id?: string | null
          user_state?: string
          user_state_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tds_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          tds_rate: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tds_rate?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tds_rate?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tds_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          booking_reminders: boolean
          created_at: string
          currency: string
          date_format: string
          id: string
          language: string
          message_notifications: boolean
          notifications_email: boolean
          notifications_marketing: boolean
          notifications_push: boolean
          notifications_sms: boolean
          privacy_activity_status: boolean
          privacy_contact_info_visible: boolean
          privacy_profile_visible: boolean
          security_login_alerts: boolean
          security_two_factor: boolean
          time_format: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_reminders?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          id?: string
          language?: string
          message_notifications?: boolean
          notifications_email?: boolean
          notifications_marketing?: boolean
          notifications_push?: boolean
          notifications_sms?: boolean
          privacy_activity_status?: boolean
          privacy_contact_info_visible?: boolean
          privacy_profile_visible?: boolean
          security_login_alerts?: boolean
          security_two_factor?: boolean
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_reminders?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          id?: string
          language?: string
          message_notifications?: boolean
          notifications_email?: boolean
          notifications_marketing?: boolean
          notifications_push?: boolean
          notifications_sms?: boolean
          privacy_activity_status?: boolean
          privacy_contact_info_visible?: boolean
          privacy_profile_visible?: boolean
          security_login_alerts?: boolean
          security_two_factor?: boolean
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      website_sections: {
        Row: {
          background_color: string | null
          content: string
          created_at: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          page: string
          section_name: string
          section_type: string
          sort_order: number | null
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          content: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          page: string
          section_name: string
          section_type: string
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          content?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          page?: string
          section_name?: string
          section_type?: string
          sort_order?: number | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      designer_availability: {
        Row: {
          activity_status: string | null
          designer_id: string | null
          is_available_for_live_session: boolean | null
          is_online: boolean | null
          last_seen: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      add_platform_earning: {
        Args: {
          p_amount: number
          p_description: string
          p_metadata?: Json
          p_reference_id?: string
          p_reference_type?: string
          p_transaction_type: string
        }
        Returns: string
      }
      check_sufficient_balance: {
        Args: { required_amount: number; user_uuid: string }
        Returns: boolean
      }
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      debug_designer_activity: {
        Args: { user_uuid: string }
        Returns: {
          activity_record: Json
          found_activity: boolean
          is_designer: boolean
          user_exists: boolean
        }[]
      }
      delete_invoice: {
        Args: { p_invoice_id: string }
        Returns: boolean
      }
      deliver_announcement_to_users: {
        Args: { p_announcement_id: string }
        Returns: number
      }
      expire_old_live_session_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invoice_number: {
        Args: { p_template_id?: string }
        Returns: string
      }
      generate_live_session_channel: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_recharge_invoice: {
        Args: {
          p_amount: number
          p_description?: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: string
      }
      generate_sample_invoices: {
        Args: Record<PropertyKey, never>
        Returns: {
          invoice_id: string
          invoice_number: string
        }[]
      }
      generate_session_invoices: {
        Args:
          | {
              p_amount: number
              p_booking_id?: string
              p_customer_id: string
              p_designer_id: string
              p_place_of_supply?: string
              p_session_duration?: number
              p_session_id: string
              p_template_id?: string
            }
          | {
              p_amount: number
              p_booking_id?: string
              p_customer_id: string
              p_designer_id: string
              p_session_id: string
              p_template_id?: string
            }
        Returns: {
          customer_invoice_id: string
          customer_invoice_number: string
          designer_invoice_id: string
          designer_invoice_number: string
        }[]
      }
      generate_wallet_invoice: {
        Args: {
          p_amount: number
          p_description: string
          p_template_id?: string
          p_transaction_id: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: {
          invoice_id: string
          invoice_number: string
        }[]
      }
      generate_wallet_recharge_invoice: {
        Args:
          | { p_amount: number; p_customer_id: string; p_template_id?: string }
          | {
              p_amount: number
              p_description: string
              p_template_id?: string
              p_transaction_id: string
              p_user_id: string
            }
        Returns: {
          invoice_id: string
          invoice_number: string
        }[]
      }
      generate_wallet_withdrawal_invoice: {
        Args:
          | {
              p_amount: number
              p_description: string
              p_template_id?: string
              p_transaction_id: string
              p_user_id: string
            }
          | { p_amount: number; p_designer_id: string; p_template_id?: string }
        Returns: {
          invoice_id: string
          invoice_number: string
        }[]
      }
      generate_withdrawal_invoice: {
        Args: {
          p_amount: number
          p_description?: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: string
      }
      get_admin_final_files: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          booking_id: string
          complaint_count: number
          customer_id: string
          customer_name: string
          designer_id: string
          designer_name: string
          file_id: string
          file_name: string
          file_size: number
          file_url: string
          has_complaints: boolean
          session_id: string
          uploaded_at: string
        }[]
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_earnings: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_earnings_history: {
        Args: { designer_user_id: string; limit_count?: number }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          status: string
        }[]
      }
      get_monthly_earnings: {
        Args: { designer_user_id: string; target_month?: string }
        Returns: number
      }
      get_platform_earnings_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          total_earnings: number
          total_gst_collected: number
          total_penalty_fees: number
          total_platform_fees: number
          transaction_count: number
        }[]
      }
      get_recent_transactions: {
        Args: { limit_count?: number; user_uuid: string }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          metadata: Json
          status: string
          transaction_type: string
        }[]
      }
      get_target_user_ids: {
        Args: { p_announcement_id: string; p_target: string }
        Returns: {
          user_id: string
        }[]
      }
      get_total_earnings: {
        Args: { designer_user_id: string }
        Returns: number
      }
      get_total_withdrawals: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_notifications: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string
          title: string
          type: string
        }[]
      }
      get_wallet_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_withdrawal_history: {
        Args: { limit_count?: number; user_uuid: string }
        Returns: {
          amount: number
          bank_details: Json
          created_at: string
          description: string
          id: string
          status: string
        }[]
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_designer_available_for_live_session: {
        Args: { designer_profile_id: string }
        Returns: boolean
      }
      is_designer_in_live_session: {
        Args: { designer_user_id: string }
        Returns: boolean
      }
      log_admin_activity: {
        Args: {
          p_action_type: string
          p_admin_id: string
          p_description: string
          p_metadata?: Json
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      process_admin_refund: {
        Args: {
          p_admin_id: string
          p_amount: number
          p_customer_id: string
          p_designer_id: string
          p_metadata?: Json
          p_reason: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: {
          message: string
          refund_id: string
          success: boolean
        }[]
      }
      send_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
