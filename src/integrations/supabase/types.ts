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
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
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
      contact_page_content: {
        Row: {
          action_text: string | null
          color_scheme: string | null
          contact_info: string | null
          content: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          section_type: string
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          action_text?: string | null
          color_scheme?: string | null
          contact_info?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          section_type: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          action_text?: string | null
          color_scheme?: string | null
          contact_info?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          section_type?: string
          sort_order?: number | null
          title?: string | null
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
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          available_for_urgent?: boolean | null
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
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          available_for_urgent?: boolean | null
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
      platform_settings: {
        Row: {
          commission_rate: number
          contact_phone: string | null
          created_at: string
          enable_analytics: boolean | null
          enable_live_sessions: boolean | null
          enable_notifications: boolean | null
          enable_two_factor_auth: boolean | null
          enable_wallet_system: boolean | null
          featured_designers_limit: number
          id: string
          maintenance_mode: boolean
          max_concurrent_sessions: number | null
          max_file_upload_size_mb: number | null
          maximum_withdrawal_amount: number | null
          minimum_withdrawal_amount: number | null
          new_registrations: boolean
          password_min_length: number | null
          platform_description: string | null
          platform_name: string | null
          require_email_verification: boolean | null
          require_phone_verification: boolean | null
          session_timeout_minutes: number | null
          singleton: boolean
          support_email: string | null
          tax_rate: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commission_rate?: number
          contact_phone?: string | null
          created_at?: string
          enable_analytics?: boolean | null
          enable_live_sessions?: boolean | null
          enable_notifications?: boolean | null
          enable_two_factor_auth?: boolean | null
          enable_wallet_system?: boolean | null
          featured_designers_limit?: number
          id?: string
          maintenance_mode?: boolean
          max_concurrent_sessions?: number | null
          max_file_upload_size_mb?: number | null
          maximum_withdrawal_amount?: number | null
          minimum_withdrawal_amount?: number | null
          new_registrations?: boolean
          password_min_length?: number | null
          platform_description?: string | null
          platform_name?: string | null
          require_email_verification?: boolean | null
          require_phone_verification?: boolean | null
          session_timeout_minutes?: number | null
          singleton?: boolean
          support_email?: string | null
          tax_rate?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commission_rate?: number
          contact_phone?: string | null
          created_at?: string
          enable_analytics?: boolean | null
          enable_live_sessions?: boolean | null
          enable_notifications?: boolean | null
          enable_two_factor_auth?: boolean | null
          enable_wallet_system?: boolean | null
          featured_designers_limit?: number
          id?: string
          maintenance_mode?: boolean
          max_concurrent_sessions?: number | null
          max_file_upload_size_mb?: number | null
          maximum_withdrawal_amount?: number | null
          minimum_withdrawal_amount?: number | null
          new_registrations?: boolean
          password_min_length?: number | null
          platform_description?: string | null
          platform_name?: string | null
          require_email_verification?: boolean | null
          require_phone_verification?: boolean | null
          session_timeout_minutes?: number | null
          singleton?: boolean
          support_email?: string | null
          tax_rate?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      expire_old_live_session_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_live_session_channel: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_total_withdrawals: {
        Args: { user_uuid: string }
        Returns: number
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
