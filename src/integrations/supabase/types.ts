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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          notes: string | null
          role: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          notes?: string | null
          role?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          notes?: string | null
          role?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_memberships: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_by: string | null
          notes: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          notes?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          notes?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_role_audit: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string | null
          id: number
          notes: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string | null
          id?: number
          notes?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string | null
          id?: number
          notes?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string | null
          criteria_type: string
          criteria_value: number
          description: string
          display_name: string
          emoji: string
          id: string
          is_active: boolean | null
          name: string
          tier: Database["public"]["Enums"]["badge_tier"]
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at?: string | null
          criteria_type: string
          criteria_value: number
          description: string
          display_name: string
          emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          tier: Database["public"]["Enums"]["badge_tier"]
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string | null
          criteria_type?: string
          criteria_value?: number
          description?: string
          display_name?: string
          emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          tier?: Database["public"]["Enums"]["badge_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      caddie_logs: {
        Row: {
          audio_url: string | null
          content: string
          course_name: string | null
          created_at: string
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          tags: string[] | null
          transcription: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          course_name?: string | null
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          tags?: string[] | null
          transcription?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          course_name?: string | null
          created_at?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          tags?: string[] | null
          transcription?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_feedback: {
        Row: {
          attachments: Json | null
          author: string
          coach_id: string
          created_at: string
          id: string
          message: string
          share_id: string
        }
        Insert: {
          attachments?: Json | null
          author?: string
          coach_id: string
          created_at?: string
          id?: string
          message: string
          share_id: string
        }
        Update: {
          attachments?: Json | null
          author?: string
          coach_id?: string
          created_at?: string
          id?: string
          message?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_coach_feedback_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coach_feedback_share"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "swing_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          pricing_note: string | null
          region_code: string
          specialties: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          pricing_note?: string | null
          region_code: string
          specialties?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          pricing_note?: string | null
          region_code?: string
          specialties?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_regions: {
        Row: {
          country: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          region_code: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          region_code: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          region_code?: string
        }
        Relationships: []
      }
      coach_service_areas: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          lat: number
          lng: number
          radius_km: number | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          lat: number
          lng: number
          radius_km?: number | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          lat?: number
          lng?: number
          radius_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_service_areas_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          academy: string | null
          active: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          price_max: number | null
          price_min: number | null
          region: string | null
          specialties: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academy?: string | null
          active?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          price_max?: number | null
          price_min?: number | null
          region?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academy?: string | null
          active?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          price_max?: number | null
          price_min?: number | null
          region?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          conversation_type: string
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_type?: string
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_type?: string
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      country_flags: {
        Row: {
          country_code: string
          created_at: string
          file_name: string
          flag_url: string
          id: string
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          file_name: string
          flag_url: string
          id?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          file_name?: string
          flag_url?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_media: {
        Row: {
          course_id: string
          created_at: string
          file_name: string
          id: string
          media_type: string
          media_url: string
          rating_id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_name: string
          id?: string
          media_type: string
          media_url: string
          rating_id: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_name?: string
          id?: string
          media_type?: string
          media_url?: string
          rating_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_media_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_media_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          helpful_count: number | null
          id: string
          rating: number
          review: string | null
          review_date: string | null
          unhelpful_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          rating: number
          review?: string | null
          review_date?: string | null
          unhelpful_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          rating?: number
          review?: string | null
          review_date?: string | null
          unhelpful_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_review_media: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          media_type: string
          media_url: string
          poster_url: string | null
          review_id: string
          stream_id: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          media_url: string
          poster_url?: string | null
          review_id: string
          stream_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          media_url?: string
          poster_url?: string | null
          review_id?: string
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_events: {
        Row: {
          created_at: string
          id: string
          name: string
          props: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          props?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          props?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      echo_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_history_enriched"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "echo_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_shares: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          revoked_at: string | null
          thread_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          thread_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          revoked_at?: string | null
          thread_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_shares_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_history_enriched"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "echo_shares_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          name_norm: string | null
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_norm?: string | null
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_norm?: string | null
          owner_id?: string
        }
        Relationships: []
      }
      echo_thread_tags: {
        Row: {
          created_at: string
          tag_id: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          thread_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_thread_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "echo_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_thread_tags_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_history_enriched"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "echo_thread_tags_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_threads: {
        Row: {
          assistant_text_concat: string | null
          created_at: string
          first_user_question: string | null
          has_response: boolean | null
          id: string
          is_starred: boolean
          last_activity_at: string | null
          message_count: number | null
          tsv: unknown
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_text_concat?: string | null
          created_at?: string
          first_user_question?: string | null
          has_response?: boolean | null
          id?: string
          is_starred?: boolean
          last_activity_at?: string | null
          message_count?: number | null
          tsv?: unknown
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_text_concat?: string | null
          created_at?: string
          first_user_question?: string | null
          has_response?: boolean | null
          id?: string
          is_starred?: boolean
          last_activity_at?: string | null
          message_count?: number | null
          tsv?: unknown
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          game_id: string
          id: string
          requester_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          game_id: string
          id?: string
          requester_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          game_id?: string
          id?: string
          requester_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          added_by_user_id: string | null
          created_at: string
          game_id: string
          guest_name: string | null
          id: string
          joined_at: string | null
          reserves_slot: boolean
          role: string
          state: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          created_at?: string
          game_id: string
          guest_name?: string | null
          id?: string
          joined_at?: string | null
          reserves_slot?: boolean
          role?: string
          state?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          created_at?: string
          game_id?: string
          guest_name?: string | null
          id?: string
          joined_at?: string | null
          reserves_slot?: boolean
          role?: string
          state?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_thread_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_system: boolean
          sender_id: string
          text: string
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_system?: boolean
          sender_id: string
          text: string
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_system?: boolean
          sender_id?: string
          text?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_thread_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "game_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      game_thread_participants: {
        Row: {
          id: string
          joined_at: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "game_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      game_threads: {
        Row: {
          created_at: string
          expires_at: string
          game_id: string
          grace_hours: number
          id: string
          is_closed: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          game_id: string
          grace_hours?: number
          id?: string
          is_closed?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          game_id?: string
          grace_hours?: number
          id?: string
          is_closed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_threads_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          course_id: string | null
          course_name: string | null
          course_name_normalized: string | null
          created_at: string
          expires_at: string
          host_user_id: string
          id: string
          lat: number | null
          lng: number | null
          note: string | null
          players_needed: number | null
          slots_open: number
          slots_total: number
          start_time: string
          status: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          course_id?: string | null
          course_name?: string | null
          course_name_normalized?: string | null
          created_at?: string
          expires_at: string
          host_user_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          players_needed?: number | null
          slots_open?: number
          slots_total?: number
          start_time?: string
          status?: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          course_id?: string | null
          course_name?: string | null
          course_name_normalized?: string | null
          created_at?: string
          expires_at?: string
          host_user_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          players_needed?: number | null
          slots_open?: number
          slots_total?: number
          start_time?: string
          status?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_beacons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_courses: {
        Row: {
          continent: Database["public"]["Enums"]["continent"]
          country: string
          country_rank: number | null
          created_at: string
          description: string | null
          global_rank: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string | null
          regional_rank: number | null
          sub_country: string | null
          thumbnail_image: string | null
          top100_url: string | null
          updated_at: string
          usa_rank: number | null
          website_url: string | null
        }
        Insert: {
          continent: Database["public"]["Enums"]["continent"]
          country: string
          country_rank?: number | null
          created_at?: string
          description?: string | null
          global_rank?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region?: string | null
          regional_rank?: number | null
          sub_country?: string | null
          thumbnail_image?: string | null
          top100_url?: string | null
          updated_at?: string
          usa_rank?: number | null
          website_url?: string | null
        }
        Update: {
          continent?: Database["public"]["Enums"]["continent"]
          country?: string
          country_rank?: number | null
          created_at?: string
          description?: string | null
          global_rank?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string | null
          regional_rank?: number | null
          sub_country?: string | null
          thumbnail_image?: string | null
          top100_url?: string | null
          updated_at?: string
          usa_rank?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      invite_requests: {
        Row: {
          club: string | null
          created_at: string | null
          email: string
          id: string
          ip_hash: string | null
          name: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          club?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_hash?: string | null
          name?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          club?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_hash?: string | null
          name?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          created_at: string
          game_id: string
          id: string
          requester_id: string
          state: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          requester_id: string
          state?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          requester_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      logos: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          link: string
          pub_date: string | null
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link: string
          pub_date?: string | null
          source: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string
          pub_date?: string | null
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ping_matches: {
        Row: {
          created_at: string
          dm_thread_id: string | null
          id: string
          participant_ids: string[]
          ping_id: string
        }
        Insert: {
          created_at?: string
          dm_thread_id?: string | null
          id?: string
          participant_ids: string[]
          ping_id: string
        }
        Update: {
          created_at?: string
          dm_thread_id?: string | null
          id?: string
          participant_ids?: string[]
          ping_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ping_matches_ping_id_fkey"
            columns: ["ping_id"]
            isOneToOne: false
            referencedRelation: "pings"
            referencedColumns: ["id"]
          },
        ]
      }
      ping_responses: {
        Row: {
          created_at: string
          id: string
          message: string | null
          ping_id: string
          responder_id: string
          state: Database["public"]["Enums"]["ping_response_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          ping_id: string
          responder_id: string
          state?: Database["public"]["Enums"]["ping_response_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          ping_id?: string
          responder_id?: string
          state?: Database["public"]["Enums"]["ping_response_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ping_responses_ping_id_fkey"
            columns: ["ping_id"]
            isOneToOne: false
            referencedRelation: "pings"
            referencedColumns: ["id"]
          },
        ]
      }
      pings: {
        Row: {
          club_id: string | null
          created_at: string
          creator_id: string
          expires_at: string
          format: Database["public"]["Enums"]["ping_format"]
          id: string
          is_anonymous: boolean
          lat: number | null
          lng: number | null
          note: string | null
          players_needed: number
          status: Database["public"]["Enums"]["ping_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["ping_visibility"]
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          creator_id: string
          expires_at: string
          format: Database["public"]["Enums"]["ping_format"]
          id?: string
          is_anonymous?: boolean
          lat?: number | null
          lng?: number | null
          note?: string | null
          players_needed?: number
          status?: Database["public"]["Enums"]["ping_status"]
          updated_at?: string
          visibility: Database["public"]["Enums"]["ping_visibility"]
        }
        Update: {
          club_id?: string | null
          created_at?: string
          creator_id?: string
          expires_at?: string
          format?: Database["public"]["Enums"]["ping_format"]
          id?: string
          is_anonymous?: boolean
          lat?: number | null
          lng?: number | null
          note?: string | null
          players_needed?: number
          status?: Database["public"]["Enums"]["ping_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["ping_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "pings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          aspect_ratio: number | null
          created_at: string
          duration_ms: number | null
          duration_seconds: number | null
          exif: Json | null
          height: number | null
          id: string
          image_orientation: string | null
          media_height: number | null
          media_type: string
          media_url: string
          media_width: number | null
          orientation: string | null
          post_id: string
          poster_url: string | null
          stream_id: string | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string
          duration_ms?: number | null
          duration_seconds?: number | null
          exif?: Json | null
          height?: number | null
          id?: string
          image_orientation?: string | null
          media_height?: number | null
          media_type: string
          media_url: string
          media_width?: number | null
          orientation?: string | null
          post_id: string
          poster_url?: string | null
          stream_id?: string | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string
          duration_ms?: number | null
          duration_seconds?: number | null
          exif?: Json | null
          height?: number | null
          id?: string
          image_orientation?: string | null
          media_height?: number | null
          media_type?: string
          media_url?: string
          media_width?: number | null
          orientation?: string | null
          post_id?: string
          poster_url?: string | null
          stream_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string
          end_index: number
          id: string
          post_id: string
          start_index: number
          tagged_entity_id: string
        }
        Insert: {
          created_at?: string
          end_index: number
          id?: string
          post_id: string
          start_index: number
          tagged_entity_id: string
        }
        Update: {
          created_at?: string
          end_index?: number
          id?: string
          post_id?: string
          start_index?: number
          tagged_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tagged_entity_id_fkey"
            columns: ["tagged_entity_id"]
            isOneToOne: false
            referencedRelation: "taggable_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pro_ai_analyses: {
        Row: {
          analysis_results: Json
          created_at: string
          id: string
          session_id: string | null
          swing_context: string | null
          thread_id: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          analysis_results?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          swing_context?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          analysis_results?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          swing_context?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_ai_analyses_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_history_enriched"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "pro_ai_analyses_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_immersive_telemetry: {
        Row: {
          created_at: string | null
          device_type: string | null
          duration_ms: number | null
          event_type: string
          id: string
          media_index: number | null
          metadata: Json | null
          session_id: string | null
          user_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          media_index?: number | null
          metadata?: Json | null
          session_id?: string | null
          user_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          media_index?: number | null
          metadata?: Json | null
          session_id?: string | null
          user_id?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profile_media: {
        Row: {
          aspect_ratio: number | null
          created_at: string
          display_order: number
          duration: number | null
          file_name: string | null
          file_size: number | null
          header_extended_url: string | null
          header_metadata: Json | null
          header_processing_error: string | null
          header_processing_status: string | null
          header_strip_url: string | null
          id: string
          is_immersive: boolean | null
          media_type: string
          media_url: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_method: string | null
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string
          display_order?: number
          duration?: number | null
          file_name?: string | null
          file_size?: number | null
          header_extended_url?: string | null
          header_metadata?: Json | null
          header_processing_error?: string | null
          header_processing_status?: string | null
          header_strip_url?: string | null
          id?: string
          is_immersive?: boolean | null
          media_type: string
          media_url: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_method?: string | null
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string
          display_order?: number
          duration?: number | null
          file_name?: string | null
          file_size?: number | null
          header_extended_url?: string | null
          header_metadata?: Json | null
          header_processing_error?: string | null
          header_processing_status?: string | null
          header_strip_url?: string | null
          id?: string
          is_immersive?: boolean | null
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_method?: string | null
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      site_gate_attempts: {
        Row: {
          fail_count: number
          ip: string
          last_failed_at: string | null
        }
        Insert: {
          fail_count?: number
          ip: string
          last_failed_at?: string | null
        }
        Update: {
          fail_count?: number
          ip?: string
          last_failed_at?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      swing_coach_outreach: {
        Row: {
          city: string | null
          consented_at: string | null
          country: string | null
          created_at: string | null
          first_name_only: boolean | null
          focus: string | null
          id: string
          lat: number | null
          lng: number | null
          mask_precise_location: boolean | null
          price_max: number | null
          price_min: number | null
          radius_km: number | null
          region: string | null
          share_analysis_text: boolean | null
          share_video: boolean | null
          status: string | null
          swing_analysis_id: string
          terms_version: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          consented_at?: string | null
          country?: string | null
          created_at?: string | null
          first_name_only?: boolean | null
          focus?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mask_precise_location?: boolean | null
          price_max?: number | null
          price_min?: number | null
          radius_km?: number | null
          region?: string | null
          share_analysis_text?: boolean | null
          share_video?: boolean | null
          status?: string | null
          swing_analysis_id: string
          terms_version?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          consented_at?: string | null
          country?: string | null
          created_at?: string | null
          first_name_only?: boolean | null
          focus?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mask_precise_location?: boolean | null
          price_max?: number | null
          price_min?: number | null
          radius_km?: number | null
          region?: string | null
          share_analysis_text?: boolean | null
          share_video?: boolean | null
          status?: string | null
          swing_analysis_id?: string
          terms_version?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      swing_coach_outreach_targets: {
        Row: {
          accepted_at: string | null
          coach_id: string
          created_at: string | null
          declined_at: string | null
          id: string
          notified_at: string | null
          outreach_id: string
        }
        Insert: {
          accepted_at?: string | null
          coach_id: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          notified_at?: string | null
          outreach_id: string
        }
        Update: {
          accepted_at?: string | null
          coach_id?: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          notified_at?: string | null
          outreach_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swing_coach_outreach_targets_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swing_coach_outreach_targets_outreach_id_fkey"
            columns: ["outreach_id"]
            isOneToOne: false
            referencedRelation: "swing_coach_outreach"
            referencedColumns: ["id"]
          },
        ]
      }
      swing_phase_results: {
        Row: {
          confidence: number | null
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          metrics: Json
          phase: string
          session_id: string
          started_at: string | null
          status: string
          tips: Json
          used_frame_index: number | null
          visual_plan: Json
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          metrics?: Json
          phase: string
          session_id: string
          started_at?: string | null
          status?: string
          tips?: Json
          used_frame_index?: number | null
          visual_plan?: Json
        }
        Update: {
          confidence?: number | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          metrics?: Json
          phase?: string
          session_id?: string
          started_at?: string | null
          status?: string
          tips?: Json
          used_frame_index?: number | null
          visual_plan?: Json
        }
        Relationships: []
      }
      swing_sessions: {
        Row: {
          created_at: string
          expires_at: string
          frames: Json
          id: string
          status: string
          updated_at: string
          upload_id: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          frames?: Json
          id?: string
          status?: string
          updated_at?: string
          upload_id?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          frames?: Json
          id?: string
          status?: string
          updated_at?: string
          upload_id?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      swing_shares: {
        Row: {
          access_token: string | null
          analysis_id: string
          coach_id: string
          consent_flags: Json
          created_at: string
          id: string
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          analysis_id: string
          coach_id: string
          consent_flags?: Json
          created_at?: string
          id?: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          analysis_id?: string
          coach_id?: string
          consent_flags?: Json
          created_at?: string
          id?: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_swing_shares_analysis"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "pro_ai_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_swing_shares_coach"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swing_visuals: {
        Row: {
          analysis_id: string
          created_at: string
          frame_index: number
          height: number
          id: string
          label: string
          overlay: Json
          updated_at: string
          url: string
          width: number
        }
        Insert: {
          analysis_id: string
          created_at?: string
          frame_index: number
          height: number
          id?: string
          label: string
          overlay?: Json
          updated_at?: string
          url: string
          width: number
        }
        Update: {
          analysis_id?: string
          created_at?: string
          frame_index?: number
          height?: number
          id?: string
          label?: string
          overlay?: Json
          updated_at?: string
          url?: string
          width?: number
        }
        Relationships: []
      }
      taggable_entities: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          name: string
          profile_image_url: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          name: string
          profile_image_url?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          name?: string
          profile_image_url?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_data: Json
          achievement_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_data: Json
          achievement_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json
          achievement_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badge_pins: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          pinned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          pinned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          pinned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badge_pins_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string | null
          earned_at: string | null
          id: string
          is_notified: boolean | null
          progress_value: number | null
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          is_notified?: boolean | null
          progress_value?: number | null
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          is_notified?: boolean | null
          progress_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bag: {
        Row: {
          brand: string
          created_at: string | null
          id: string
          image_url: string | null
          model: string | null
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bag_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bag_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_tracker: {
        Row: {
          checked: boolean | null
          course_id: string | null
          created_at: string | null
          id: string
          played_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          checked?: boolean | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          played_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          checked?: boolean | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          played_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_course_tracker_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string | null
          played: boolean | null
          played_date: string | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          played?: boolean | null
          played_date?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          played?: boolean | null
          played_date?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_nearby_status: {
        Row: {
          created_at: string
          id: string
          is_hidden: boolean
          last_location_update: string | null
          last_seen_at: string | null
          lat: number | null
          lng: number | null
          location: unknown
          open_to_play: boolean | null
          open_to_play_active: boolean | null
          open_to_play_expires_at: string | null
          updated_at: string
          user_id: string
          visibility_mode: string | null
          visible_nearby: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          last_location_update?: string | null
          last_seen_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          open_to_play?: boolean | null
          open_to_play_active?: boolean | null
          open_to_play_expires_at?: string | null
          updated_at?: string
          user_id: string
          visibility_mode?: string | null
          visible_nearby?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          last_location_update?: string | null
          last_seen_at?: string | null
          lat?: number | null
          lng?: number | null
          location?: unknown
          open_to_play?: boolean | null
          open_to_play_active?: boolean | null
          open_to_play_expires_at?: string | null
          updated_at?: string
          user_id?: string
          visibility_mode?: string | null
          visible_nearby?: boolean
        }
        Relationships: []
      }
      user_pings: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          background_image_url: string | null
          bag_visible: boolean | null
          bio: string | null
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          contact_person_name: string | null
          cover_photo_url: string | null
          created_at: string | null
          desktop_crop_height: number | null
          desktop_crop_width: number | null
          desktop_crop_x: number | null
          desktop_crop_y: number | null
          display_name: string | null
          eg_app_connected: boolean | null
          eg_handicap_index: number | null
          eg_recent_rounds: Json | null
          eg_visible: boolean | null
          email_change_cooldown_until: string | null
          email_change_count: number | null
          email_change_requested_at: string | null
          email_change_token: string | null
          has_profile_video: boolean | null
          header_photo_url: string | null
          home_club: string | null
          home_club_id: string | null
          id: string
          is_public: boolean | null
          location: string | null
          logo_url: string | null
          mini_card_crop_height: number | null
          mini_card_crop_width: number | null
          mini_card_crop_x: number | null
          mini_card_crop_y: number | null
          mobile_crop_height: number | null
          mobile_crop_width: number | null
          mobile_crop_x: number | null
          mobile_crop_y: number | null
          notification_preferences: Json | null
          pending_email: string | null
          phone: string | null
          pinned_achievement_ids: string[] | null
          profile_photo_url: string | null
          profile_video_thumbnail_url: string | null
          profile_video_url: string | null
          profile_video_visibility: string | null
          show_achievements_public: boolean | null
          show_handicap: boolean | null
          social_links: Json | null
          top100_visible: boolean | null
          tracker_visible: boolean | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          username: string | null
          website_url: string | null
          websites: string[] | null
        }
        Insert: {
          background_image_url?: string | null
          bag_visible?: boolean | null
          bio?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          contact_person_name?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          desktop_crop_height?: number | null
          desktop_crop_width?: number | null
          desktop_crop_x?: number | null
          desktop_crop_y?: number | null
          display_name?: string | null
          eg_app_connected?: boolean | null
          eg_handicap_index?: number | null
          eg_recent_rounds?: Json | null
          eg_visible?: boolean | null
          email_change_cooldown_until?: string | null
          email_change_count?: number | null
          email_change_requested_at?: string | null
          email_change_token?: string | null
          has_profile_video?: boolean | null
          header_photo_url?: string | null
          home_club?: string | null
          home_club_id?: string | null
          id: string
          is_public?: boolean | null
          location?: string | null
          logo_url?: string | null
          mini_card_crop_height?: number | null
          mini_card_crop_width?: number | null
          mini_card_crop_x?: number | null
          mini_card_crop_y?: number | null
          mobile_crop_height?: number | null
          mobile_crop_width?: number | null
          mobile_crop_x?: number | null
          mobile_crop_y?: number | null
          notification_preferences?: Json | null
          pending_email?: string | null
          phone?: string | null
          pinned_achievement_ids?: string[] | null
          profile_photo_url?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          profile_video_visibility?: string | null
          show_achievements_public?: boolean | null
          show_handicap?: boolean | null
          social_links?: Json | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          website_url?: string | null
          websites?: string[] | null
        }
        Update: {
          background_image_url?: string | null
          bag_visible?: boolean | null
          bio?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          contact_person_name?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          desktop_crop_height?: number | null
          desktop_crop_width?: number | null
          desktop_crop_x?: number | null
          desktop_crop_y?: number | null
          display_name?: string | null
          eg_app_connected?: boolean | null
          eg_handicap_index?: number | null
          eg_recent_rounds?: Json | null
          eg_visible?: boolean | null
          email_change_cooldown_until?: string | null
          email_change_count?: number | null
          email_change_requested_at?: string | null
          email_change_token?: string | null
          has_profile_video?: boolean | null
          header_photo_url?: string | null
          home_club?: string | null
          home_club_id?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          logo_url?: string | null
          mini_card_crop_height?: number | null
          mini_card_crop_width?: number | null
          mini_card_crop_x?: number | null
          mini_card_crop_y?: number | null
          mobile_crop_height?: number | null
          mobile_crop_width?: number | null
          mobile_crop_x?: number | null
          mobile_crop_y?: number | null
          notification_preferences?: Json | null
          pending_email?: string | null
          phone?: string | null
          pinned_achievement_ids?: string[] | null
          profile_photo_url?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          profile_video_visibility?: string | null
          show_achievements_public?: boolean | null
          show_handicap?: boolean | null
          social_links?: Json | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          website_url?: string | null
          websites?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_home_club"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_suggestion_dismissals: {
        Row: {
          created_at: string
          dismissed_at: string
          dismissed_user_id: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string
          dismissed_user_id: string
          expires_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string
          dismissed_user_id?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_top_ten_lists: {
        Row: {
          courses: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          courses?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          courses?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_top100_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          played: boolean | null
          played_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          played?: boolean | null
          played_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          played?: boolean | null
          played_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_top100_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      course_rating_stats: {
        Row: {
          average_rating: number | null
          course_id: string | null
          total_ratings: number | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_first_msgs: {
        Row: {
          first_assistant_at: string | null
          first_user_at: string | null
          thread_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echo_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_history_enriched"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "echo_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_history_enriched: {
        Row: {
          first_assistant_answer: string | null
          first_user_question: string | null
          has_response: boolean | null
          last_activity_at: string | null
          message_count: number | null
          preview_snippet: string | null
          thread_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          background_image_url: string | null
          bag_visible: boolean | null
          bio: string | null
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          cover_photo_url: string | null
          created_at: string | null
          display_name: string | null
          eg_visible: boolean | null
          id: string | null
          is_public: boolean | null
          location: string | null
          profile_photo_url: string | null
          social_links: Json | null
          top100_visible: boolean | null
          tracker_visible: boolean | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          username: string | null
          website_url: string | null
        }
        Insert: {
          background_image_url?: string | null
          bag_visible?: boolean | null
          bio?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          cover_photo_url?: string | null
          created_at?: string | null
          display_name?: string | null
          eg_visible?: boolean | null
          id?: string | null
          is_public?: boolean | null
          location?: never
          profile_photo_url?: string | null
          social_links?: Json | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          website_url?: string | null
        }
        Update: {
          background_image_url?: string | null
          bag_visible?: boolean | null
          bio?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          cover_photo_url?: string | null
          created_at?: string | null
          display_name?: string | null
          eg_visible?: boolean | null
          id?: string | null
          is_public?: boolean | null
          location?: never
          profile_photo_url?: string | null
          social_links?: Json | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      user_friend_pairs: {
        Row: {
          u1: string | null
          u2: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_overview_metrics: {
        Args: never
        Returns: {
          active_7d: number
          expiring_7d: number
          invites_pending: number
          panel_full_admins: number
          panel_limited_admins: number
          total_users: number
        }[]
      }
      can_change_email: { Args: { user_id_param: string }; Returns: boolean }
      can_view_game_participant_profile: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_game_participants: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: boolean
      }
      check_and_award_badges: {
        Args: { user_id_param: string }
        Returns: {
          newly_awarded_badges: Json
        }[]
      }
      cleanup_expired_dismissals: { Args: never; Returns: undefined }
      cleanup_old_gate_attempts: { Args: never; Returns: undefined }
      current_auth_uid: { Args: never; Returns: string }
      decrement_slots_if_available: {
        Args: { p_game_id: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      echo_history_list: {
        Args: { limit_rows?: number }
        Returns: {
          first_user_question: string
          has_response: boolean
          last_activity_at: string
          message_count: number
          preview_snippet: string
          relative_date: string
          thread_id: string
          user_id: string
        }[]
      }
      echo_history_search: {
        Args: {
          date_from?: string
          date_to?: string
          filter_has_response?: boolean
          filter_starred?: boolean
          filter_tag?: string
          max_results?: number
          mode?: string
          q?: string
          sort_mode?: string
        }
        Returns: {
          first_user_question: string
          has_response: boolean
          is_starred: boolean
          last_activity_at: string
          message_count: number
          preview_snippet: string
          relative_date: string
          thread_id: string
        }[]
      }
      echo_share_create: {
        Args: { p_thread_id: string; p_ttl_seconds?: number }
        Returns: string
      }
      echo_share_get_by_thread: {
        Args: { p_thread_id: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          revoked_at: string
          token: string
        }[]
      }
      echo_share_get_thread: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          messages: Json
          thread_id: string
          title: string
        }[]
      }
      echo_share_resolve: {
        Args: { p_token: string }
        Returns: {
          thread_id: string
        }[]
      }
      echo_share_revoke: { Args: { p_token: string }; Returns: undefined }
      echo_tag_add: {
        Args: { p_tag: string; p_thread: string }
        Returns: undefined
      }
      echo_tag_remove: {
        Args: { p_tag: string; p_thread: string }
        Returns: undefined
      }
      echo_tags_add_bulk: {
        Args: { p_names: string[]; p_thread_ids: string[] }
        Returns: undefined
      }
      echo_tags_add_to_thread: {
        Args: { p_names: string[]; p_thread: string }
        Returns: undefined
      }
      echo_tags_bulk_add_to_threads: {
        Args: { p_names: string[]; p_thread_ids: string[] }
        Returns: undefined
      }
      echo_tags_bulk_remove_from_threads: {
        Args: { p_names: string[]; p_thread_ids: string[] }
        Returns: undefined
      }
      echo_tags_delete_everywhere: {
        Args: { p_name: string }
        Returns: undefined
      }
      echo_tags_list_with_counts: {
        Args: never
        Returns: {
          last_used_at: string
          name: string
          threads_count: number
        }[]
      }
      echo_tags_remove_bulk: {
        Args: { p_names: string[]; p_thread_ids: string[] }
        Returns: undefined
      }
      echo_tags_remove_from_thread: {
        Args: { p_name: string; p_thread: string }
        Returns: undefined
      }
      echo_tags_rename: {
        Args: { p_new: string; p_old: string }
        Returns: undefined
      }
      echo_tags_set_for_thread: {
        Args: { p_names: string[]; p_thread: string }
        Returns: undefined
      }
      echo_tags_suggest: {
        Args: { p_limit?: number; p_prefix?: string }
        Returns: {
          name: string
        }[]
      }
      echo_thread_delete: { Args: { p_thread: string }; Returns: undefined }
      echo_thread_set_star: {
        Args: { p_star: boolean; p_thread: string }
        Returns: undefined
      }
      echo_threads_delete_many: { Args: { ids: string[] }; Returns: undefined }
      echo_threads_set_star: {
        Args: { ids: string[]; starred: boolean }
        Returns: undefined
      }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      execute_sql: { Args: { params?: Json; query: string }; Returns: Json }
      expire_pings: { Args: never; Returns: undefined }
      fetch_social_feed_posts: {
        Args: {
          current_offset: number
          followed_user_ids: string[]
          posts_per_page: number
        }
        Returns: {
          comments_count: number
          content: string
          created_at: string
          id: string
          interaction_type: string
          likes_count: number
          post_media: Json
          post_tags: Json
          shares_count: number
          user_id: string
        }[]
      }
      game_request_decide: {
        Args: { p_decision: string; p_request_id: string }
        Returns: Json
      }
      game_tag_accept: { Args: { p_game_id: string }; Returns: Json }
      game_tag_decline: { Args: { p_game_id: string }; Returns: Json }
      game_tag_release: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: Json
      }
      game_thread_log_member_event: {
        Args: { p_event: string; p_game_id: string; p_user_id: string }
        Returns: string
      }
      game_thread_open_for_game: { Args: { p_game_id: string }; Returns: Json }
      game_thread_sync: { Args: { p_game_id: string }; Returns: Json }
      game_thread_system_message: {
        Args: { p_game_id: string; p_text: string }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_admin_role: {
        Args: never
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_all_users_admin: {
        Args: never
        Returns: {
          auth_created_at: string
          display_name: string
          email: string
          email_confirmed_at: string
          home_club: string
          id: string
          is_public: boolean
          last_sign_in_at: string
          profile_created_at: string
          role: Database["public"]["Enums"]["app_role"]
          username: string
        }[]
      }
      get_cloudflare_secrets: { Args: never; Returns: Json }
      get_user_recent_achievements: {
        Args: { limit_param?: number; user_id_param: string }
        Returns: {
          achievement_data: Json
          achievement_type: string
          created_at: string
          id: string
        }[]
      }
      get_user_top100_courses_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_users_paged: {
        Args: { p_limit?: number; p_offset?: number; q?: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          home_club: string
          id: string
          last_sign_in_at: string
          role: string
          total_count: number
          username: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_host_of_game: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: boolean
      }
      is_mobile_device: { Args: never; Returns: boolean }
      is_panel_admin: { Args: never; Returns: boolean }
      is_participant: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: boolean
      }
      is_thread_member: { Args: { _thread_id: string }; Returns: boolean }
      log_user_achievement: {
        Args: {
          achievement_data_param: Json
          achievement_type_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      nearby_golfers: {
        Args: {
          limit_rows?: number
          max_km?: number
          me: string
          my_lat: number
          my_lng: number
          offset_rows?: number
          only_open?: boolean
          visibility_filter?: string
        }
        Returns: {
          display_name: string
          distance_m: number
          eg_handicap_index: number
          home_club: string
          latitude: number
          longitude: number
          open_to_play: boolean
          profile_photo_url: string
          user_id: string
          username: string
        }[]
      }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      populate_taggable_entities: { Args: never; Returns: undefined }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      recalculate_review_vote_counts: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      send_push_notification: {
        Args: {
          data?: Json
          message: string
          notification_type: string
          target_user_id: string
          title: string
        }
        Returns: undefined
      }
      send_user_ping: { Args: { p_recipient_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      test_echo_insert: { Args: never; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      update_mobile_crop_data: {
        Args: {
          p_crop_height: number
          p_crop_width: number
          p_crop_x: number
          p_crop_y: number
          p_user_id: string
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_can_see_game: {
        Args: { _game_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_friend_of_host: {
        Args: { _host_id: string; _viewer_id: string }
        Returns: boolean
      }
      user_is_game_participant: {
        Args: { _game_id: string; _user_id: string }
        Returns: boolean
      }
      viewer_shares_host_club: {
        Args: { _host_id: string; _viewer_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_role: "none" | "limited" | "full"
      app_role: "admin" | "moderator" | "user" | "limited_admin"
      badge_category: "top_100_courses" | "engagement" | "community" | "special"
      badge_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
      business_type:
        | "golf_club"
        | "pro_shop"
        | "teaching_academy"
        | "tour_event"
        | "other"
      continent:
        | "North America"
        | "South America"
        | "Europe"
        | "Asia"
        | "Africa"
        | "Oceania"
      ping_format: "NINE" | "EIGHTEEN" | "RANGE" | "CASUAL"
      ping_response_state: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"
      ping_status: "ACTIVE" | "MATCHING" | "CLOSED"
      ping_visibility: "FRIENDS" | "NEARBY" | "ALL"
      user_type:
        | "individual"
        | "club"
        | "pro_shop"
        | "academy"
        | "tour_event"
        | "other"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
    Enums: {
      admin_role: ["none", "limited", "full"],
      app_role: ["admin", "moderator", "user", "limited_admin"],
      badge_category: ["top_100_courses", "engagement", "community", "special"],
      badge_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
      business_type: [
        "golf_club",
        "pro_shop",
        "teaching_academy",
        "tour_event",
        "other",
      ],
      continent: [
        "North America",
        "South America",
        "Europe",
        "Asia",
        "Africa",
        "Oceania",
      ],
      ping_format: ["NINE", "EIGHTEEN", "RANGE", "CASUAL"],
      ping_response_state: ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],
      ping_status: ["ACTIVE", "MATCHING", "CLOSED"],
      ping_visibility: ["FRIENDS", "NEARBY", "ALL"],
      user_type: [
        "individual",
        "club",
        "pro_shop",
        "academy",
        "tour_event",
        "other",
      ],
    },
  },
} as const
