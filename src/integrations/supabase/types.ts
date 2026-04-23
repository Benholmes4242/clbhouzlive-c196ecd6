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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string
          icon_key: string | null
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description: string
          icon_key?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string
          icon_key?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      admin_email_notifications: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          invited_user_id: string | null
          notes: string | null
          role: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          invited_user_id?: string | null
          notes?: string | null
          role?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          invited_user_id?: string | null
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
      admin_notifications: {
        Row: {
          audience: string
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read_by: string[] | null
          title: string
          type: string
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read_by?: string[] | null
          title: string
          type: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read_by?: string[] | null
          title?: string
          type?: string
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
      ai_caption_usage: {
        Row: {
          count: number
          created_at: string
          id: string
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_prediction_accuracy: {
        Row: {
          accuracy_grade: string | null
          average_fit_score_actual: number | null
          average_fit_score_predicted: number | null
          average_pick_position: number | null
          best_pick_player_id: string | null
          best_pick_player_name: string | null
          best_pick_position: number | null
          claude_picks: Json | null
          consensus_method: string | null
          created_at: string | null
          gemini_picks: Json | null
          gpt_picks: Json | null
          id: string
          model_version: string | null
          pick_results: Json
          picks_in_top_10: number | null
          picks_in_top_20: number | null
          picks_in_top_5: number | null
          picks_made_cut: number | null
          picks_missed_cut: number | null
          prediction_id: string | null
          prompt_version: string | null
          scored_at: string | null
          season_year: number | null
          tour_code: string | null
          tournament_id: string | null
          tournament_name: string | null
        }
        Insert: {
          accuracy_grade?: string | null
          average_fit_score_actual?: number | null
          average_fit_score_predicted?: number | null
          average_pick_position?: number | null
          best_pick_player_id?: string | null
          best_pick_player_name?: string | null
          best_pick_position?: number | null
          claude_picks?: Json | null
          consensus_method?: string | null
          created_at?: string | null
          gemini_picks?: Json | null
          gpt_picks?: Json | null
          id?: string
          model_version?: string | null
          pick_results?: Json
          picks_in_top_10?: number | null
          picks_in_top_20?: number | null
          picks_in_top_5?: number | null
          picks_made_cut?: number | null
          picks_missed_cut?: number | null
          prediction_id?: string | null
          prompt_version?: string | null
          scored_at?: string | null
          season_year?: number | null
          tour_code?: string | null
          tournament_id?: string | null
          tournament_name?: string | null
        }
        Update: {
          accuracy_grade?: string | null
          average_fit_score_actual?: number | null
          average_fit_score_predicted?: number | null
          average_pick_position?: number | null
          best_pick_player_id?: string | null
          best_pick_player_name?: string | null
          best_pick_position?: number | null
          claude_picks?: Json | null
          consensus_method?: string | null
          created_at?: string | null
          gemini_picks?: Json | null
          gpt_picks?: Json | null
          id?: string
          model_version?: string | null
          pick_results?: Json
          picks_in_top_10?: number | null
          picks_in_top_20?: number | null
          picks_in_top_5?: number | null
          picks_made_cut?: number | null
          picks_missed_cut?: number | null
          prediction_id?: string | null
          prompt_version?: string | null
          scored_at?: string | null
          season_year?: number | null
          tour_code?: string | null
          tournament_id?: string | null
          tournament_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prediction_accuracy_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "ai_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prediction_accuracy_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_predictions: {
        Row: {
          confidence: number | null
          consensus_data: Json | null
          course_analysis: Json | null
          dark_horses: Json | null
          expires_at: string | null
          generated_at: string | null
          id: string
          model_version: string
          predictions: Json
          prompt_version: string | null
          research_context: Json | null
          tournament_id: string
        }
        Insert: {
          confidence?: number | null
          consensus_data?: Json | null
          course_analysis?: Json | null
          dark_horses?: Json | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          model_version: string
          predictions: Json
          prompt_version?: string | null
          research_context?: Json | null
          tournament_id: string
        }
        Update: {
          confidence?: number | null
          consensus_data?: Json | null
          course_analysis?: Json | null
          dark_horses?: Json | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          model_version?: string
          predictions?: Json
          prompt_version?: string | null
          research_context?: Json | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          id: string
          ip: unknown
          name: string
          props: Json
          ua: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: unknown
          name: string
          props?: Json
          ua?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: unknown
          name?: string
          props?: Json
          ua?: string | null
          user_id?: string | null
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
      beta_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      business_access_requests: {
        Row: {
          business_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          message: string | null
          requested_role: string
          requester_user_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          requested_role?: string
          requester_user_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          message?: string | null
          requested_role?: string
          requester_user_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_access_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_access_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_access_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_access_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_access_requests_requester_user_profile_id_fkey"
            columns: ["requester_user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_access_requests_requester_user_profile_id_fkey"
            columns: ["requester_user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_access_requests_requester_user_profile_id_fkey"
            columns: ["requester_user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_accounts: {
        Row: {
          address_label: string | null
          address_line1: string | null
          address_line2: string | null
          booking_url: string | null
          category: string | null
          city: string | null
          club_id: string | null
          club_key: string | null
          club_name: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          email: string | null
          founded_year: number | null
          id: string
          is_deleted: boolean
          is_system_account: boolean
          is_verified: boolean | null
          last_verification_action: string | null
          lat: number | null
          lng: number | null
          location: string | null
          location_precision: string | null
          location_updated_at: string | null
          logo_url: string | null
          mapbox_place_id: string | null
          name: string
          opening_hours: Json | null
          phone: string | null
          postcode: string | null
          region: string | null
          slug: string | null
          social_links: Json | null
          updated_at: string | null
          verification_cooldown_until: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address_label?: string | null
          address_line1?: string | null
          address_line2?: string | null
          booking_url?: string | null
          category?: string | null
          city?: string | null
          club_id?: string | null
          club_key?: string | null
          club_name?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_deleted?: boolean
          is_system_account?: boolean
          is_verified?: boolean | null
          last_verification_action?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          location_precision?: string | null
          location_updated_at?: string | null
          logo_url?: string | null
          mapbox_place_id?: string | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          postcode?: string | null
          region?: string | null
          slug?: string | null
          social_links?: Json | null
          updated_at?: string | null
          verification_cooldown_until?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address_label?: string | null
          address_line1?: string | null
          address_line2?: string | null
          booking_url?: string | null
          category?: string | null
          city?: string | null
          club_id?: string | null
          club_key?: string | null
          club_name?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_deleted?: boolean
          is_system_account?: boolean
          is_verified?: boolean | null
          last_verification_action?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          location_precision?: string | null
          location_updated_at?: string | null
          logo_url?: string | null
          mapbox_place_id?: string | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          postcode?: string | null
          region?: string | null
          slug?: string | null
          social_links?: Json | null
          updated_at?: string | null
          verification_cooldown_until?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_accounts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_activity_log: {
        Row: {
          actor_user_id: string | null
          business_id: string
          created_at: string
          id: string
          metadata: Json
          type: string
        }
        Insert: {
          actor_user_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          metadata?: Json
          type: string
        }
        Update: {
          actor_user_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_analytics_events: {
        Row: {
          action_type: string | null
          business_id: string
          content_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          business_id: string
          content_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          business_id?: string
          content_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_claimed_courses: {
        Row: {
          business_id: string
          course_id: string
          created_at: string
          id: string
        }
        Insert: {
          business_id: string
          course_id: string
          created_at?: string
          id?: string
        }
        Update: {
          business_id?: string
          course_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_claimed_courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claimed_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_daily_metrics: {
        Row: {
          actions_call: number
          actions_directions: number
          actions_message: number
          actions_total: number
          actions_website: number
          business_id: string
          engagements: number
          golfers_reached: number
          impressions: number
          metric_date: string
          new_followers: number
          profile_visits: number
          reviews_count: number
        }
        Insert: {
          actions_call?: number
          actions_directions?: number
          actions_message?: number
          actions_total?: number
          actions_website?: number
          business_id: string
          engagements?: number
          golfers_reached?: number
          impressions?: number
          metric_date: string
          new_followers?: number
          profile_visits?: number
          reviews_count?: number
        }
        Update: {
          actions_call?: number
          actions_directions?: number
          actions_message?: number
          actions_total?: number
          actions_website?: number
          business_id?: string
          engagements?: number
          golfers_reached?: number
          impressions?: number
          metric_date?: string
          new_followers?: number
          profile_visits?: number
          reviews_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_daily_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_domain_verifications: {
        Row: {
          business_id: string
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          request_id: string
          status: string
          verified_at: string | null
        }
        Insert: {
          business_id: string
          code_hash: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          request_id: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          business_id?: string
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          request_id?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_domain_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_domain_verifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "business_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      business_follows: {
        Row: {
          business_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invites: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invitee_email: string
          role: string
          status: string
          token: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invitee_email: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invitee_email?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          role: string
          user_profile_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          role: string
          user_profile_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_outbound_follows: {
        Row: {
          created_at: string | null
          follower_business_id: string
          following_id: string
          following_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_business_id: string
          following_id: string
          following_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_business_id?: string
          following_id?: string
          following_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_outbound_follows_follower_business_id_fkey"
            columns: ["follower_business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profile_events: {
        Row: {
          business_id: string
          created_at: string
          event_type: string
          id: string
          path: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          event_type: string
          id?: string
          path?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          event_type?: string
          id?: string
          path?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profile_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_profile_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profile_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_tag_visibility: {
        Row: {
          business_id: string
          created_at: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_hidden: boolean
          post_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          post_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_tag_visibility_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tag_visibility_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_team_members: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          display_title: string | null
          id: string
          role: Database["public"]["Enums"]["business_team_role"]
          user_profile_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          display_title?: string | null
          id?: string
          role?: Database["public"]["Enums"]["business_team_role"]
          user_profile_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          display_title?: string | null
          id?: string
          role?: Database["public"]["Enums"]["business_team_role"]
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_team_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_team_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_team_members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_verification_events: {
        Row: {
          action: string
          actor_user_id: string | null
          business_profile_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          business_profile_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          business_profile_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_verification_events_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_verification_events_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_verification_events_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_verification_requests: {
        Row: {
          admin_note: string | null
          approval_count: number
          business_id: string
          created_at: string
          domain: string | null
          domain_confirmed: boolean
          domain_confirmed_at: string | null
          id: string
          note: string | null
          proof_metadata: Json | null
          proof_method: string | null
          proof_value: string | null
          requested_by: string
          required_approvals: number
          requires_domain_check: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_note?: string | null
          approval_count?: number
          business_id: string
          created_at?: string
          domain?: string | null
          domain_confirmed?: boolean
          domain_confirmed_at?: string | null
          id?: string
          note?: string | null
          proof_metadata?: Json | null
          proof_method?: string | null
          proof_value?: string | null
          requested_by: string
          required_approvals?: number
          requires_domain_check?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_note?: string | null
          approval_count?: number
          business_id?: string
          created_at?: string
          domain?: string | null
          domain_confirmed?: boolean
          domain_confirmed_at?: string | null
          id?: string
          note?: string | null
          proof_metadata?: Json | null
          proof_method?: string | null
          proof_value?: string | null
          requested_by?: string
          required_approvals?: number
          requires_domain_check?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_verification_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_verification_reviews: {
        Row: {
          created_at: string
          decision: string
          id: string
          note: string | null
          request_id: string
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          note?: string | null
          request_id: string
          reviewer_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          note?: string | null
          request_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_verification_reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "business_verification_requests"
            referencedColumns: ["id"]
          },
        ]
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
      challenge_requirements: {
        Row: {
          challenge_id: string
          created_at: string | null
          id: string
          metric: string
          target: number
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          id?: string
          metric: string
          target: number
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          id?: string
          metric?: string
          target?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_requirements_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          auto_generated: boolean | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string
          end_at: string
          id: string
          is_active: boolean | null
          shop_currency_reward: number | null
          start_at: string
          title: string
          type: string
          xp_reward: number
        }
        Insert: {
          auto_generated?: boolean | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description: string
          end_at: string
          id?: string
          is_active?: boolean | null
          shop_currency_reward?: number | null
          start_at: string
          title: string
          type: string
          xp_reward: number
        }
        Update: {
          auto_generated?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          end_at?: string
          id?: string
          is_active?: boolean | null
          shop_currency_reward?: number | null
          start_at?: string
          title?: string
          type?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_editorial_daily: {
        Row: {
          created_at: string
          date: string
          eyebrow: string
          generated_by: string
          headline: string
          headline_two: string
          id: string
          season_id: string | null
          snapshot_data: Json | null
          standfirst: string
          story_type: string
          surface: string
          time_filter: string
        }
        Insert: {
          created_at?: string
          date?: string
          eyebrow: string
          generated_by?: string
          headline: string
          headline_two?: string
          id?: string
          season_id?: string | null
          snapshot_data?: Json | null
          standfirst: string
          story_type: string
          surface?: string
          time_filter: string
        }
        Update: {
          created_at?: string
          date?: string
          eyebrow?: string
          generated_by?: string
          headline?: string
          headline_two?: string
          id?: string
          season_id?: string | null
          snapshot_data?: Json | null
          standfirst?: string
          story_type?: string
          surface?: string
          time_filter?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_editorial_daily_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_seasons: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          end_date: string
          icon: string | null
          id: string
          name: string
          prize_claimed: boolean | null
          prize_description: string | null
          season_number: number
          season_winner_courses: number | null
          season_winner_user_id: string | null
          sponsor_name: string | null
          sponsor_url: string | null
          start_date: string
          status: string
          tagline: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          icon?: string | null
          id?: string
          name: string
          prize_claimed?: boolean | null
          prize_description?: string | null
          season_number: number
          season_winner_courses?: number | null
          season_winner_user_id?: string | null
          sponsor_name?: string | null
          sponsor_url?: string | null
          start_date: string
          status?: string
          tagline?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          icon?: string | null
          id?: string
          name?: string
          prize_claimed?: boolean | null
          prize_description?: string | null
          season_number?: number
          season_winner_courses?: number | null
          season_winner_user_id?: string | null
          sponsor_name?: string | null
          sponsor_url?: string | null
          start_date?: string
          status?: string
          tagline?: string | null
        }
        Relationships: []
      }
      club_page_requests: {
        Row: {
          created_at: string
          id: string
          manager_email: string | null
          requested_club_id: string | null
          requested_club_key: string
          requested_club_name: string
          requester_user_profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_email?: string | null
          requested_club_id?: string | null
          requested_club_key: string
          requested_club_name: string
          requester_user_profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_email?: string | null
          requested_club_id?: string | null
          requested_club_key?: string
          requested_club_name?: string
          requester_user_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_page_requests_requested_club_id_fkey"
            columns: ["requested_club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_page_requests_requester_user_profile_id_fkey"
            columns: ["requester_user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "club_page_requests_requester_user_profile_id_fkey"
            columns: ["requester_user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_page_requests_requester_user_profile_id_fkey"
            columns: ["requester_user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      college_logo_sources: {
        Row: {
          confidence: number | null
          created_at: string
          found_image_url: string | null
          found_page_url: string | null
          id: string
          last_error: string | null
          normalized_name: string
          source: string
          source_page_url: string | null
          status: string
          suggested_url: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          found_image_url?: string | null
          found_page_url?: string | null
          id?: string
          last_error?: string | null
          normalized_name: string
          source?: string
          source_page_url?: string | null
          status?: string
          suggested_url?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          found_image_url?: string | null
          found_page_url?: string | null
          id?: string
          last_error?: string | null
          normalized_name?: string
          source?: string
          source_page_url?: string | null
          status?: string
          suggested_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_logo_sources_normalized_name_fkey"
            columns: ["normalized_name"]
            isOneToOne: true
            referencedRelation: "college_media"
            referencedColumns: ["normalized_name"]
          },
        ]
      }
      college_media: {
        Row: {
          college_name: string
          country: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          normalized_name: string
          short_name: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          college_name: string
          country?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          normalized_name: string
          short_name?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          college_name?: string
          country?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          normalized_name?: string
          short_name?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      college_rivalries: {
        Row: {
          college_a: string
          college_b: string
          created_at: string
          id: string
          weight: number
        }
        Insert: {
          college_a: string
          college_b: string
          created_at?: string
          id?: string
          weight?: number
        }
        Update: {
          college_a?: string
          college_b?: string
          created_at?: string
          id?: string
          weight?: number
        }
        Relationships: []
      }
      college_season_stats: {
        Row: {
          avg_driving_accuracy: number | null
          avg_driving_distance: number | null
          avg_gir: number | null
          avg_putting: number | null
          avg_sand_saves: number | null
          avg_scoring: number | null
          avg_scrambling: number | null
          avg_sg_total: number | null
          created_at: string
          cuts_total: number
          earnings_total: number
          events_total: number
          id: string
          normalized_name: string
          player_count: number
          season_id: string | null
          top10_total: number
          top25_total: number
          updated_at: string
          wins_total: number
        }
        Insert: {
          avg_driving_accuracy?: number | null
          avg_driving_distance?: number | null
          avg_gir?: number | null
          avg_putting?: number | null
          avg_sand_saves?: number | null
          avg_scoring?: number | null
          avg_scrambling?: number | null
          avg_sg_total?: number | null
          created_at?: string
          cuts_total?: number
          earnings_total?: number
          events_total?: number
          id?: string
          normalized_name: string
          player_count?: number
          season_id?: string | null
          top10_total?: number
          top25_total?: number
          updated_at?: string
          wins_total?: number
        }
        Update: {
          avg_driving_accuracy?: number | null
          avg_driving_distance?: number | null
          avg_gir?: number | null
          avg_putting?: number | null
          avg_sand_saves?: number | null
          avg_scoring?: number | null
          avg_scrambling?: number | null
          avg_sg_total?: number | null
          created_at?: string
          cuts_total?: number
          earnings_total?: number
          events_total?: number
          id?: string
          normalized_name?: string
          player_count?: number
          season_id?: string | null
          top10_total?: number
          top25_total?: number
          updated_at?: string
          wins_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "college_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "sr_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      college_stats_snapshots: {
        Row: {
          created_at: string
          cuts_total: number
          earnings_total: number
          events_total: number
          id: string
          normalized_name: string
          player_count: number
          season_id: string
          top10_total: number
          top25_total: number
          week_end: string
          week_start: string
          wins_total: number
        }
        Insert: {
          created_at?: string
          cuts_total?: number
          earnings_total?: number
          events_total?: number
          id?: string
          normalized_name: string
          player_count?: number
          season_id: string
          top10_total?: number
          top25_total?: number
          week_end: string
          week_start: string
          wins_total?: number
        }
        Update: {
          created_at?: string
          cuts_total?: number
          earnings_total?: number
          events_total?: number
          id?: string
          normalized_name?: string
          player_count?: number
          season_id?: string
          top10_total?: number
          top25_total?: number
          week_end?: string
          week_start?: string
          wins_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "college_stats_snapshots_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "sr_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      college_weekly_movers: {
        Row: {
          created_at: string
          cuts_delta: number
          earnings_delta: number
          earnings_rank_change: number | null
          earnings_rank_last_week: number | null
          earnings_rank_this_week: number | null
          id: string
          normalized_name: string
          season_id: string
          top10_delta: number
          week_start: string
          wins_delta: number
        }
        Insert: {
          created_at?: string
          cuts_delta?: number
          earnings_delta?: number
          earnings_rank_change?: number | null
          earnings_rank_last_week?: number | null
          earnings_rank_this_week?: number | null
          id?: string
          normalized_name: string
          season_id: string
          top10_delta?: number
          week_start: string
          wins_delta?: number
        }
        Update: {
          created_at?: string
          cuts_delta?: number
          earnings_delta?: number
          earnings_rank_change?: number | null
          earnings_rank_last_week?: number | null
          earnings_rank_this_week?: number | null
          id?: string
          normalized_name?: string
          season_id?: string
          top10_delta?: number
          week_start?: string
          wins_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "college_weekly_movers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "sr_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      combination_achievements: {
        Row: {
          achievement_type: string
          badge_image_key: string | null
          created_at: string | null
          criteria_json: Json | null
          description: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          target_value: number
          tier_name: string
        }
        Insert: {
          achievement_type: string
          badge_image_key?: string | null
          created_at?: string | null
          criteria_json?: Json | null
          description: string
          id: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          target_value: number
          tier_name: string
        }
        Update: {
          achievement_type?: string
          badge_image_key?: string | null
          created_at?: string | null
          criteria_json?: Json | null
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          target_value?: number
          tier_name?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          mentioned_entity_id: string
          mentioned_entity_type: string
          mentioned_username: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          mentioned_entity_id: string
          mentioned_entity_type: string
          mentioned_username: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          mentioned_entity_id?: string
          mentioned_entity_type?: string
          mentioned_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_notifications: {
        Row: {
          actor_user_id: string
          comment_id: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          read_at: string | null
          recipient_user_id: string
          type: string
        }
        Insert: {
          actor_user_id: string
          comment_id: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          read_at?: string | null
          recipient_user_id: string
          type: string
        }
        Update: {
          actor_user_id?: string
          comment_id?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          read_at?: string | null
          recipient_user_id?: string
          type?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          archived_at: string | null
          conversation_id: string | null
          id: string
          is_archived: boolean | null
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          conversation_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          conversation_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          group_settings: Json | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          name: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          group_settings?: Json | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          group_settings?: Json | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          name?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cosmetic_loadouts: {
        Row: {
          equipped_post_frame: string | null
          equipped_profile_ring: string | null
          equipped_reaction_pack: string | null
          equipped_theme: string | null
          equipped_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          equipped_post_frame?: string | null
          equipped_profile_ring?: string | null
          equipped_reaction_pack?: string | null
          equipped_theme?: string | null
          equipped_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          equipped_post_frame?: string | null
          equipped_profile_ring?: string | null
          equipped_reaction_pack?: string | null
          equipped_theme?: string | null
          equipped_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetic_loadouts_equipped_post_frame_fkey"
            columns: ["equipped_post_frame"]
            isOneToOne: false
            referencedRelation: "season_shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_equipped_profile_ring_fkey"
            columns: ["equipped_profile_ring"]
            isOneToOne: false
            referencedRelation: "season_shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_equipped_reaction_pack_fkey"
            columns: ["equipped_reaction_pack"]
            isOneToOne: false
            referencedRelation: "season_shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_equipped_theme_fkey"
            columns: ["equipped_theme"]
            isOneToOne: false
            referencedRelation: "season_shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_equipped_title_fkey"
            columns: ["equipped_title"]
            isOneToOne: false
            referencedRelation: "season_shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_loadouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      country_region_mapping: {
        Row: {
          country_code: string
          id: string
          region_slug: string
        }
        Insert: {
          country_code: string
          id?: string
          region_slug: string
        }
        Update: {
          country_code?: string
          id?: string
          region_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_region_mapping_region_slug_fkey"
            columns: ["region_slug"]
            isOneToOne: false
            referencedRelation: "regions_config"
            referencedColumns: ["slug"]
          },
        ]
      }
      course_change_log: {
        Row: {
          admin_user_id: string
          change_details: Json | null
          change_summary: string
          change_type: string
          course_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          admin_user_id: string
          change_details?: Json | null
          change_summary: string
          change_type: string
          course_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          admin_user_id?: string
          change_details?: Json | null
          change_summary?: string
          change_type?: string
          course_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_change_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_dna_profiles: {
        Row: {
          avg_cut_line: number | null
          avg_winning_score: number | null
          course_type: string | null
          driving_accuracy_importance: number | null
          driving_distance_importance: number | null
          gir_importance: number | null
          green_speed_factor: number | null
          historical_winners: Json | null
          id: string
          last_updated: string | null
          par_3_scoring_importance: number | null
          par_4_scoring_importance: number | null
          par_5_scoring_importance: number | null
          putting_importance: number | null
          rough_severity_factor: number | null
          scoring_difficulty: number | null
          scrambling_importance: number | null
          sg_approach_importance: number | null
          sg_around_green_importance: number | null
          sg_off_tee_importance: number | null
          sg_putting_importance: number | null
          stat_correlations: Json | null
          tournaments_analyzed: number | null
          venue_id: string | null
          venue_name: string
          wind_exposure_factor: number | null
          years_of_data: number | null
        }
        Insert: {
          avg_cut_line?: number | null
          avg_winning_score?: number | null
          course_type?: string | null
          driving_accuracy_importance?: number | null
          driving_distance_importance?: number | null
          gir_importance?: number | null
          green_speed_factor?: number | null
          historical_winners?: Json | null
          id?: string
          last_updated?: string | null
          par_3_scoring_importance?: number | null
          par_4_scoring_importance?: number | null
          par_5_scoring_importance?: number | null
          putting_importance?: number | null
          rough_severity_factor?: number | null
          scoring_difficulty?: number | null
          scrambling_importance?: number | null
          sg_approach_importance?: number | null
          sg_around_green_importance?: number | null
          sg_off_tee_importance?: number | null
          sg_putting_importance?: number | null
          stat_correlations?: Json | null
          tournaments_analyzed?: number | null
          venue_id?: string | null
          venue_name: string
          wind_exposure_factor?: number | null
          years_of_data?: number | null
        }
        Update: {
          avg_cut_line?: number | null
          avg_winning_score?: number | null
          course_type?: string | null
          driving_accuracy_importance?: number | null
          driving_distance_importance?: number | null
          gir_importance?: number | null
          green_speed_factor?: number | null
          historical_winners?: Json | null
          id?: string
          last_updated?: string | null
          par_3_scoring_importance?: number | null
          par_4_scoring_importance?: number | null
          par_5_scoring_importance?: number | null
          putting_importance?: number | null
          rough_severity_factor?: number | null
          scoring_difficulty?: number | null
          scrambling_importance?: number | null
          sg_approach_importance?: number | null
          sg_around_green_importance?: number | null
          sg_off_tee_importance?: number | null
          sg_putting_importance?: number | null
          stat_correlations?: Json | null
          tournaments_analyzed?: number | null
          venue_id?: string | null
          venue_name?: string
          wind_exposure_factor?: number | null
          years_of_data?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_dna_profiles_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "sr_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_edit_suggestions: {
        Row: {
          admin_notes: string | null
          business_id: string
          course_id: string
          created_at: string | null
          current_value: string | null
          field_name: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggested_by: string
          suggested_value: string
        }
        Insert: {
          admin_notes?: string | null
          business_id: string
          course_id: string
          created_at?: string | null
          current_value?: string | null
          field_name: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_by: string
          suggested_value: string
        }
        Update: {
          admin_notes?: string | null
          business_id?: string
          course_id?: string
          created_at?: string | null
          current_value?: string | null
          field_name?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggested_by?: string
          suggested_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_edit_suggestions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_edit_suggestions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
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
      course_media_likes: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      course_mood_blurbs: {
        Row: {
          blurb: string
          course_id: string
          expires_at: string
          generated_at: string
          id: string
          mood: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          blurb: string
          course_id: string
          expires_at?: string
          generated_at?: string
          id?: string
          mood: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          blurb?: string
          course_id?: string
          expires_at?: string
          generated_at?: string
          id?: string
          mood?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_mood_blurbs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_mood_blurbs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      course_prestige_tags: {
        Row: {
          awarded_at: string
          course_id: string
          id: string
          metadata: Json | null
          season_id: string | null
          tag_label: string
          tag_type: string
        }
        Insert: {
          awarded_at?: string
          course_id: string
          id?: string
          metadata?: Json | null
          season_id?: string | null
          tag_label: string
          tag_type: string
        }
        Update: {
          awarded_at?: string
          course_id?: string
          id?: string
          metadata?: Json | null
          season_id?: string | null
          tag_label?: string
          tag_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_prestige_tags_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prestige_tags_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_rank_history: {
        Row: {
          course_id: string
          id: string
          rank: number
          rank_type: string
          recorded_at: string
          recorded_date: string
          time_period: string
        }
        Insert: {
          course_id: string
          id?: string
          rank: number
          rank_type: string
          recorded_at?: string
          recorded_date?: string
          time_period: string
        }
        Update: {
          course_id?: string
          id?: string
          rank?: number
          rank_type?: string
          recorded_at?: string
          recorded_date?: string
          time_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_rank_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          clubhouse_score: number | null
          condition_score: number | null
          course_id: string
          created_at: string
          design_score: number | null
          facilities_score: number | null
          helpful_count: number | null
          id: string
          is_mock: boolean
          is_review_of_week: boolean | null
          rating: number
          review: string | null
          review_date: string | null
          review_of_week_week: string | null
          title: string | null
          unhelpful_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clubhouse_score?: number | null
          condition_score?: number | null
          course_id: string
          created_at?: string
          design_score?: number | null
          facilities_score?: number | null
          helpful_count?: number | null
          id?: string
          is_mock?: boolean
          is_review_of_week?: boolean | null
          rating: number
          review?: string | null
          review_date?: string | null
          review_of_week_week?: string | null
          title?: string | null
          unhelpful_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clubhouse_score?: number | null
          condition_score?: number | null
          course_id?: string
          created_at?: string
          design_score?: number | null
          facilities_score?: number | null
          helpful_count?: number | null
          id?: string
          is_mock?: boolean
          is_review_of_week?: boolean | null
          rating?: number
          review?: string | null
          review_date?: string | null
          review_of_week_week?: string | null
          title?: string | null
          unhelpful_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_review_media: {
        Row: {
          aspect_ratio: number | null
          created_at: string
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          height: number | null
          id: string
          is_cover: boolean | null
          media_type: string
          media_url: string
          orientation: string | null
          owner_user_id: string | null
          poster_url: string | null
          review_id: string | null
          status: string
          stream_id: string | null
          upload_session_id: string | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          is_cover?: boolean | null
          media_type: string
          media_url: string
          orientation?: string | null
          owner_user_id?: string | null
          poster_url?: string | null
          review_id?: string | null
          status?: string
          stream_id?: string | null
          upload_session_id?: string | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          is_cover?: boolean | null
          media_type?: string
          media_url?: string
          orientation?: string | null
          owner_user_id?: string | null
          poster_url?: string | null
          review_id?: string | null
          status?: string
          stream_id?: string | null
          upload_session_id?: string | null
          width?: number | null
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
      course_review_votes: {
        Row: {
          created_at: string
          id: string
          rating_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          rating_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_review_votes_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      course_shortlists: {
        Row: {
          course_id: string
          created_at: string
          id: string
          list_key: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          list_key?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          list_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_shortlists_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_top100_memberships: {
        Row: {
          added_at: string | null
          course_id: string
          id: string
          list_id: string
          rank: number
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          course_id: string
          id?: string
          list_id: string
          rank: number
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          course_id?: string
          id?: string
          list_id?: string
          rank?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_top100_memberships_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_top100_memberships_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "top100_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_top100_memberships_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "user_top100_progress_view"
            referencedColumns: ["list_id"]
          },
        ]
      }
      creator_profile_events: {
        Row: {
          created_at: string
          creator_page_id: string
          event_type: string
          id: string
          path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          creator_page_id: string
          event_type?: string
          id?: string
          path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          creator_page_id?: string
          event_type?: string
          id?: string
          path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deleted_message_users: {
        Row: {
          deleted_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deleted_message_users_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      division_config: {
        Row: {
          created_at: string | null
          display_name: string
          division_id: string
          icon_url: string | null
          id: string
          promotion_zone_size: number | null
          relegation_zone_size: number | null
          ring_color: string
          sort_order: number
          threshold: number
        }
        Insert: {
          created_at?: string | null
          display_name: string
          division_id: string
          icon_url?: string | null
          id?: string
          promotion_zone_size?: number | null
          relegation_zone_size?: number | null
          ring_color: string
          sort_order: number
          threshold: number
        }
        Update: {
          created_at?: string | null
          display_name?: string
          division_id?: string
          icon_url?: string | null
          id?: string
          promotion_zone_size?: number | null
          relegation_zone_size?: number | null
          ring_color?: string
          sort_order?: number
          threshold?: number
        }
        Relationships: []
      }
      echo_admin_dashboard_views: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          owner: string
          params: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          owner: string
          params: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          owner?: string
          params?: Json
        }
        Relationships: []
      }
      echo_conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "echo_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          pinned: boolean
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          pinned?: boolean
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          pinned?: boolean
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      echo_rate_limits: {
        Row: {
          request_count: number
          user_id: string
          window_start: string
          window_type: string
        }
        Insert: {
          request_count?: number
          user_id: string
          window_start: string
          window_type: string
        }
        Update: {
          request_count?: number
          user_id?: string
          window_start?: string
          window_type?: string
        }
        Relationships: []
      }
      echo_response_cache: {
        Row: {
          created_at: string | null
          hit_count: number | null
          model_used: string
          query_hash: string
          query_text: string
          response_text: string
        }
        Insert: {
          created_at?: string | null
          hit_count?: number | null
          model_used: string
          query_hash: string
          query_text: string
          response_text: string
        }
        Update: {
          created_at?: string | null
          hit_count?: number | null
          model_used?: string
          query_hash?: string
          query_text?: string
          response_text?: string
        }
        Relationships: []
      }
      echo_share_links: {
        Row: {
          created_at: string
          revoked_at: string | null
          thread_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          revoked_at?: string | null
          thread_id: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          revoked_at?: string | null
          thread_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_share_links_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_history_enriched"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "echo_share_links_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "echo_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_share_redactions: {
        Row: {
          action: string
          created_at: string
          message_id: string
          token: string
        }
        Insert: {
          action: string
          created_at?: string
          message_id: string
          token: string
        }
        Update: {
          action?: string
          created_at?: string
          message_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_share_redactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "echo_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_share_redactions_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "echo_share_links"
            referencedColumns: ["token"]
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
          last_opened_at: string | null
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
          last_opened_at?: string | null
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
          last_opened_at?: string | null
          message_count?: number | null
          tsv?: unknown
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      editorial_card_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_card_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "editorial_card_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_card_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "editorial_card_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_card_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_card_comments: {
        Row: {
          card_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_card_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "editorial_feed_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_card_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "editorial_card_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_card_likes: {
        Row: {
          card_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_card_likes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "editorial_feed_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_debate_votes: {
        Row: {
          card_id: string
          created_at: string
          id: string
          option: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          option: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_debate_votes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "editorial_feed_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_feed_cards: {
        Row: {
          active_from: string
          active_until: string
          body: string | null
          body_extended: string | null
          card_type: string
          comment_count: number
          course_editorial_blurb: string | null
          course_id: string | null
          created_at: string
          debate_option_a: string | null
          debate_option_a_course_id: string | null
          debate_option_b: string | null
          debate_option_b_course_id: string | null
          debate_votes_a: number
          debate_votes_b: number
          generation_metadata: Json | null
          history_date: string | null
          history_year: number | null
          id: string
          is_active: boolean
          reaction_count: number
          source_rating_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active_from: string
          active_until: string
          body?: string | null
          body_extended?: string | null
          card_type: string
          comment_count?: number
          course_editorial_blurb?: string | null
          course_id?: string | null
          created_at?: string
          debate_option_a?: string | null
          debate_option_a_course_id?: string | null
          debate_option_b?: string | null
          debate_option_b_course_id?: string | null
          debate_votes_a?: number
          debate_votes_b?: number
          generation_metadata?: Json | null
          history_date?: string | null
          history_year?: number | null
          id?: string
          is_active?: boolean
          reaction_count?: number
          source_rating_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_until?: string
          body?: string | null
          body_extended?: string | null
          card_type?: string
          comment_count?: number
          course_editorial_blurb?: string | null
          course_id?: string | null
          created_at?: string
          debate_option_a?: string | null
          debate_option_a_course_id?: string | null
          debate_option_b?: string | null
          debate_option_b_course_id?: string | null
          debate_votes_a?: number
          debate_votes_b?: number
          generation_metadata?: Json | null
          history_date?: string | null
          history_year?: number | null
          id?: string
          is_active?: boolean
          reaction_count?: number
          source_rating_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_feed_cards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_feed_cards_debate_option_a_course_id_fkey"
            columns: ["debate_option_a_course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_feed_cards_debate_option_b_course_id_fkey"
            columns: ["debate_option_b_course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_feed_cards_source_rating_id_fkey"
            columns: ["source_rating_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_leaderboard: {
        Row: {
          event_id: string
          id: string
          movement: number | null
          participant_id: string
          position_gross: number | null
          position_net: number | null
          position_stableford: number | null
          rounds_played: number | null
          total_gross: number | null
          total_net: number | null
          total_stableford: number | null
          updated_at: string
        }
        Insert: {
          event_id: string
          id?: string
          movement?: number | null
          participant_id: string
          position_gross?: number | null
          position_net?: number | null
          position_stableford?: number | null
          rounds_played?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_stableford?: number | null
          updated_at?: string
        }
        Update: {
          event_id?: string
          id?: string
          movement?: number | null
          participant_id?: string
          position_gross?: number | null
          position_net?: number | null
          position_stableford?: number | null
          rounds_played?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_stableford?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_leaderboard_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_leaderboard_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_moments: {
        Row: {
          created_at: string
          description: string | null
          headline: string
          id: string
          moment_type: string
          player_id: string | null
          sort_order: number
          tournament_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          headline: string
          id?: string
          moment_type: string
          player_id?: string | null
          sort_order?: number
          tournament_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          headline?: string
          id?: string
          moment_type?: string
          player_id?: string | null
          sort_order?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_moments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_moments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created_at: string
          event_id: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          handicap_index: number | null
          id: string
          invitation_status: string
          invited_at: string | null
          invited_by: string | null
          payment_status: string | null
          playing_handicap: number | null
          responded_at: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          handicap_index?: number | null
          id?: string
          invitation_status?: string
          invited_at?: string | null
          invited_by?: string | null
          payment_status?: string | null
          playing_handicap?: number | null
          responded_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          created_at?: string
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          handicap_index?: number | null
          id?: string
          invitation_status?: string
          invited_at?: string | null
          invited_by?: string | null
          payment_status?: string | null
          playing_handicap?: number | null
          responded_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rounds: {
        Row: {
          course_id: string | null
          course_location: string | null
          course_name: string
          course_rating: number | null
          created_at: string
          event_id: string
          first_tee_time: string
          holes: number
          id: string
          legacy_game_id: string | null
          par: number | null
          round_date: string
          round_number: number
          shotgun_start: boolean | null
          slope_rating: number | null
          status: string
          tee_color: string | null
          tee_time_interval: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          course_location?: string | null
          course_name: string
          course_rating?: number | null
          created_at?: string
          event_id: string
          first_tee_time: string
          holes?: number
          id?: string
          legacy_game_id?: string | null
          par?: number | null
          round_date: string
          round_number?: number
          shotgun_start?: boolean | null
          slope_rating?: number | null
          status?: string
          tee_color?: string | null
          tee_time_interval?: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          course_location?: string | null
          course_name?: string
          course_rating?: number | null
          created_at?: string
          event_id?: string
          first_tee_time?: string
          holes?: number
          id?: string
          legacy_game_id?: string | null
          par?: number | null
          round_date?: string
          round_number?: number
          shotgun_start?: boolean | null
          slope_rating?: number | null
          status?: string
          tee_color?: string | null
          tee_time_interval?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rounds_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rounds_legacy_game_id_fkey"
            columns: ["legacy_game_id"]
            isOneToOne: false
            referencedRelation: "discover_games_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rounds_legacy_game_id_fkey"
            columns: ["legacy_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rounds_legacy_game_id_fkey"
            columns: ["legacy_game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rounds_legacy_game_id_fkey"
            columns: ["legacy_game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["legacy_game_id"]
          },
        ]
      }
      event_scores: {
        Row: {
          attested_at: string | null
          attested_by: string | null
          back_nine_gross: number | null
          created_at: string
          front_nine_gross: number | null
          group_id: string | null
          hole_scores: Json | null
          holes_halved: number | null
          holes_lost: number | null
          holes_won: number | null
          id: string
          participant_id: string
          round_id: string
          scorecard_image_url: string | null
          stableford_points: number | null
          status: string
          total_gross: number | null
          total_net: number | null
          updated_at: string
        }
        Insert: {
          attested_at?: string | null
          attested_by?: string | null
          back_nine_gross?: number | null
          created_at?: string
          front_nine_gross?: number | null
          group_id?: string | null
          hole_scores?: Json | null
          holes_halved?: number | null
          holes_lost?: number | null
          holes_won?: number | null
          id?: string
          participant_id: string
          round_id: string
          scorecard_image_url?: string | null
          stableford_points?: number | null
          status?: string
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Update: {
          attested_at?: string | null
          attested_by?: string | null
          back_nine_gross?: number | null
          created_at?: string
          front_nine_gross?: number | null
          group_id?: string | null
          hole_scores?: Json | null
          holes_halved?: number | null
          holes_lost?: number | null
          holes_won?: number | null
          id?: string
          participant_id?: string
          round_id?: string
          scorecard_image_url?: string | null
          stableford_points?: number | null
          status?: string
          total_gross?: number | null
          total_net?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_scores_attested_by_fkey"
            columns: ["attested_by"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_scores_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tee_time_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_scores_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "event_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      event_winners: {
        Row: {
          created_at: string
          final_round_score: number | null
          headline: string | null
          id: string
          is_playoff: boolean | null
          margin: number | null
          narrative: string | null
          player_id: string | null
          score_to_par: number | null
          tournament_id: string
          updated_at: string
          winning_score: number | null
        }
        Insert: {
          created_at?: string
          final_round_score?: number | null
          headline?: string | null
          id?: string
          is_playoff?: boolean | null
          margin?: number | null
          narrative?: string | null
          player_id?: string | null
          score_to_par?: number | null
          tournament_id: string
          updated_at?: string
          winning_score?: number | null
        }
        Update: {
          created_at?: string
          final_round_score?: number | null
          headline?: string | null
          id?: string
          is_playoff?: boolean | null
          margin?: number | null
          narrative?: string | null
          player_id?: string | null
          score_to_par?: number | null
          tournament_id?: string
          updated_at?: string
          winning_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_winners_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_winners_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_waitlist: boolean | null
          club_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_type: string
          handicap_allowance: number | null
          id: string
          max_handicap: number | null
          max_participants: number | null
          name: string
          published_at: string | null
          registration_deadline: string | null
          scoring_format: string | null
          share_code: string | null
          start_date: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_waitlist?: boolean | null
          club_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          handicap_allowance?: number | null
          id?: string
          max_handicap?: number | null
          max_participants?: number | null
          name: string
          published_at?: string | null
          registration_deadline?: string | null
          scoring_format?: string | null
          share_code?: string | null
          start_date: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_waitlist?: boolean | null
          club_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          handicap_allowance?: number | null
          id?: string
          max_handicap?: number | null
          max_participants?: number | null
          name?: string
          published_at?: string | null
          registration_deadline?: string | null
          scoring_format?: string | null
          share_code?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_course_themes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          theme_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          theme_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_course_themes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_course_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "explore_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_course_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "vw_theme_activity_30d"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      explore_featured_courses: {
        Row: {
          active: boolean
          card_media_url: string
          card_type: string
          course_id: string
          created_at: string
          id: string
          play_url: string | null
          sort_order: number
          source_label: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          card_media_url: string
          card_type?: string
          course_id: string
          created_at?: string
          id?: string
          play_url?: string | null
          sort_order?: number
          source_label: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          card_media_url?: string
          card_type?: string
          course_id?: string
          created_at?: string
          id?: string
          play_url?: string | null
          sort_order?: number
          source_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_featured_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_region_members: {
        Row: {
          country: string
          created_at: string
          id: string
          region_id: string
          sub_country: string | null
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          region_id: string
          sub_country?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          region_id?: string
          sub_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_region_members_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "explore_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_region_members_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "vw_region_activity_30d"
            referencedColumns: ["region_id"]
          },
        ]
      }
      explore_regions: {
        Row: {
          created_at: string
          hero_image_url: string | null
          id: string
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      explore_themes: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
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
            referencedRelation: "discover_games_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["legacy_game_id"]
          },
        ]
      }
      game_participants: {
        Row: {
          added_by_user_id: string | null
          archived_at: string | null
          created_at: string
          game_id: string
          guest_name: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          request_message: string | null
          request_message_updated_at: string | null
          reserves_slot: boolean
          role: string
          rsvp_status: string | null
          rsvp_updated_at: string | null
          state: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          archived_at?: string | null
          created_at?: string
          game_id: string
          guest_name?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          request_message?: string | null
          request_message_updated_at?: string | null
          reserves_slot?: boolean
          role?: string
          rsvp_status?: string | null
          rsvp_updated_at?: string | null
          state?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          archived_at?: string | null
          created_at?: string
          game_id?: string
          guest_name?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          request_message?: string | null
          request_message_updated_at?: string | null
          reserves_slot?: boolean
          role?: string
          rsvp_status?: string | null
          rsvp_updated_at?: string | null
          state?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "discover_games_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["legacy_game_id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
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
      game_reminders: {
        Row: {
          created_at: string
          enabled: boolean
          game_id: string
          id: string
          last_24h_sent_at: string | null
          last_2h_sent_at: string | null
          remind_24h: boolean
          remind_2h: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          game_id: string
          id?: string
          last_24h_sent_at?: string | null
          last_2h_sent_at?: string | null
          remind_24h?: boolean
          remind_2h?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          game_id?: string
          id?: string
          last_24h_sent_at?: string | null
          last_2h_sent_at?: string | null
          remind_24h?: boolean
          remind_2h?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_reminders_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "discover_games_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_reminders_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_reminders_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_reminders_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["legacy_game_id"]
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
            referencedRelation: "discover_games_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_threads_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_threads_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_threads_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games_as_events"
            referencedColumns: ["legacy_game_id"]
          },
        ]
      }
      games: {
        Row: {
          course_id: string | null
          course_name: string | null
          course_name_normalized: string | null
          created_at: string
          ends_at: string | null
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
          trip_id: string | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          course_id?: string | null
          course_name?: string | null
          course_name_normalized?: string | null
          created_at?: string
          ends_at?: string | null
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
          trip_id?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          course_id?: string | null
          course_name?: string | null
          course_name_normalized?: string | null
          created_at?: string
          ends_at?: string | null
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
          trip_id?: string | null
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
          {
            foreignKeyName: "games_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "discover_trips_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_as_events"
            referencedColumns: ["legacy_trip_id"]
          },
        ]
      }
      golf_club_aliases: {
        Row: {
          alias_key: string
          canonical_club_id: string
          created_at: string
          id: string
        }
        Insert: {
          alias_key: string
          canonical_club_id: string
          created_at?: string
          id?: string
        }
        Update: {
          alias_key?: string
          canonical_club_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "golf_club_aliases_canonical_club_id_fkey"
            columns: ["canonical_club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_clubs: {
        Row: {
          club_key: string
          club_key_v2: string | null
          continent: string | null
          country: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string | null
          sub_country: string | null
        }
        Insert: {
          club_key: string
          club_key_v2?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region?: string | null
          sub_country?: string | null
        }
        Update: {
          club_key?: string
          club_key_v2?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string | null
          sub_country?: string | null
        }
        Relationships: []
      }
      golf_courses: {
        Row: {
          club_id: string | null
          continent: Database["public"]["Enums"]["continent"]
          country: string
          country_code: string | null
          country_rank: number | null
          course_type: Database["public"]["Enums"]["course_type"] | null
          created_at: string
          description: string | null
          global_rank: number | null
          has_hosted_major: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          major_championships: string[] | null
          name: string
          region: string | null
          region_key: string | null
          regional_rank: number | null
          sub_country: string | null
          thumbnail_image: string | null
          top100_url: string | null
          updated_at: string
          usa_rank: number | null
          website_url: string | null
        }
        Insert: {
          club_id?: string | null
          continent: Database["public"]["Enums"]["continent"]
          country: string
          country_code?: string | null
          country_rank?: number | null
          course_type?: Database["public"]["Enums"]["course_type"] | null
          created_at?: string
          description?: string | null
          global_rank?: number | null
          has_hosted_major?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          major_championships?: string[] | null
          name: string
          region?: string | null
          region_key?: string | null
          regional_rank?: number | null
          sub_country?: string | null
          thumbnail_image?: string | null
          top100_url?: string | null
          updated_at?: string
          usa_rank?: number | null
          website_url?: string | null
        }
        Update: {
          club_id?: string | null
          continent?: Database["public"]["Enums"]["continent"]
          country?: string
          country_code?: string | null
          country_rank?: number | null
          course_type?: Database["public"]["Enums"]["course_type"] | null
          created_at?: string
          description?: string | null
          global_rank?: number | null
          has_hosted_major?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          major_championships?: string[] | null
          name?: string
          region?: string | null
          region_key?: string | null
          regional_rank?: number | null
          sub_country?: string | null
          thumbnail_image?: string | null
          top100_url?: string | null
          updated_at?: string
          usa_rank?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "golf_courses_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      golfer_candidate_overrides: {
        Row: {
          acted_by: string
          action: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          acted_by: string
          action: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          acted_by?: string
          action?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      golfer_eligibility_signals: {
        Row: {
          candidate_state: string
          course_tags_30d: number
          created_at: string
          engagement_score_30d: number
          followers_count: number
          has_external_links: boolean
          last_computed_at: string
          mentions_30d: number
          profile_completeness_score: number
          top100_course_tags_30d: number
          unique_mentioners_30d: number
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_state?: string
          course_tags_30d?: number
          created_at?: string
          engagement_score_30d?: number
          followers_count?: number
          has_external_links?: boolean
          last_computed_at?: string
          mentions_30d?: number
          profile_completeness_score?: number
          top100_course_tags_30d?: number
          unique_mentioners_30d?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_state?: string
          course_tags_30d?: number
          created_at?: string
          engagement_score_30d?: number
          followers_count?: number
          has_external_links?: boolean
          last_computed_at?: string
          mentions_30d?: number
          profile_completeness_score?: number
          top100_course_tags_30d?: number
          unique_mentioners_30d?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      golfer_verification_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      golfer_verification_requests: {
        Row: {
          accepted_at: string | null
          admin_note: string | null
          approval_count: number
          created_at: string
          declined_at: string | null
          evidence_url: string | null
          id: string
          invite_reason: string | null
          invited_by: string
          note: string | null
          requested_at: string | null
          required_approvals: number
          reviewed_at: string | null
          second_approval_bypass_note: string | null
          second_approval_bypassed: boolean
          second_approval_bypassed_at: string | null
          second_approval_bypassed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          admin_note?: string | null
          approval_count?: number
          created_at?: string
          declined_at?: string | null
          evidence_url?: string | null
          id?: string
          invite_reason?: string | null
          invited_by: string
          note?: string | null
          requested_at?: string | null
          required_approvals?: number
          reviewed_at?: string | null
          second_approval_bypass_note?: string | null
          second_approval_bypassed?: boolean
          second_approval_bypassed_at?: string | null
          second_approval_bypassed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          admin_note?: string | null
          approval_count?: number
          created_at?: string
          declined_at?: string | null
          evidence_url?: string | null
          id?: string
          invite_reason?: string | null
          invited_by?: string
          note?: string | null
          requested_at?: string | null
          required_approvals?: number
          reviewed_at?: string | null
          second_approval_bypass_note?: string | null
          second_approval_bypassed?: boolean
          second_approval_bypassed_at?: string | null
          second_approval_bypassed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      golfer_verification_reviews: {
        Row: {
          created_at: string
          decision: string
          id: string
          note: string | null
          request_id: string
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          note?: string | null
          request_id: string
          reviewer_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          note?: string | null
          request_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "golfer_verification_reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "golfer_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_comments: {
        Row: {
          comment_id: string
          created_at: string
          details: string | null
          id: string
          post_id: string
          reason: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          details?: string | null
          id?: string
          post_id: string
          reason: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      hub_conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "hub_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_conversations: {
        Row: {
          conversation_type: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          conversation_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          conversation_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hub_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "hub_conversations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "discover_games_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_as_events"
            referencedColumns: ["legacy_game_id"]
          },
          {
            foreignKeyName: "join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
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
      leaderboard_highlights: {
        Row: {
          created_at: string
          details: Json | null
          expires_at: string
          id: string
          type: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          expires_at?: string
          id?: string
          type: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          expires_at?: string
          id?: string
          type?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      leaderboard_milestones: {
        Row: {
          created_at: string
          dedupe_key: string
          id: string
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          percentile: number | null
          rank_delta: number | null
          rank_scope: Database["public"]["Enums"]["leaderboard_scope"]
          rank_value: number
          rivals_overtaken: number | null
          season_id: string | null
          season_key: string | null
          time_range: Database["public"]["Enums"]["leaderboard_time_range"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          id?: string
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          percentile?: number | null
          rank_delta?: number | null
          rank_scope: Database["public"]["Enums"]["leaderboard_scope"]
          rank_value: number
          rivals_overtaken?: number | null
          season_id?: string | null
          season_key?: string | null
          time_range: Database["public"]["Enums"]["leaderboard_time_range"]
          user_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          id?: string
          milestone_type?: Database["public"]["Enums"]["milestone_type"]
          percentile?: number | null
          rank_delta?: number | null
          rank_scope?: Database["public"]["Enums"]["leaderboard_scope"]
          rank_value?: number
          rivals_overtaken?: number | null
          season_id?: string | null
          season_key?: string | null
          time_range?: Database["public"]["Enums"]["leaderboard_time_range"]
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_rank_snapshots: {
        Row: {
          created_at: string | null
          global_rank: number | null
          id: string
          snapshot_date: string
          total_top100_played: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          global_rank?: number | null
          id?: string
          snapshot_date: string
          total_top100_played?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          global_rank?: number | null
          id?: string
          snapshot_date?: string
          total_top100_played?: number | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          captured_at: string
          created_at: string
          entity_id: string
          id: number
          metric_value: number | null
          rank: number
          scope: string
          season_id: string | null
          surface: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          entity_id: string
          id?: number
          metric_value?: number | null
          rank: number
          scope: string
          season_id?: string | null
          surface: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          entity_id?: string
          id?: number
          metric_value?: number | null
          rank?: number
          scope?: string
          season_id?: string | null
          surface?: string
        }
        Relationships: []
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
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          message_id?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          delivered_at: string | null
          delivery_status: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          media_metadata: Json | null
          media_url: string | null
          message_type: string | null
          read_at: string | null
          reply_to_id: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          media_metadata?: Json | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          media_metadata?: Json | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_profile_clones: {
        Row: {
          background_image_url: string | null
          bio: string | null
          cloned_from_user_id: string | null
          created_at: string | null
          display_name: string | null
          followers_count: number | null
          header_photo_url: string | null
          home_club: string | null
          id: string
          is_verified: boolean | null
          profile_photo_url: string | null
          profile_video_thumbnail_url: string | null
          profile_video_url: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          background_image_url?: string | null
          bio?: string | null
          cloned_from_user_id?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          header_photo_url?: string | null
          home_club?: string | null
          id?: string
          is_verified?: boolean | null
          profile_photo_url?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          background_image_url?: string | null
          bio?: string | null
          cloned_from_user_id?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          header_photo_url?: string | null
          home_club?: string | null
          id?: string
          is_verified?: boolean | null
          profile_photo_url?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          updated_at?: string | null
          username?: string | null
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
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          muted_types: string[] | null
          muted_user_ids: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          muted_types?: string[] | null
          muted_user_ids?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          muted_types?: string[] | null
          muted_user_ids?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          error: string | null
          id: string
          processed_at: string | null
          recipient_id: string | null
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          error?: string | null
          id?: string
          processed_at?: string | null
          recipient_id?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          error?: string | null
          id?: string
          processed_at?: string | null
          recipient_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_deleted: boolean
          is_read: boolean
          message: string | null
          read: boolean
          recipient_actor_id: string
          recipient_actor_type: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          message?: string | null
          read?: boolean
          recipient_actor_id: string
          recipient_actor_type?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          message?: string | null
          read?: boolean
          recipient_actor_id?: string
          recipient_actor_type?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_actor_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_backup_pre_golive: {
        Row: {
          actor_id: string | null
          created_at: string | null
          data: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          is_deleted: boolean | null
          is_read: boolean | null
          message: string | null
          read: boolean | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          is_deleted?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          is_deleted?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read?: boolean | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      player_course_history: {
        Row: {
          driving_accuracy: number | null
          finish_position: number | null
          greens_in_regulation: number | null
          id: string
          made_cut: boolean | null
          played_at: string | null
          player_id: string
          rounds_played: number | null
          score_to_par: number | null
          sg_total: number | null
          tournament_id: string | null
          venue_name: string
        }
        Insert: {
          driving_accuracy?: number | null
          finish_position?: number | null
          greens_in_regulation?: number | null
          id?: string
          made_cut?: boolean | null
          played_at?: string | null
          player_id: string
          rounds_played?: number | null
          score_to_par?: number | null
          sg_total?: number | null
          tournament_id?: string | null
          venue_name: string
        }
        Update: {
          driving_accuracy?: number | null
          finish_position?: number | null
          greens_in_regulation?: number | null
          id?: string
          made_cut?: boolean | null
          played_at?: string | null
          player_id?: string
          rounds_played?: number | null
          score_to_par?: number | null
          sg_total?: number | null
          tournament_id?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_course_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_course_history_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_media: {
        Row: {
          confidence: number | null
          created_at: string
          headshot_url: string
          id: string
          player_id: string
          source: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          headshot_url: string
          id?: string
          player_id: string
          source?: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          headshot_url?: string
          id?: string
          player_id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_media_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_ratings: {
        Row: {
          breakdown: Json
          computed_at: string | null
          created_at: string | null
          events_minimum_met: boolean | null
          id: string
          player_id: string
          previous_rating: number | null
          rating: number
          rating_delta: number | null
          scouting_report: string | null
          season_id: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          breakdown?: Json
          computed_at?: string | null
          created_at?: string | null
          events_minimum_met?: boolean | null
          id?: string
          player_id: string
          previous_rating?: number | null
          rating: number
          rating_delta?: number | null
          scouting_report?: string | null
          season_id: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          breakdown?: Json
          computed_at?: string | null
          created_at?: string | null
          events_minimum_met?: boolean | null
          id?: string
          player_id?: string
          previous_rating?: number | null
          rating?: number
          rating_delta?: number | null
          scouting_report?: string | null
          season_id?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          actor_id: string
          actor_type: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_edited: boolean | null
          media_type: string | null
          media_url: string | null
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
          voice_duration_seconds: number | null
        }
        Insert: {
          actor_id: string
          actor_type?: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean | null
          media_type?: string | null
          media_url?: string | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
          voice_duration_seconds?: number | null
        }
        Update: {
          actor_id?: string
          actor_type?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean | null
          media_type?: string | null
          media_url?: string | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
          voice_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_courses: {
        Row: {
          course_id: string
          created_at: string | null
          display_order: number
          id: string
          post_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          display_order?: number
          id?: string
          post_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_courses_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_dismissals: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_dismissals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_draft_media: {
        Row: {
          aspect_ratio: number | null
          created_at: string | null
          display_order: number | null
          draft_id: string
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          filter_id: string | null
          height: number | null
          id: string
          media_type: string
          media_url: string
          poster_url: string | null
          stream_id: string | null
          studio_edits: Json | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string | null
          display_order?: number | null
          draft_id: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          filter_id?: string | null
          height?: number | null
          id?: string
          media_type: string
          media_url: string
          poster_url?: string | null
          stream_id?: string | null
          studio_edits?: Json | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string | null
          display_order?: number | null
          draft_id?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          filter_id?: string | null
          height?: number | null
          id?: string
          media_type?: string
          media_url?: string
          poster_url?: string | null
          stream_id?: string | null
          studio_edits?: Json | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_draft_media_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "post_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_drafts: {
        Row: {
          actor_id: string
          actor_type: string | null
          audio_mode: string | null
          badges: string[] | null
          categories: string[] | null
          content: string | null
          course_country: string | null
          course_data: Json | null
          course_id: string | null
          course_name: string | null
          created_at: string | null
          id: string
          studio_music: Json | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          actor_id: string
          actor_type?: string | null
          audio_mode?: string | null
          badges?: string[] | null
          categories?: string[] | null
          content?: string | null
          course_country?: string | null
          course_data?: Json | null
          course_id?: string | null
          course_name?: string | null
          created_at?: string | null
          id?: string
          studio_music?: Json | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          actor_id?: string
          actor_type?: string | null
          audio_mode?: string | null
          badges?: string[] | null
          categories?: string[] | null
          content?: string | null
          course_country?: string | null
          course_data?: Json | null
          course_id?: string | null
          course_name?: string | null
          created_at?: string | null
          id?: string
          studio_music?: Json | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_drafts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          actor_id: string
          actor_type: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          actor_id: string
          actor_type?: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          actor_id?: string
          actor_type?: string
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
          derived_format: string | null
          display_order: number | null
          duration_ms: number | null
          duration_seconds: number | null
          exif: Json | null
          filter_id: string | null
          height: number | null
          hls_url: string | null
          id: string
          image_orientation: string | null
          media_height: number | null
          media_type: string
          media_url: string
          media_width: number | null
          orientation: string | null
          original_media_url: string | null
          post_id: string
          poster_timestamp: number | null
          poster_url: string | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          source_review_media_id: string | null
          stream_id: string | null
          studio_edits: Json | null
          trim_end: number | null
          trim_start: number | null
          upload_status: string
          width: number | null
        }
        Insert: {
          aspect_ratio?: number | null
          created_at?: string
          derived_format?: string | null
          display_order?: number | null
          duration_ms?: number | null
          duration_seconds?: number | null
          exif?: Json | null
          filter_id?: string | null
          height?: number | null
          hls_url?: string | null
          id?: string
          image_orientation?: string | null
          media_height?: number | null
          media_type: string
          media_url: string
          media_width?: number | null
          orientation?: string | null
          original_media_url?: string | null
          post_id: string
          poster_timestamp?: number | null
          poster_url?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          source_review_media_id?: string | null
          stream_id?: string | null
          studio_edits?: Json | null
          trim_end?: number | null
          trim_start?: number | null
          upload_status?: string
          width?: number | null
        }
        Update: {
          aspect_ratio?: number | null
          created_at?: string
          derived_format?: string | null
          display_order?: number | null
          duration_ms?: number | null
          duration_seconds?: number | null
          exif?: Json | null
          filter_id?: string | null
          height?: number | null
          hls_url?: string | null
          id?: string
          image_orientation?: string | null
          media_height?: number | null
          media_type?: string
          media_url?: string
          media_width?: number | null
          orientation?: string | null
          original_media_url?: string | null
          post_id?: string
          poster_timestamp?: number | null
          poster_url?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          source_review_media_id?: string | null
          stream_id?: string | null
          studio_edits?: Json | null
          trim_end?: number | null
          trim_start?: number | null
          upload_status?: string
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
          {
            foreignKeyName: "post_media_source_review_media_id_fkey"
            columns: ["source_review_media_id"]
            isOneToOne: false
            referencedRelation: "course_review_media"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
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
          tagged_by_user_id: string
          tagged_entity_id: string
        }
        Insert: {
          created_at?: string
          end_index: number
          id?: string
          post_id: string
          start_index: number
          tagged_by_user_id: string
          tagged_entity_id: string
        }
        Update: {
          created_at?: string
          end_index?: number
          id?: string
          post_id?: string
          start_index?: number
          tagged_by_user_id?: string
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
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          achievement_badge_id: string | null
          achievement_id: string | null
          actor_id: string
          actor_type: string
          audio_mode: string | null
          badges: string[]
          caddie_pick_comment_id: string | null
          categories: string[]
          comment_count: number
          content: string | null
          course_id: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          like_count: number
          pinned_at: string | null
          pinned_by: string | null
          pinned_until: string | null
          post_categories: string[] | null
          post_type: string | null
          scheduled_at: string | null
          source_review_id: string | null
          status: string
          studio_music: Json | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          achievement_badge_id?: string | null
          achievement_id?: string | null
          actor_id: string
          actor_type?: string
          audio_mode?: string | null
          badges?: string[]
          caddie_pick_comment_id?: string | null
          categories?: string[]
          comment_count?: number
          content?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number
          pinned_at?: string | null
          pinned_by?: string | null
          pinned_until?: string | null
          post_categories?: string[] | null
          post_type?: string | null
          scheduled_at?: string | null
          source_review_id?: string | null
          status?: string
          studio_music?: Json | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          achievement_badge_id?: string | null
          achievement_id?: string | null
          actor_id?: string
          actor_type?: string
          audio_mode?: string | null
          badges?: string[]
          caddie_pick_comment_id?: string | null
          categories?: string[]
          comment_count?: number
          content?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          like_count?: number
          pinned_at?: string | null
          pinned_by?: string | null
          pinned_until?: string | null
          post_categories?: string[] | null
          post_type?: string | null
          scheduled_at?: string | null
          source_review_id?: string | null
          status?: string
          studio_music?: Json | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "user_achievements_view"
            referencedColumns: ["achievement_id"]
          },
          {
            foreignKeyName: "posts_caddie_pick_comment_id_fkey"
            columns: ["caddie_pick_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_source_review_id_fkey"
            columns: ["source_review_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_user_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_audit_log: {
        Row: {
          actual_top_5: string[] | null
          actual_winner_id: string | null
          dark_horse_hits: number | null
          id: string
          predicted_at: string | null
          predicted_dark_horses: string[] | null
          predicted_top_5: string[] | null
          predicted_winner_id: string | null
          prediction_id: string | null
          resolved_at: string | null
          top_5_hits: number | null
          tournament_id: string
          winner_correct: boolean | null
        }
        Insert: {
          actual_top_5?: string[] | null
          actual_winner_id?: string | null
          dark_horse_hits?: number | null
          id?: string
          predicted_at?: string | null
          predicted_dark_horses?: string[] | null
          predicted_top_5?: string[] | null
          predicted_winner_id?: string | null
          prediction_id?: string | null
          resolved_at?: string | null
          top_5_hits?: number | null
          tournament_id: string
          winner_correct?: boolean | null
        }
        Update: {
          actual_top_5?: string[] | null
          actual_winner_id?: string | null
          dark_horse_hits?: number | null
          id?: string
          predicted_at?: string | null
          predicted_dark_horses?: string[] | null
          predicted_top_5?: string[] | null
          predicted_winner_id?: string | null
          prediction_id?: string | null
          resolved_at?: string | null
          top_5_hits?: number | null
          tournament_id?: string
          winner_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_audit_log_actual_winner_id_fkey"
            columns: ["actual_winner_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_audit_log_predicted_winner_id_fkey"
            columns: ["predicted_winner_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_audit_log_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "ai_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_audit_log_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
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
      profile_analytics_events: {
        Row: {
          action_type: string | null
          content_id: string | null
          created_at: string
          event_hour: string | null
          event_type: Database["public"]["Enums"]["creator_event_type"]
          id: string
          metadata: Json | null
          profile_id: string
          profile_type: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          content_id?: string | null
          created_at?: string
          event_hour?: string | null
          event_type: Database["public"]["Enums"]["creator_event_type"]
          id?: string
          metadata?: Json | null
          profile_id: string
          profile_type?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          content_id?: string | null
          created_at?: string
          event_hour?: string | null
          event_type?: Database["public"]["Enums"]["creator_event_type"]
          id?: string
          metadata?: Json | null
          profile_id?: string
          profile_type?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_creation_errors: {
        Row: {
          created_at: string | null
          error_code: string | null
          error_message: string
          id: string
          resolved_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_code?: string | null
          error_message: string
          id?: string
          resolved_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_code?: string | null
          error_message?: string
          id?: string
          resolved_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_daily_metrics: {
        Row: {
          engagements: number
          impressions: number
          metric_date: string
          new_followers: number
          post_comments: number
          post_likes: number
          post_saves: number
          post_views: number
          profile_id: string
          profile_type: string
          profile_visits: number
          unique_viewers: number
        }
        Insert: {
          engagements?: number
          impressions?: number
          metric_date: string
          new_followers?: number
          post_comments?: number
          post_likes?: number
          post_saves?: number
          post_views?: number
          profile_id: string
          profile_type?: string
          profile_visits?: number
          unique_viewers?: number
        }
        Update: {
          engagements?: number
          impressions?: number
          metric_date?: string
          new_followers?: number
          post_comments?: number
          post_likes?: number
          post_saves?: number
          post_views?: number
          profile_id?: string
          profile_type?: string
          profile_visits?: number
          unique_viewers?: number
        }
        Relationships: []
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
      push_notification_queue: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          device_id: string
          error: string | null
          id: string
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          device_id: string
          error?: string | null
          id?: string
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          device_id?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      regions_config: {
        Row: {
          country_code: string | null
          country_codes: string[] | null
          courses_required: number
          created_at: string | null
          flag_emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_region_slug: string | null
          region_type: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          country_code?: string | null
          country_codes?: string[] | null
          courses_required?: number
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_region_slug?: string | null
          region_type: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          country_code?: string | null
          country_codes?: string[] | null
          courses_required?: number
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_region_slug?: string | null
          region_type?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_config_parent_region_slug_fkey"
            columns: ["parent_region_slug"]
            isOneToOne: false
            referencedRelation: "regions_config"
            referencedColumns: ["slug"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_conversation_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_conversation_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_conversation_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_conversation_id_fkey"
            columns: ["reported_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          responded_by: string
          response_text: string
          review_id: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          responded_by: string
          response_text: string
          review_id: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          responded_by?: string
          response_text?: string
          review_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      review_tags: {
        Row: {
          created_at: string | null
          end_index: number | null
          id: string
          review_id: string
          start_index: number | null
          tagged_entity_id: string
        }
        Insert: {
          created_at?: string | null
          end_index?: number | null
          id?: string
          review_id: string
          start_index?: number | null
          tagged_entity_id: string
        }
        Update: {
          created_at?: string | null
          end_index?: number | null
          id?: string
          review_id?: string
          start_index?: number | null
          tagged_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_tags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "course_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_tags_tagged_entity_id_fkey"
            columns: ["tagged_entity_id"]
            isOneToOne: false
            referencedRelation: "taggable_entities"
            referencedColumns: ["id"]
          },
        ]
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
      rivals: {
        Row: {
          created_at: string | null
          id: string
          rival_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rival_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rival_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rivals_rival_user_id_fkey"
            columns: ["rival_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rivals_rival_user_id_fkey"
            columns: ["rival_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivals_rival_user_id_fkey"
            columns: ["rival_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rivals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_messages: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      season_badges: {
        Row: {
          awarded_at: string | null
          badge_data: Json | null
          badge_type: string
          id: string
          season_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_data?: Json | null
          badge_type: string
          id?: string
          season_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_data?: Json | null
          badge_type?: string
          id?: string
          season_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_badges_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      season_pass_tiers: {
        Row: {
          id: string
          purchased_at: string | null
          season_id: string | null
          tier: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          purchased_at?: string | null
          season_id?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          purchased_at?: string | null
          season_id?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_pass_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_pass_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_pass_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_pass_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_pass_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_pass_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      season_podium_archive: {
        Row: {
          archived_at: string
          division_id: string | null
          first_place_courses: number
          first_place_division: string
          first_place_user_id: string
          id: string
          scope: string
          season_id: string
          season_name: string
          season_number: number
          second_place_courses: number | null
          second_place_division: string | null
          second_place_user_id: string | null
          third_place_courses: number | null
          third_place_division: string | null
          third_place_user_id: string | null
        }
        Insert: {
          archived_at?: string
          division_id?: string | null
          first_place_courses: number
          first_place_division: string
          first_place_user_id: string
          id?: string
          scope?: string
          season_id: string
          season_name: string
          season_number: number
          second_place_courses?: number | null
          second_place_division?: string | null
          second_place_user_id?: string | null
          third_place_courses?: number | null
          third_place_division?: string | null
          third_place_user_id?: string | null
        }
        Update: {
          archived_at?: string
          division_id?: string | null
          first_place_courses?: number
          first_place_division?: string
          first_place_user_id?: string
          id?: string
          scope?: string
          season_id?: string
          season_name?: string
          season_number?: number
          second_place_courses?: number | null
          second_place_division?: string | null
          second_place_user_id?: string | null
          third_place_courses?: number | null
          third_place_division?: string | null
          third_place_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_podium_archive_first_place_user_id_fkey"
            columns: ["first_place_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_podium_archive_first_place_user_id_fkey"
            columns: ["first_place_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_podium_archive_first_place_user_id_fkey"
            columns: ["first_place_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_podium_archive_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_podium_archive_second_place_user_id_fkey"
            columns: ["second_place_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_podium_archive_second_place_user_id_fkey"
            columns: ["second_place_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_podium_archive_second_place_user_id_fkey"
            columns: ["second_place_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_podium_archive_third_place_user_id_fkey"
            columns: ["third_place_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_podium_archive_third_place_user_id_fkey"
            columns: ["third_place_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_podium_archive_third_place_user_id_fkey"
            columns: ["third_place_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      season_rewards: {
        Row: {
          badge_icon: string | null
          created_at: string | null
          id: string
          label: string
          max_rank: number
          min_rank: number
          season_id: string
          tier: string
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string | null
          id?: string
          label: string
          max_rank: number
          min_rank: number
          season_id: string
          tier: string
        }
        Update: {
          badge_icon?: string | null
          created_at?: string | null
          id?: string
          label?: string
          max_rank?: number
          min_rank?: number
          season_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_rewards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
        ]
      }
      season_shop_items: {
        Row: {
          category: string | null
          cost: number
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_premium_only: boolean | null
          name: string
          preview_url: string | null
          rarity: string | null
          season_id: string | null
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          cost?: number
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          name: string
          preview_url?: string | null
          rarity?: string | null
          season_id?: string | null
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          name?: string
          preview_url?: string | null
          rarity?: string | null
          season_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "season_shop_items_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_shop_items_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_shop_items_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
        ]
      }
      season_wrap_cards: {
        Row: {
          cards: Json
          generated_at: string | null
          id: string
          season_id: string
          user_id: string
          viewed: boolean | null
        }
        Insert: {
          cards?: Json
          generated_at?: string | null
          id?: string
          season_id: string
          user_id: string
          viewed?: boolean | null
        }
        Update: {
          cards?: Json
          generated_at?: string | null
          id?: string
          season_id?: string
          user_id?: string
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "season_wrap_cards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_wrap_cards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_wrap_cards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_wrap_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_wrap_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_wrap_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          processing_flag: boolean | null
          slug: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          processing_flag?: boolean | null
          slug: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          processing_flag?: boolean | null
          slug?: string
          starts_at?: string
          updated_at?: string
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
      sr_course_holes: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          hole_number: number
          id: string
          par: number | null
          raw_data: Json | null
          yardage: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          hole_number: number
          id?: string
          par?: number | null
          raw_data?: Json | null
          yardage?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          hole_number?: number
          id?: string
          par?: number | null
          raw_data?: Json | null
          yardage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_course_holes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "sr_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_course_map: {
        Row: {
          confidence: number | null
          created_at: string
          golf_course_id: string | null
          id: string
          source: string
          sr_city: string | null
          sr_country: string | null
          sr_venue_course_name: string | null
          sr_venue_name: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          golf_course_id?: string | null
          id?: string
          source?: string
          sr_city?: string | null
          sr_country?: string | null
          sr_venue_course_name?: string | null
          sr_venue_name: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          golf_course_id?: string | null
          id?: string
          source?: string
          sr_city?: string | null
          sr_country?: string | null
          sr_venue_course_name?: string | null
          sr_venue_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sr_course_map_golf_course_id_fkey"
            columns: ["golf_course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_courses: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          holes: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          par: number | null
          raw_data: Json | null
          sr_id: string
          state: string | null
          updated_at: string | null
          yardage: number | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          holes?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          par?: number | null
          raw_data?: Json | null
          sr_id: string
          state?: string | null
          updated_at?: string | null
          yardage?: number | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          holes?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          par?: number | null
          raw_data?: Json | null
          sr_id?: string
          state?: string | null
          updated_at?: string | null
          yardage?: number | null
        }
        Relationships: []
      }
      sr_cron_status: {
        Row: {
          created_at: string | null
          id: string
          job_name: string
          last_duration_ms: number | null
          last_error: string | null
          last_run: string | null
          last_status: string | null
          records_synced: number | null
          tournaments_synced: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_name: string
          last_duration_ms?: number | null
          last_error?: string | null
          last_run?: string | null
          last_status?: string | null
          records_synced?: number | null
          tournaments_synced?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_name?: string
          last_duration_ms?: number | null
          last_error?: string | null
          last_run?: string | null
          last_status?: string | null
          records_synced?: number | null
          tournaments_synced?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sr_editorial_items: {
        Row: {
          assets: Json | null
          byline: string | null
          content_long: string | null
          content_long_html: string | null
          created: string | null
          created_at: string | null
          dateline: string | null
          id: string
          league: string
          original_link: string | null
          provider: string
          provider_content_id: string | null
          refs: Json | null
          sport: string
          title: string | null
          type: string
          updated: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          assets?: Json | null
          byline?: string | null
          content_long?: string | null
          content_long_html?: string | null
          created?: string | null
          created_at?: string | null
          dateline?: string | null
          id: string
          league: string
          original_link?: string | null
          provider: string
          provider_content_id?: string | null
          refs?: Json | null
          sport?: string
          title?: string | null
          type: string
          updated?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          assets?: Json | null
          byline?: string | null
          content_long?: string | null
          content_long_html?: string | null
          created?: string | null
          created_at?: string | null
          dateline?: string | null
          id?: string
          league?: string
          original_link?: string | null
          provider?: string
          provider_content_id?: string | null
          refs?: Json | null
          sport?: string
          title?: string | null
          type?: string
          updated?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      sr_hole_statistics: {
        Row: {
          avg_diff: number | null
          birdies: number | null
          bogeys: number | null
          created_at: string | null
          double_bogeys: number | null
          eagles: number | null
          hole_number: number
          id: string
          other: number | null
          par: number | null
          pars: number | null
          rank: number | null
          raw_data: Json | null
          round_number: number | null
          scoring_average: number | null
          tournament_id: string | null
          yardage: number | null
        }
        Insert: {
          avg_diff?: number | null
          birdies?: number | null
          bogeys?: number | null
          created_at?: string | null
          double_bogeys?: number | null
          eagles?: number | null
          hole_number: number
          id?: string
          other?: number | null
          par?: number | null
          pars?: number | null
          rank?: number | null
          raw_data?: Json | null
          round_number?: number | null
          scoring_average?: number | null
          tournament_id?: string | null
          yardage?: number | null
        }
        Update: {
          avg_diff?: number | null
          birdies?: number | null
          bogeys?: number | null
          created_at?: string | null
          double_bogeys?: number | null
          eagles?: number | null
          hole_number?: number
          id?: string
          other?: number | null
          par?: number | null
          pars?: number | null
          rank?: number | null
          raw_data?: Json | null
          round_number?: number | null
          scoring_average?: number | null
          tournament_id?: string | null
          yardage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_hole_statistics_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_leaderboards: {
        Row: {
          created_at: string | null
          id: string
          losses: number | null
          money: number | null
          player_id: string | null
          points: number | null
          position: number | null
          position_tied: boolean | null
          raw_data: Json | null
          round_1: number | null
          round_2: number | null
          round_3: number | null
          round_4: number | null
          score: number | null
          starting_score: number | null
          status: string | null
          strokes: number | null
          team_id: string | null
          thru: number | null
          thru_updated_at: string | null
          tournament_id: string | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          losses?: number | null
          money?: number | null
          player_id?: string | null
          points?: number | null
          position?: number | null
          position_tied?: boolean | null
          raw_data?: Json | null
          round_1?: number | null
          round_2?: number | null
          round_3?: number | null
          round_4?: number | null
          score?: number | null
          starting_score?: number | null
          status?: string | null
          strokes?: number | null
          team_id?: string | null
          thru?: number | null
          thru_updated_at?: string | null
          tournament_id?: string | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          losses?: number | null
          money?: number | null
          player_id?: string | null
          points?: number | null
          position?: number | null
          position_tied?: boolean | null
          raw_data?: Json | null
          round_1?: number | null
          round_2?: number | null
          round_3?: number | null
          round_4?: number | null
          score?: number | null
          starting_score?: number | null
          status?: string | null
          strokes?: number | null
          team_id?: string | null
          thru?: number | null
          thru_updated_at?: string | null
          tournament_id?: string | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_leaderboards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sr_leaderboards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sr_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sr_leaderboards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_media_provider_availability: {
        Row: {
          asset_type: string
          error_message: string | null
          http_status: number | null
          id: string
          last_checked_at: string | null
          league: string
          manifest_url: string | null
          provider: string
          sport: string
          status: string
        }
        Insert: {
          asset_type: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          last_checked_at?: string | null
          league: string
          manifest_url?: string | null
          provider: string
          sport?: string
          status?: string
        }
        Update: {
          asset_type?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          last_checked_at?: string | null
          league?: string
          manifest_url?: string | null
          provider?: string
          sport?: string
          status?: string
        }
        Relationships: []
      }
      sr_player_images: {
        Row: {
          created_at: string
          image_url: string
          source: string
          sr_player_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          image_url: string
          source?: string
          sr_player_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          image_url?: string
          source?: string
          sr_player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sr_player_images_sr_player_id_fkey"
            columns: ["sr_player_id"]
            isOneToOne: true
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_player_profiles: {
        Row: {
          best_world_ranking: number | null
          bio: string | null
          career_earnings: number | null
          career_wins: number | null
          created_at: string | null
          id: string
          majors_won: number | null
          pga_tour_wins: number | null
          player_id: string | null
          raw_data: Json | null
          updated_at: string | null
        }
        Insert: {
          best_world_ranking?: number | null
          bio?: string | null
          career_earnings?: number | null
          career_wins?: number | null
          created_at?: string | null
          id?: string
          majors_won?: number | null
          pga_tour_wins?: number | null
          player_id?: string | null
          raw_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          best_world_ranking?: number | null
          bio?: string | null
          career_earnings?: number | null
          career_wins?: number | null
          created_at?: string | null
          id?: string
          majors_won?: number | null
          pga_tour_wins?: number | null
          player_id?: string | null
          raw_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_player_profiles_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_player_statistics: {
        Row: {
          created_at: string | null
          cuts_made: number | null
          cuts_missed: number | null
          driving_accuracy: number | null
          driving_distance: number | null
          earnings: number | null
          earnings_rank: number | null
          events_played: number | null
          fedex_points: number | null
          fedex_rank: number | null
          greens_in_reg: number | null
          holes_per_eagle: number | null
          holes_proximity_avg: string | null
          id: string
          player_id: string | null
          putting_average: number | null
          raw_data: Json | null
          sand_saves: number | null
          scoring_average: number | null
          season_id: string | null
          second_place: number | null
          strokes_gained_putting: number | null
          strokes_gained_tee_green: number | null
          third_place: number | null
          top_10s: number | null
          top_25s: number | null
          total_driving: number | null
          updated_at: string | null
          wins: number | null
          withdrawals: number | null
        }
        Insert: {
          created_at?: string | null
          cuts_made?: number | null
          cuts_missed?: number | null
          driving_accuracy?: number | null
          driving_distance?: number | null
          earnings?: number | null
          earnings_rank?: number | null
          events_played?: number | null
          fedex_points?: number | null
          fedex_rank?: number | null
          greens_in_reg?: number | null
          holes_per_eagle?: number | null
          holes_proximity_avg?: string | null
          id?: string
          player_id?: string | null
          putting_average?: number | null
          raw_data?: Json | null
          sand_saves?: number | null
          scoring_average?: number | null
          season_id?: string | null
          second_place?: number | null
          strokes_gained_putting?: number | null
          strokes_gained_tee_green?: number | null
          third_place?: number | null
          top_10s?: number | null
          top_25s?: number | null
          total_driving?: number | null
          updated_at?: string | null
          wins?: number | null
          withdrawals?: number | null
        }
        Update: {
          created_at?: string | null
          cuts_made?: number | null
          cuts_missed?: number | null
          driving_accuracy?: number | null
          driving_distance?: number | null
          earnings?: number | null
          earnings_rank?: number | null
          events_played?: number | null
          fedex_points?: number | null
          fedex_rank?: number | null
          greens_in_reg?: number | null
          holes_per_eagle?: number | null
          holes_proximity_avg?: string | null
          id?: string
          player_id?: string | null
          putting_average?: number | null
          raw_data?: Json | null
          sand_saves?: number | null
          scoring_average?: number | null
          season_id?: string | null
          second_place?: number | null
          strokes_gained_putting?: number | null
          strokes_gained_tee_green?: number | null
          third_place?: number | null
          top_10s?: number | null
          top_25s?: number | null
          total_driving?: number | null
          updated_at?: string | null
          wins?: number | null
          withdrawals?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_player_statistics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sr_player_statistics_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "sr_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_players: {
        Row: {
          abbr_name: string | null
          birth_date: string | null
          birth_place: string | null
          college: string | null
          college_normalized: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          handedness: string | null
          headshot_override: string | null
          height: string | null
          id: string
          is_amateur: boolean | null
          is_member: boolean | null
          last_name: string | null
          pga_tour_id: string | null
          photo_asset_id: string | null
          photo_updated_at: string | null
          photo_url: string | null
          raw_data: Json | null
          residence: string | null
          sr_id: string
          tour_codes: string[] | null
          turned_pro: number | null
          updated_at: string | null
          weight: string | null
        }
        Insert: {
          abbr_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          college?: string | null
          college_normalized?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          handedness?: string | null
          headshot_override?: string | null
          height?: string | null
          id?: string
          is_amateur?: boolean | null
          is_member?: boolean | null
          last_name?: string | null
          pga_tour_id?: string | null
          photo_asset_id?: string | null
          photo_updated_at?: string | null
          photo_url?: string | null
          raw_data?: Json | null
          residence?: string | null
          sr_id: string
          tour_codes?: string[] | null
          turned_pro?: number | null
          updated_at?: string | null
          weight?: string | null
        }
        Update: {
          abbr_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          college?: string | null
          college_normalized?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          handedness?: string | null
          headshot_override?: string | null
          height?: string | null
          id?: string
          is_amateur?: boolean | null
          is_member?: boolean | null
          last_name?: string | null
          pga_tour_id?: string | null
          photo_asset_id?: string | null
          photo_updated_at?: string | null
          photo_url?: string | null
          raw_data?: Json | null
          residence?: string | null
          sr_id?: string
          tour_codes?: string[] | null
          turned_pro?: number | null
          updated_at?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      sr_scorecards: {
        Row: {
          birdies: number | null
          bogeys: number | null
          created_at: string | null
          double_bogeys: number | null
          eagles: number | null
          hole_number: number
          holes_in_one: number | null
          id: string
          other_scores: number | null
          par: number | null
          pars: number | null
          player_id: string | null
          raw_data: Json | null
          round_number: number
          round_score: number | null
          round_strokes: number | null
          score_to_par: number | null
          starting_hole: number | null
          strokes: number | null
          thru: number | null
          tournament_id: string | null
        }
        Insert: {
          birdies?: number | null
          bogeys?: number | null
          created_at?: string | null
          double_bogeys?: number | null
          eagles?: number | null
          hole_number: number
          holes_in_one?: number | null
          id?: string
          other_scores?: number | null
          par?: number | null
          pars?: number | null
          player_id?: string | null
          raw_data?: Json | null
          round_number: number
          round_score?: number | null
          round_strokes?: number | null
          score_to_par?: number | null
          starting_hole?: number | null
          strokes?: number | null
          thru?: number | null
          tournament_id?: string | null
        }
        Update: {
          birdies?: number | null
          bogeys?: number | null
          created_at?: string | null
          double_bogeys?: number | null
          eagles?: number | null
          hole_number?: number
          holes_in_one?: number | null
          id?: string
          other_scores?: number | null
          par?: number | null
          pars?: number | null
          player_id?: string | null
          raw_data?: Json | null
          round_number?: number
          round_score?: number | null
          round_strokes?: number | null
          score_to_par?: number | null
          starting_hole?: number | null
          strokes?: number | null
          thru?: number | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_scorecards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sr_scorecards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_seasons: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          sr_id: string
          start_date: string | null
          status: string | null
          tour_full_name: string | null
          tour_id: string
          tour_name: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          sr_id: string
          start_date?: string | null
          status?: string | null
          tour_full_name?: string | null
          tour_id: string
          tour_name: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          sr_id?: string
          start_date?: string | null
          status?: string | null
          tour_full_name?: string | null
          tour_id?: string
          tour_name?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      sr_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          season_id: string | null
          started_at: string
          status: string
          sync_type: string
          tour_id: string | null
          tournament_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          season_id?: string | null
          started_at?: string
          status: string
          sync_type: string
          tour_id?: string | null
          tournament_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          season_id?: string | null
          started_at?: string
          status?: string
          sync_type?: string
          tour_id?: string | null
          tournament_id?: string | null
        }
        Relationships: []
      }
      sr_team_players: {
        Row: {
          player_id: string
          position_in_team: number
          team_id: string
        }
        Insert: {
          player_id: string
          position_in_team: number
          team_id: string
        }
        Update: {
          player_id?: string
          position_in_team?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sr_team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sr_team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sr_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_teams: {
        Row: {
          abbr_name: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          raw_data: Json | null
          sr_id: string
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          abbr_name?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          raw_data?: Json | null
          sr_id: string
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          abbr_name?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          raw_data?: Json | null
          sr_id?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sr_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_tee_time_players: {
        Row: {
          created_at: string | null
          id: string
          player_id: string | null
          position: number | null
          tee_time_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          position?: number | null
          tee_time_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          player_id?: string | null
          position?: number | null
          tee_time_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_tee_time_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sr_tee_time_players_tee_time_id_fkey"
            columns: ["tee_time_id"]
            isOneToOne: false
            referencedRelation: "sr_tee_times"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_tee_times: {
        Row: {
          back_nine: boolean | null
          created_at: string | null
          id: string
          pairing_id: string | null
          raw_data: Json | null
          round_number: number
          tee_number: number | null
          tee_time: string
          tournament_id: string | null
        }
        Insert: {
          back_nine?: boolean | null
          created_at?: string | null
          id?: string
          pairing_id?: string | null
          raw_data?: Json | null
          round_number: number
          tee_number?: number | null
          tee_time: string
          tournament_id?: string | null
        }
        Update: {
          back_nine?: boolean | null
          created_at?: string | null
          id?: string
          pairing_id?: string | null
          raw_data?: Json | null
          round_number?: number
          tee_number?: number | null
          tee_time?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_tee_times_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_tournament_summaries: {
        Row: {
          broadcast_cable: string | null
          broadcast_internet: string | null
          broadcast_network: string | null
          course_conditions: string | null
          created_at: string | null
          cut_score: number | null
          field_size: number | null
          id: string
          raw_data: Json | null
          temperature: string | null
          tournament_id: string | null
          updated_at: string | null
          weather_conditions: string | null
          wind_direction: string | null
          wind_speed: string | null
        }
        Insert: {
          broadcast_cable?: string | null
          broadcast_internet?: string | null
          broadcast_network?: string | null
          course_conditions?: string | null
          created_at?: string | null
          cut_score?: number | null
          field_size?: number | null
          id?: string
          raw_data?: Json | null
          temperature?: string | null
          tournament_id?: string | null
          updated_at?: string | null
          weather_conditions?: string | null
          wind_direction?: string | null
          wind_speed?: string | null
        }
        Update: {
          broadcast_cable?: string | null
          broadcast_internet?: string | null
          broadcast_network?: string | null
          course_conditions?: string | null
          created_at?: string | null
          cut_score?: number | null
          field_size?: number | null
          id?: string
          raw_data?: Json | null
          temperature?: string | null
          tournament_id?: string | null
          updated_at?: string | null
          weather_conditions?: string | null
          wind_direction?: string | null
          wind_speed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_tournament_summaries_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_tournaments: {
        Row: {
          champion_narrative: string | null
          course_timezone: string | null
          coverage: string | null
          created_at: string
          currency: string | null
          current_round: number | null
          cut_round: number | null
          cutline: number | null
          defending_champion: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_featured: boolean | null
          last_live_sync: string | null
          name: string
          network: string | null
          parent_id: string | null
          points: number | null
          points_type: string | null
          projected_cutline: number | null
          purse: number | null
          raw_data: Json | null
          scoring_system: string | null
          season_id: string | null
          sr_id: string
          start_date: string | null
          status: string | null
          timezone: string | null
          updated_at: string
          venue_city: string | null
          venue_country: string | null
          venue_course_name: string | null
          venue_id: string | null
          venue_latitude: string | null
          venue_longitude: string | null
          venue_name: string | null
          venue_par: number | null
          venue_state: string | null
          venue_yardage: number | null
          venue_zipcode: string | null
          winner_id: string | null
          winning_share: number | null
        }
        Insert: {
          champion_narrative?: string | null
          course_timezone?: string | null
          coverage?: string | null
          created_at?: string
          currency?: string | null
          current_round?: number | null
          cut_round?: number | null
          cutline?: number | null
          defending_champion?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_featured?: boolean | null
          last_live_sync?: string | null
          name: string
          network?: string | null
          parent_id?: string | null
          points?: number | null
          points_type?: string | null
          projected_cutline?: number | null
          purse?: number | null
          raw_data?: Json | null
          scoring_system?: string | null
          season_id?: string | null
          sr_id: string
          start_date?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          venue_city?: string | null
          venue_country?: string | null
          venue_course_name?: string | null
          venue_id?: string | null
          venue_latitude?: string | null
          venue_longitude?: string | null
          venue_name?: string | null
          venue_par?: number | null
          venue_state?: string | null
          venue_yardage?: number | null
          venue_zipcode?: string | null
          winner_id?: string | null
          winning_share?: number | null
        }
        Update: {
          champion_narrative?: string | null
          course_timezone?: string | null
          coverage?: string | null
          created_at?: string
          currency?: string | null
          current_round?: number | null
          cut_round?: number | null
          cutline?: number | null
          defending_champion?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_featured?: boolean | null
          last_live_sync?: string | null
          name?: string
          network?: string | null
          parent_id?: string | null
          points?: number | null
          points_type?: string | null
          projected_cutline?: number | null
          purse?: number | null
          raw_data?: Json | null
          scoring_system?: string | null
          season_id?: string | null
          sr_id?: string
          start_date?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          venue_city?: string | null
          venue_country?: string | null
          venue_course_name?: string | null
          venue_id?: string | null
          venue_latitude?: string | null
          venue_longitude?: string | null
          venue_name?: string | null
          venue_par?: number | null
          venue_state?: string | null
          venue_yardage?: number | null
          venue_zipcode?: string | null
          winner_id?: string | null
          winning_share?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "sr_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      sr_world_rankings: {
        Row: {
          avg_points: number | null
          created_at: string | null
          events_played: number | null
          id: string
          player_id: string | null
          points: number | null
          points_gained: number | null
          points_lost: number | null
          prior_rank: number | null
          rank: number
          ranking_date: string
          ranking_id: string | null
          ranking_status: string | null
          raw_data: Json | null
          tied: boolean | null
        }
        Insert: {
          avg_points?: number | null
          created_at?: string | null
          events_played?: number | null
          id?: string
          player_id?: string | null
          points?: number | null
          points_gained?: number | null
          points_lost?: number | null
          prior_rank?: number | null
          rank: number
          ranking_date: string
          ranking_id?: string | null
          ranking_status?: string | null
          raw_data?: Json | null
          tied?: boolean | null
        }
        Update: {
          avg_points?: number | null
          created_at?: string | null
          events_played?: number | null
          id?: string
          player_id?: string | null
          points?: number | null
          points_gained?: number | null
          points_lost?: number | null
          prior_rank?: number | null
          rank?: number
          ranking_date?: string
          ranking_id?: string | null
          ranking_status?: string | null
          raw_data?: Json | null
          tied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sr_world_rankings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          daily_streak: number | null
          last_daily_action: string | null
          last_monthly_action: string | null
          last_weekly_action: string | null
          monthly_streak: number | null
          updated_at: string | null
          user_id: string
          weekly_streak: number | null
        }
        Insert: {
          daily_streak?: number | null
          last_daily_action?: string | null
          last_monthly_action?: string | null
          last_weekly_action?: string | null
          monthly_streak?: number | null
          updated_at?: string | null
          user_id: string
          weekly_streak?: number | null
        }
        Update: {
          daily_streak?: number | null
          last_daily_action?: string | null
          last_monthly_action?: string | null
          last_weekly_action?: string | null
          monthly_streak?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_assets: {
        Row: {
          created_at: string
          post_id: string | null
          status: string
          uid: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id?: string | null
          status?: string
          uid: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string | null
          status?: string
          uid?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          context: Json | null
          created_at: string
          description: string
          id: string
          status: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          description: string
          id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          description?: string
          id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string | null
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tee_time_group_players: {
        Row: {
          created_at: string
          group_id: string
          id: string
          participant_id: string
          playing_handicap: number | null
          position: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          participant_id: string
          playing_handicap?: number | null
          position?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          participant_id?: string
          playing_handicap?: number | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "tee_time_group_players_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tee_time_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tee_time_group_players_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tee_time_groups: {
        Row: {
          created_at: string
          group_name: string | null
          group_number: number
          id: string
          round_id: string
          starting_hole: number | null
          status: string
          tee_time: string
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          group_number: number
          id?: string
          round_id: string
          starting_hole?: number | null
          status?: string
          tee_time: string
        }
        Update: {
          created_at?: string
          group_name?: string | null
          group_number?: number
          id?: string
          round_id?: string
          starting_hole?: number | null
          status?: string
          tee_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "tee_time_groups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "event_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      top_ten_comment_mentions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          mentioned_user_id: string
          mentioned_username: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          mentioned_username: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          mentioned_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_ten_comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "top_ten_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comment_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "top_ten_comment_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comment_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top_ten_comments: {
        Row: {
          body: string
          commenter_id: string
          course_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          parent_id: string | null
          target_user_id: string
        }
        Insert: {
          body: string
          commenter_id: string
          course_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          target_user_id: string
        }
        Update: {
          body?: string
          commenter_id?: string
          course_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_ten_comments_commenter_id_profiles_fkey"
            columns: ["commenter_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "top_ten_comments_commenter_id_profiles_fkey"
            columns: ["commenter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comments_commenter_id_profiles_fkey"
            columns: ["commenter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "top_ten_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comments_target_user_id_profiles_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "top_ten_comments_target_user_id_profiles_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_comments_target_user_id_profiles_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top_ten_reactions: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          reaction_type: string
          reactor_id: string
          target_user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          reaction_type: string
          reactor_id: string
          target_user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          reaction_type?: string
          reactor_id?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "top_ten_reactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_reactions_reactor_id_profiles_fkey"
            columns: ["reactor_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "top_ten_reactions_reactor_id_profiles_fkey"
            columns: ["reactor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_reactions_reactor_id_profiles_fkey"
            columns: ["reactor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_reactions_target_user_id_profiles_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "top_ten_reactions_target_user_id_profiles_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "top_ten_reactions_target_user_id_profiles_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      top100_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          short_label: string
          slug: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          short_label: string
          slug: string
          sort_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          short_label?: string
          slug?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tour_season_rankings: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          manual_player_id: string | null
          player_id: string | null
          player_name: string
          points: number | null
          position: number
          position_change: string | null
          scraped_at: string | null
          season_year: number
          tour_code: string
          tournaments_played: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          manual_player_id?: string | null
          player_id?: string | null
          player_name: string
          points?: number | null
          position: number
          position_change?: string | null
          scraped_at?: string | null
          season_year: number
          tour_code: string
          tournaments_played?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          manual_player_id?: string | null
          player_id?: string | null
          player_name?: string
          points?: number | null
          position?: number
          position_change?: string | null
          scraped_at?: string | null
          season_year?: number
          tour_code?: string
          tournaments_played?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_season_rankings_manual_player_id_fkey"
            columns: ["manual_player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_season_rankings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "sr_players"
            referencedColumns: ["id"]
          },
        ]
      }
      tourhub_event_enrichment: {
        Row: {
          created_at: string
          data: Json
          espn_event_id: string
          id: string
          provider: string
          tour: string
          year: number
        }
        Insert: {
          created_at?: string
          data?: Json
          espn_event_id: string
          id?: string
          provider?: string
          tour: string
          year: number
        }
        Update: {
          created_at?: string
          data?: Json
          espn_event_id?: string
          id?: string
          provider?: string
          tour?: string
          year?: number
        }
        Relationships: []
      }
      tourhub_event_mappings: {
        Row: {
          confidence: number
          created_at: string
          espn_event_id: string
          espn_name: string | null
          id: string
          last_verified_at: string | null
          livegolf_event_id: string | null
          match_method: string
          matched_at: string | null
          matched_by: string | null
          notes: string | null
          slashgolf_name: string | null
          slashgolf_tourn_id: string | null
          tour: string
          updated_at: string
          year: number
        }
        Insert: {
          confidence?: number
          created_at?: string
          espn_event_id: string
          espn_name?: string | null
          id?: string
          last_verified_at?: string | null
          livegolf_event_id?: string | null
          match_method?: string
          matched_at?: string | null
          matched_by?: string | null
          notes?: string | null
          slashgolf_name?: string | null
          slashgolf_tourn_id?: string | null
          tour: string
          updated_at?: string
          year: number
        }
        Update: {
          confidence?: number
          created_at?: string
          espn_event_id?: string
          espn_name?: string | null
          id?: string
          last_verified_at?: string | null
          livegolf_event_id?: string | null
          match_method?: string
          matched_at?: string | null
          matched_by?: string | null
          notes?: string | null
          slashgolf_name?: string | null
          slashgolf_tourn_id?: string | null
          tour?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      tourhub_events_deprecated: {
        Row: {
          course_name: string | null
          created_at: string
          end_date: string | null
          espn_event_id: string
          event_url: string | null
          id: string
          last_fetched_at: string
          location: string | null
          logo_url: string | null
          name: string
          start_date: string | null
          status: string
          tour: string
          updated_at: string
        }
        Insert: {
          course_name?: string | null
          created_at?: string
          end_date?: string | null
          espn_event_id: string
          event_url?: string | null
          id?: string
          last_fetched_at?: string
          location?: string | null
          logo_url?: string | null
          name: string
          start_date?: string | null
          status?: string
          tour: string
          updated_at?: string
        }
        Update: {
          course_name?: string | null
          created_at?: string
          end_date?: string | null
          espn_event_id?: string
          event_url?: string | null
          id?: string
          last_fetched_at?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          start_date?: string | null
          status?: string
          tour?: string
          updated_at?: string
        }
        Relationships: []
      }
      tourhub_leaderboard_snapshots: {
        Row: {
          espn_event_id: string
          fetched_at: string
          id: string
          payload: Json
          provider: string
          round: number | null
          status: string | null
          tour: string
        }
        Insert: {
          espn_event_id: string
          fetched_at?: string
          id?: string
          payload: Json
          provider?: string
          round?: number | null
          status?: string | null
          tour: string
        }
        Update: {
          espn_event_id?: string
          fetched_at?: string
          id?: string
          payload?: Json
          provider?: string
          round?: number | null
          status?: string | null
          tour?: string
        }
        Relationships: []
      }
      tourhub_players_deprecated: {
        Row: {
          bio: string | null
          country: string | null
          created_at: string
          espn_athlete_id: string | null
          headshot_url: string | null
          id: string
          name: string | null
          payload: Json | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          country?: string | null
          created_at?: string
          espn_athlete_id?: string | null
          headshot_url?: string | null
          id?: string
          name?: string | null
          payload?: Json | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          country?: string | null
          created_at?: string
          espn_athlete_id?: string | null
          headshot_url?: string | null
          id?: string
          name?: string | null
          payload?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      tournament_picks: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean | null
          picked_at: string
          player_id: string | null
          player_name: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          picked_at?: string
          player_id?: string | null
          player_name: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          picked_at?: string
          player_id?: string | null
          player_name?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tournament_result_meta: {
        Row: {
          course_image_url: string | null
          id: string
          injected_at: string
          podium_rows: Json
          post_id: string
          stat_birdies: number | null
          stat_bogeys: number | null
          stat_driving_distance: number | null
          stat_eagles: number | null
          stat_fairways_pct: number | null
          stat_gir_pct: number | null
          stat_pars: number | null
          stat_putts: number | null
          tour_name: string
          tour_priority: number
          tour_slug: string
          tournament_id: string
          tournament_name: string
          venue_city: string | null
          venue_country: string | null
          venue_name: string | null
          winner_by: string | null
          winner_id: string | null
          winner_name: string
          winner_photo_url: string | null
          winner_score: number
          winner_score_display: string
        }
        Insert: {
          course_image_url?: string | null
          id?: string
          injected_at?: string
          podium_rows?: Json
          post_id: string
          stat_birdies?: number | null
          stat_bogeys?: number | null
          stat_driving_distance?: number | null
          stat_eagles?: number | null
          stat_fairways_pct?: number | null
          stat_gir_pct?: number | null
          stat_pars?: number | null
          stat_putts?: number | null
          tour_name: string
          tour_priority?: number
          tour_slug: string
          tournament_id: string
          tournament_name: string
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          winner_by?: string | null
          winner_id?: string | null
          winner_name: string
          winner_photo_url?: string | null
          winner_score: number
          winner_score_display: string
        }
        Update: {
          course_image_url?: string | null
          id?: string
          injected_at?: string
          podium_rows?: Json
          post_id?: string
          stat_birdies?: number | null
          stat_bogeys?: number | null
          stat_driving_distance?: number | null
          stat_eagles?: number | null
          stat_fairways_pct?: number | null
          stat_gir_pct?: number | null
          stat_pars?: number | null
          stat_putts?: number | null
          tour_name?: string
          tour_priority?: number
          tour_slug?: string
          tournament_id?: string
          tournament_name?: string
          venue_city?: string | null
          venue_country?: string | null
          venue_name?: string | null
          winner_by?: string | null
          winner_id?: string | null
          winner_name?: string
          winner_photo_url?: string | null
          winner_score?: number
          winner_score_display?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_result_meta_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_result_meta_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "sr_tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          request_message: string | null
          request_message_updated_at: string | null
          role: string
          rsvp_status: string
          rsvp_updated_at: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          request_message?: string | null
          request_message_updated_at?: string | null
          role?: string
          rsvp_status?: string
          rsvp_updated_at?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          request_message?: string | null
          request_message_updated_at?: string | null
          role?: string
          rsvp_status?: string
          rsvp_updated_at?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "discover_trips_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_as_events"
            referencedColumns: ["legacy_trip_id"]
          },
        ]
      }
      trip_timeline_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          occurs_at: string | null
          text: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          occurs_at?: string | null
          text: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          occurs_at?: string | null
          text?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_timeline_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "discover_trips_anon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_timeline_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_timeline_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_as_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_timeline_notes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_as_events"
            referencedColumns: ["legacy_trip_id"]
          },
        ]
      }
      trips: {
        Row: {
          cancelled_at: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          cancelled_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          cancelled_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_id: string | null
          id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          achievement_type: string | null
          id: string
          source_context: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          achievement_type?: string | null
          id?: string
          source_context?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          achievement_type?: string | null
          id?: string
          source_context?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "user_achievements_view"
            referencedColumns: ["achievement_id"]
          },
        ]
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
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
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
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_value: number | null
          id: string
          is_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_preferences: {
        Row: {
          course_id: string | null
          last_interaction_at: string
          post_id: string
          progress_seconds: number | null
          signal_type: string
          total_seconds: number | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          last_interaction_at?: string
          post_id: string
          progress_seconds?: number | null
          signal_type: string
          total_seconds?: number | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          last_interaction_at?: string
          post_id?: string
          progress_seconds?: number | null
          signal_type?: string
          total_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_preferences_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cosmetic_unlocks: {
        Row: {
          id: string
          item_id: string | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          item_id?: string | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_cosmetic_unlocks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "season_shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cosmetic_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_cosmetic_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cosmetic_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_personal_rank: {
        Row: {
          course_id: string
          personal_rank: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          personal_rank: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          personal_rank?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_personal_rank_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
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
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
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
      user_exploration_stats: {
        Row: {
          continent_list: string[] | null
          continents_played: number | null
          countries_played: number
          country_list: string[] | null
          id: string
          last_country_added_at: string | null
          last_region_completed_at: string | null
          region_list: string[] | null
          regions_completed: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          continent_list?: string[] | null
          continents_played?: number | null
          countries_played?: number
          country_list?: string[] | null
          id?: string
          last_country_added_at?: string | null
          last_region_completed_at?: string | null
          region_list?: string[] | null
          regions_completed?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          continent_list?: string[] | null
          continents_played?: number | null
          countries_played?: number
          country_list?: string[] | null
          id?: string
          last_country_added_at?: string | null
          last_region_completed_at?: string | null
          region_list?: string[] | null
          regions_completed?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exploration_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_exploration_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exploration_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_followed_colleges: {
        Row: {
          created_at: string
          id: string
          normalized_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          normalized_name?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_follower_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_following_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_friends_friend_fk"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_friend_fk"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_friend_fk"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_friends_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_friends_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hall_of_fame: {
        Row: {
          all_time_countries_visited: number
          all_time_courses_logged: number
          id: string
          last_win_season_id: string | null
          podium_finishes: number
          seasons_won: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_time_countries_visited?: number
          all_time_courses_logged?: number
          id?: string
          last_win_season_id?: string | null
          podium_finishes?: number
          seasons_won?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_time_countries_visited?: number
          all_time_courses_logged?: number
          id?: string
          last_win_season_id?: string | null
          podium_finishes?: number
          seasons_won?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hall_of_fame_last_win_season_id_fkey"
            columns: ["last_win_season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hall_of_fame_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_hall_of_fame_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hall_of_fame_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_handicap_history: {
        Row: {
          change_amount: number | null
          created_at: string
          handicap_value: number
          id: string
          previous_value: number | null
          recorded_at: string
          season_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          change_amount?: number | null
          created_at?: string
          handicap_value: number
          id?: string
          previous_value?: number | null
          recorded_at?: string
          season_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          change_amount?: number | null
          created_at?: string
          handicap_value?: number
          id?: string
          previous_value?: number | null
          recorded_at?: string
          season_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_handicap_history_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_handicap_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_handicap_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_handicap_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_home_clubs: {
        Row: {
          business_id: string | null
          club_id: string
          created_at: string
          id: string
          user_profile_id: string
        }
        Insert: {
          business_id?: string | null
          club_id: string
          created_at?: string
          id?: string
          user_profile_id: string
        }
        Update: {
          business_id?: string | null
          club_id?: string
          created_at?: string
          id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_home_clubs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_home_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_home_clubs_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_home_clubs_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_home_clubs_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_presence: {
        Row: {
          last_seen_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          actor_type: string | null
          additional_clubs_visibility: string
          background_image_url: string | null
          bag_visible: boolean | null
          bio: string | null
          business_bio: string | null
          business_category: string | null
          business_contact_email: string | null
          business_contact_phone: string | null
          business_location: string | null
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          business_website: string | null
          city: string
          college_id: string | null
          college_normalized: string | null
          contact_person_name: string | null
          country: string
          cover_photo_url: string | null
          created_at: string | null
          creator_enabled_at: string | null
          creator_only: boolean
          deleted_at: string | null
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
          featured_post_id: string | null
          gender: string | null
          golfer_verified_at: string | null
          golfer_verified_by: string | null
          handicap_sync_interest: boolean | null
          handicap_sync_interest_at: string | null
          has_completed_onboarding: boolean | null
          has_profile_video: boolean | null
          has_seen_creator_welcome: boolean | null
          has_seen_watch_longpress_tip: boolean
          header_photo_url: string | null
          home_club: string | null
          home_club_business_id: string | null
          home_club_id: string | null
          home_club_pending_key: string | null
          home_club_pending_name: string | null
          home_club_visibility: string
          id: string
          instagram_handle: string
          is_business_verified: boolean | null
          is_creator: boolean
          is_official_club: boolean | null
          is_public: boolean | null
          is_suspended: boolean
          is_test: boolean
          is_verified: boolean | null
          is_verified_business: boolean
          is_verified_golfer: boolean
          last_notifications_seen_at: string | null
          last_rating_at: string | null
          last_seen_post_id: string | null
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
          pinned_post_ids: string[] | null
          primary_club_id: string | null
          profile_photo_url: string | null
          profile_type: string | null
          profile_video_thumbnail_url: string | null
          profile_video_url: string | null
          profile_video_visibility: string | null
          recent_activity_badges: Json | null
          show_achievements_public: boolean | null
          show_additional_home_clubs: boolean
          show_handicap: boolean
          show_in_exploration_leaderboards: boolean
          show_in_handicap_leaderboards: boolean
          social_links: Json | null
          tiktok_handle: string
          top_ten_comments_privacy: string | null
          top100_visible: boolean | null
          tracker_visible: boolean | null
          twitter_handle: string
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          username: string | null
          username_is_custom: boolean
          verification_notes: string | null
          verification_requested_at: string | null
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          verification_status: string | null
          verified_business_at: string | null
          verified_business_notes: string | null
          website_url: string | null
          websites: string[] | null
          youtube_handle: string
        }
        Insert: {
          actor_type?: string | null
          additional_clubs_visibility?: string
          background_image_url?: string | null
          bag_visible?: boolean | null
          bio?: string | null
          business_bio?: string | null
          business_category?: string | null
          business_contact_email?: string | null
          business_contact_phone?: string | null
          business_location?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          business_website?: string | null
          city?: string
          college_id?: string | null
          college_normalized?: string | null
          contact_person_name?: string | null
          country?: string
          cover_photo_url?: string | null
          created_at?: string | null
          creator_enabled_at?: string | null
          creator_only?: boolean
          deleted_at?: string | null
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
          featured_post_id?: string | null
          gender?: string | null
          golfer_verified_at?: string | null
          golfer_verified_by?: string | null
          handicap_sync_interest?: boolean | null
          handicap_sync_interest_at?: string | null
          has_completed_onboarding?: boolean | null
          has_profile_video?: boolean | null
          has_seen_creator_welcome?: boolean | null
          has_seen_watch_longpress_tip?: boolean
          header_photo_url?: string | null
          home_club?: string | null
          home_club_business_id?: string | null
          home_club_id?: string | null
          home_club_pending_key?: string | null
          home_club_pending_name?: string | null
          home_club_visibility?: string
          id: string
          instagram_handle?: string
          is_business_verified?: boolean | null
          is_creator?: boolean
          is_official_club?: boolean | null
          is_public?: boolean | null
          is_suspended?: boolean
          is_test?: boolean
          is_verified?: boolean | null
          is_verified_business?: boolean
          is_verified_golfer?: boolean
          last_notifications_seen_at?: string | null
          last_rating_at?: string | null
          last_seen_post_id?: string | null
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
          pinned_post_ids?: string[] | null
          primary_club_id?: string | null
          profile_photo_url?: string | null
          profile_type?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          profile_video_visibility?: string | null
          recent_activity_badges?: Json | null
          show_achievements_public?: boolean | null
          show_additional_home_clubs?: boolean
          show_handicap?: boolean
          show_in_exploration_leaderboards?: boolean
          show_in_handicap_leaderboards?: boolean
          social_links?: Json | null
          tiktok_handle?: string
          top_ten_comments_privacy?: string | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          twitter_handle?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          username_is_custom?: boolean
          verification_notes?: string | null
          verification_requested_at?: string | null
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          verification_status?: string | null
          verified_business_at?: string | null
          verified_business_notes?: string | null
          website_url?: string | null
          websites?: string[] | null
          youtube_handle?: string
        }
        Update: {
          actor_type?: string | null
          additional_clubs_visibility?: string
          background_image_url?: string | null
          bag_visible?: boolean | null
          bio?: string | null
          business_bio?: string | null
          business_category?: string | null
          business_contact_email?: string | null
          business_contact_phone?: string | null
          business_location?: string | null
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          business_website?: string | null
          city?: string
          college_id?: string | null
          college_normalized?: string | null
          contact_person_name?: string | null
          country?: string
          cover_photo_url?: string | null
          created_at?: string | null
          creator_enabled_at?: string | null
          creator_only?: boolean
          deleted_at?: string | null
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
          featured_post_id?: string | null
          gender?: string | null
          golfer_verified_at?: string | null
          golfer_verified_by?: string | null
          handicap_sync_interest?: boolean | null
          handicap_sync_interest_at?: string | null
          has_completed_onboarding?: boolean | null
          has_profile_video?: boolean | null
          has_seen_creator_welcome?: boolean | null
          has_seen_watch_longpress_tip?: boolean
          header_photo_url?: string | null
          home_club?: string | null
          home_club_business_id?: string | null
          home_club_id?: string | null
          home_club_pending_key?: string | null
          home_club_pending_name?: string | null
          home_club_visibility?: string
          id?: string
          instagram_handle?: string
          is_business_verified?: boolean | null
          is_creator?: boolean
          is_official_club?: boolean | null
          is_public?: boolean | null
          is_suspended?: boolean
          is_test?: boolean
          is_verified?: boolean | null
          is_verified_business?: boolean
          is_verified_golfer?: boolean
          last_notifications_seen_at?: string | null
          last_rating_at?: string | null
          last_seen_post_id?: string | null
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
          pinned_post_ids?: string[] | null
          primary_club_id?: string | null
          profile_photo_url?: string | null
          profile_type?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          profile_video_visibility?: string | null
          recent_activity_badges?: Json | null
          show_achievements_public?: boolean | null
          show_additional_home_clubs?: boolean
          show_handicap?: boolean
          show_in_exploration_leaderboards?: boolean
          show_in_handicap_leaderboards?: boolean
          social_links?: Json | null
          tiktok_handle?: string
          top_ten_comments_privacy?: string | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          twitter_handle?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          username_is_custom?: boolean
          verification_notes?: string | null
          verification_requested_at?: string | null
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          verification_status?: string | null
          verified_business_at?: string | null
          verified_business_notes?: string | null
          website_url?: string | null
          websites?: string[] | null
          youtube_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_home_club"
            columns: ["home_club_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "college_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_featured_post_id_fkey"
            columns: ["featured_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_home_club_business_id_fkey"
            columns: ["home_club_business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_last_seen_post_id_fkey"
            columns: ["last_seen_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_primary_club_id_fkey"
            columns: ["primary_club_id"]
            isOneToOne: false
            referencedRelation: "golf_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_devices: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          onesignal_external_id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          onesignal_external_id: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          onesignal_external_id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rank_snapshots: {
        Row: {
          courses_logged: number
          created_at: string | null
          division: string
          global_rank: number
          id: string
          region_slug: string | null
          regional_rank: number | null
          season_id: string
          snapshot_date: string
          user_id: string
        }
        Insert: {
          courses_logged: number
          created_at?: string | null
          division: string
          global_rank: number
          id?: string
          region_slug?: string | null
          regional_rank?: number | null
          season_id: string
          snapshot_date: string
          user_id: string
        }
        Update: {
          courses_logged?: number
          created_at?: string | null
          division?: string
          global_rank?: number
          id?: string
          region_slug?: string | null
          regional_rank?: number | null
          season_id?: string
          snapshot_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rank_snapshots_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rank_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rank_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rank_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_relationships: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      user_rivals: {
        Row: {
          created_at: string | null
          current_gap: number | null
          id: string
          is_active: boolean | null
          rival_id: string
          rival_type: string
          times_been_overtaken: number | null
          times_overtaken: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_gap?: number | null
          id?: string
          is_active?: boolean | null
          rival_id: string
          rival_type?: string
          times_been_overtaken?: number | null
          times_overtaken?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_gap?: number | null
          id?: string
          is_active?: boolean | null
          rival_id?: string
          rival_type?: string
          times_been_overtaken?: number | null
          times_overtaken?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rivals_rival_id_fkey"
            columns: ["rival_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rivals_rival_id_fkey"
            columns: ["rival_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rivals_rival_id_fkey"
            columns: ["rival_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rivals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_rivals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rivals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
      user_season_currency: {
        Row: {
          balance: number | null
          lifetime_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          lifetime_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          lifetime_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_season_currency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_season_currency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_season_currency_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_season_results: {
        Row: {
          badge_icon: string | null
          created_at: string | null
          final_rank: number
          final_xp: number
          id: string
          reward_tier: string
          season_id: string
          user_id: string
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string | null
          final_rank: number
          final_xp: number
          id?: string
          reward_tier: string
          season_id: string
          user_id: string
        }
        Update: {
          badge_icon?: string | null
          created_at?: string | null
          final_rank?: number
          final_xp?: number
          id?: string
          reward_tier?: string
          season_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_season_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "user_season_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_season_results_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
        ]
      }
      user_season_stats: {
        Row: {
          active_streak_days: number | null
          best_rank: number | null
          courses_logged: number
          created_at: string | null
          current_division: string
          current_rank: number | null
          highest_division_reached: string
          id: string
          last_activity_at: string | null
          longest_streak_days: number | null
          promotion_count: number | null
          rank_at_season_end: number | null
          season_id: string
          streak_last_updated: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_streak_days?: number | null
          best_rank?: number | null
          courses_logged?: number
          created_at?: string | null
          current_division?: string
          current_rank?: number | null
          highest_division_reached?: string
          id?: string
          last_activity_at?: string | null
          longest_streak_days?: number | null
          promotion_count?: number | null
          rank_at_season_end?: number | null
          season_id: string
          streak_last_updated?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_streak_days?: number | null
          best_rank?: number | null
          courses_logged?: number
          created_at?: string | null
          current_division?: string
          current_rank?: number | null
          highest_division_reached?: string
          id?: string
          last_activity_at?: string | null
          longest_streak_days?: number | null
          promotion_count?: number | null
          rank_at_season_end?: number | null
          season_id?: string
          streak_last_updated?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "championship_seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_season_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_season_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_season_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_seen_season_recaps: {
        Row: {
          season_id: string
          seen_at: string | null
          user_id: string
        }
        Insert: {
          season_id: string
          seen_at?: string | null
          user_id: string
        }
        Update: {
          season_id?: string
          seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seen_season_recaps_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "user_seen_season_recaps_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_seen_season_recaps_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak_months: number
          current_streak_start: string | null
          id: string
          last_activity_month: string | null
          longest_streak_end: string | null
          longest_streak_months: number
          longest_streak_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak_months?: number
          current_streak_start?: string | null
          id?: string
          last_activity_month?: string | null
          longest_streak_end?: string | null
          longest_streak_months?: number
          longest_streak_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak_months?: number
          current_streak_start?: string | null
          id?: string
          last_activity_month?: string | null
          longest_streak_end?: string | null
          longest_streak_months?: number
          longest_streak_start?: string | null
          updated_at?: string
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
      user_top_ten_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_pinned: boolean
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          position: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_top_ten_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
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
      user_top10_exclusions: {
        Row: {
          course_id: string
          created_at: string
          id: string
          position: number | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          position?: number | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          position?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_top10_exclusions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_top10_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_top10_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_top10_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          last_position_seconds: number
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          last_position_seconds?: number
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          last_position_seconds?: number
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      web_vitals: {
        Row: {
          id: string
          metric_name: string
          path: string | null
          rating: string | null
          recorded_at: string | null
          value: number
        }
        Insert: {
          id?: string
          metric_name: string
          path?: string | null
          rating?: string | null
          recorded_at?: string | null
          value: number
        }
        Update: {
          id?: string
          metric_name?: string
          path?: string | null
          rating?: string | null
          recorded_at?: string | null
          value?: number
        }
        Relationships: []
      }
      weekly_challenge_ladder: {
        Row: {
          created_at: string | null
          id: string
          points: number | null
          rank: number | null
          season_id: string
          updated_at: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number | null
          rank?: number | null
          season_id: string
          updated_at?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number | null
          rank?: number | null
          season_id?: string
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenge_ladder_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "season_leaderboard_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "weekly_challenge_ladder_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_challenge_ladder_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "user_season_xp_view"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "weekly_challenge_ladder_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "weekly_challenge_ladder_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_challenge_ladder_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_audit_feed: {
        Row: {
          action: string | null
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          ip_address: string | null
          source: string | null
          status: string | null
          target_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Relationships: []
      }
      business_profile_daily_insights: {
        Row: {
          business_profile_id: string | null
          click_outs: number | null
          day: string | null
          directory_impressions: number | null
          mentions: number | null
          message_clicks: number | null
          post_engagements: number | null
          post_views: number | null
          profile_views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profile_events_business_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_profile_events_business_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_profile_events_business_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_rating_aggregates: {
        Row: {
          avg_clubhouse_score: number | null
          avg_condition_score: number | null
          avg_design_score: number | null
          avg_facilities_score: number | null
          avg_overall_score: number | null
          course_id: string | null
          review_count: number | null
          text_review_count: number | null
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
      creator_quality_scores: {
        Row: {
          last_post_at: string | null
          post_count: number | null
          quality_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_user_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_games_anon: {
        Row: {
          course_id: string | null
          course_name: string | null
          ends_at: string | null
          expires_at: string | null
          host_handicap: number | null
          host_home_club: string | null
          host_user_id: string | null
          id: string | null
          search_text: string | null
          slots_open: number | null
          slots_total: number | null
          start_time: string | null
          status: string | null
          visibility: string | null
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
      discover_trips_anon: {
        Row: {
          description: string | null
          end_date: string | null
          id: string | null
          organizer_handicap: number | null
          organizer_home_club: string | null
          organizer_id: string | null
          search_text: string | null
          start_date: string | null
          status: string | null
          title: string | null
          visibility: string | null
        }
        Relationships: []
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
      explore_moments: {
        Row: {
          aspect_ratio: number | null
          course_id: string | null
          course_name: string | null
          created_at: string | null
          display_order: number | null
          duration_seconds: number | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          moment_id: string | null
          region_key: string | null
          source_id: string | null
          source_type: string | null
          stream_id: string | null
          thumbnail_url: string | null
          user_id: string | null
        }
        Relationships: []
      }
      games_as_events: {
        Row: {
          course_id: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          holes: number | null
          id: string | null
          lat: number | null
          legacy_game_id: string | null
          legacy_trip_id: string | null
          lng: number | null
          max_participants: number | null
          name: string | null
          scoring_format: string | null
          share_code: string | null
          start_date: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: never
          event_type?: never
          holes?: never
          id?: string | null
          lat?: number | null
          legacy_game_id?: string | null
          legacy_trip_id?: never
          lng?: number | null
          max_participants?: number | null
          name?: string | null
          scoring_format?: never
          share_code?: never
          start_date?: never
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: never
          event_type?: never
          holes?: never
          id?: string | null
          lat?: number | null
          legacy_game_id?: string | null
          legacy_trip_id?: never
          lng?: number | null
          max_participants?: number | null
          name?: string | null
          scoring_format?: never
          share_code?: never
          start_date?: never
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          visibility?: string | null
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
      hub_events: {
        Row: {
          course_id: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          holes: number | null
          id: string | null
          lat: number | null
          legacy_game_id: string | null
          legacy_trip_id: string | null
          lng: number | null
          max_participants: number | null
          name: string | null
          scoring_format: string | null
          share_code: string | null
          start_date: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: []
      }
      hub_participants: {
        Row: {
          created_at: string | null
          event_id: string | null
          guest_name: string | null
          handicap_index: number | null
          id: string | null
          is_organizer: boolean | null
          normalized_status: string | null
          source_type: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: []
      }
      public_golfer_blurbs: {
        Row: {
          handicap: number | null
          home_club: string | null
          user_id: string | null
          visible_handicap: number | null
        }
        Insert: {
          handicap?: number | null
          home_club?: string | null
          user_id?: string | null
          visible_handicap?: never
        }
        Update: {
          handicap?: number | null
          home_club?: string | null
          user_id?: string | null
          visible_handicap?: never
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
      season_leaderboard_view: {
        Row: {
          season_id: string | null
          season_name: string | null
          season_rank: number | null
          season_slug: string | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      tourhub_leaderboard_latest: {
        Row: {
          espn_event_id: string | null
          fetched_at: string | null
          payload: Json | null
          round: number | null
          status: string | null
          tour: string | null
        }
        Relationships: []
      }
      trips_as_events: {
        Row: {
          course_id: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          holes: number | null
          id: string | null
          lat: number | null
          legacy_game_id: string | null
          legacy_trip_id: string | null
          lng: number | null
          max_participants: number | null
          name: string | null
          scoring_format: string | null
          share_code: string | null
          start_date: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          course_id?: never
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: never
          holes?: never
          id?: string | null
          lat?: never
          legacy_game_id?: never
          legacy_trip_id?: string | null
          lng?: never
          max_participants?: never
          name?: string | null
          scoring_format?: never
          share_code?: never
          start_date?: string | null
          start_time?: never
          status?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          course_id?: never
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: never
          holes?: never
          id?: string | null
          lat?: never
          legacy_game_id?: never
          legacy_trip_id?: string | null
          lng?: never
          max_participants?: never
          name?: string | null
          scoring_format?: never
          share_code?: never
          start_date?: string | null
          start_time?: never
          status?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      user_achievements_view: {
        Row: {
          achievement_id: string | null
          category: string | null
          code: string | null
          description: string | null
          icon_key: string | null
          is_unlocked: boolean | null
          name: string | null
          points: number | null
          sort_order: number | null
          source_context: Json | null
          unlocked_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_course_activity: {
        Row: {
          course_id: string | null
          edited_at: string | null
          first_activity_at: string | null
          has_played: boolean | null
          has_rating: boolean | null
          has_review: boolean | null
          played_at: string | null
          rating_value: number | null
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          edited_at?: string | null
          first_activity_at?: string | null
          has_played?: never
          has_rating?: never
          has_review?: never
          played_at?: never
          rating_value?: number | null
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          edited_at?: string | null
          first_activity_at?: string | null
          has_played?: never
          has_rating?: never
          has_review?: never
          played_at?: never
          rating_value?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_friend_pairs: {
        Row: {
          u1: string | null
          u2: string | null
        }
        Relationships: []
      }
      user_season_xp_view: {
        Row: {
          season_id: string | null
          season_name: string | null
          season_slug: string | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_top_ten_courses_view: {
        Row: {
          country: string | null
          course_id: string | null
          created_at: string | null
          global_rank: number | null
          id: string | null
          name: string | null
          position: number | null
          region: string | null
          regional_rank: number | null
          sub_country: string | null
          thumbnail_image: string | null
          updated_at: string | null
          usa_rank: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_top_ten_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_top100_progress_view: {
        Row: {
          courses_played_in_list: number | null
          courses_rated_in_list: number | null
          list_id: string | null
          list_name: string | null
          list_slug: string | null
          total_courses_in_list: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_top100_rated_courses: {
        Row: {
          course_id: string | null
          first_rated_at: string | null
          last_rated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_golfer_blurbs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_top100_memberships_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_course_activity_30d: {
        Row: {
          course_id: string | null
          last_moment_at: string | null
          moments_30d: number | null
          moments_7d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_region_activity_30d: {
        Row: {
          moments_30d: number | null
          moments_7d: number | null
          region_id: string | null
          slug: string | null
          title: string | null
        }
        Relationships: []
      }
      vw_theme_activity_30d: {
        Row: {
          moments_30d: number | null
          moments_7d: number | null
          slug: string | null
          theme_id: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _get_user_friend_set: { Args: { p_user_id: string }; Returns: string[] }
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
      accept_business_invite: { Args: { p_token: string }; Returns: Json }
      accept_golfer_verification_invite: {
        Args: { p_evidence_url?: string; p_note?: string; p_request_id: string }
        Returns: undefined
      }
      add_group_members: {
        Args: { p_conversation_id: string; p_user_ids: string[] }
        Returns: number
      }
      add_message_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: string
      }
      add_system_message: {
        Args: {
          p_actor_id?: string
          p_actor_name?: string
          p_conversation_id: string
          p_event_type: string
          p_user_id: string
          p_user_name: string
        }
        Returns: string
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
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
      admin_echo_kpis: {
        Args: never
        Returns: {
          exports_7d: number
          msgs_total: number
          shares_active: number
          threads_total: number
          users_active_7d: number
        }[]
      }
      admin_echo_rates: {
        Args: never
        Returns: {
          pct_starred: number
          pct_with_response: number
          period: string
        }[]
      }
      admin_echo_summary: {
        Args: { days: number }
        Returns: {
          bulk_exports: number
          conversations_created: number
          exports_started: number
          period: string
          shares_created: number
          starred_toggles: number
        }[]
      }
      admin_echo_threads_timeseries: {
        Args: never
        Returns: {
          threads: number
          ts: string
        }[]
      }
      admin_echo_timeseries: {
        Args: { days: number; event_names: string[] }
        Returns: {
          d: string
          n: number
        }[]
      }
      admin_echo_top_tags:
        | {
            Args: never
            Returns: {
              tag: string
              uses: number
            }[]
          }
        | {
            Args: { days: number; limit_n: number }
            Returns: {
              name: string
              threads: number
            }[]
          }
      admin_guard: { Args: never; Returns: undefined }
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
      admin_set_test_user_photo: {
        Args: { p_photo_url: string }
        Returns: undefined
      }
      aggregate_business_daily_metrics: {
        Args: { target_date?: string }
        Returns: undefined
      }
      aggregate_profile_daily_metrics: {
        Args: { target_date?: string }
        Returns: undefined
      }
      approve_business_verification: {
        Args: { _request_id: string }
        Returns: undefined
      }
      archive_season_podium: {
        Args: { p_season_id: string }
        Returns: undefined
      }
      are_users_blocked: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      auto_flip_season: { Args: never; Returns: undefined }
      backfill_course_top100_memberships: {
        Args: never
        Returns: {
          courses_added: number
          details: string
          list_slug: string
          status: string
        }[]
      }
      base_club_name: { Args: { p_course_name: string }; Returns: string }
      block_user: { Args: { p_blocked_id: string }; Returns: undefined }
      calculate_user_division: {
        Args: { p_courses_logged: number }
        Returns: string
      }
      can_change_email: { Args: { user_id_param: string }; Returns: boolean }
      can_manage_business: { Args: { _business_id: string }; Returns: boolean }
      can_view_followers_post: {
        Args: {
          p_actor_id: string
          p_actor_type: string
          p_post_user_id: string
        }
        Returns: boolean
      }
      can_view_game_participant_profile: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_game_participants: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: boolean
      }
      can_view_trip: { Args: { check_trip_id: string }; Returns: boolean }
      can_view_trip_participant: {
        Args: { check_trip_id: string; check_user_id: string }
        Returns: boolean
      }
      canonical_club_name_v2: { Args: { p_name: string }; Returns: string }
      capture_all_leaderboard_snapshots: { Args: never; Returns: undefined }
      capture_courses_snapshot: { Args: { p_sort: string }; Returns: undefined }
      capture_global_snapshot: {
        Args: { p_metric: string }
        Returns: undefined
      }
      capture_handicap_snapshot: { Args: never; Returns: undefined }
      capture_leaderboard_snapshot: { Args: never; Returns: undefined }
      capture_top100_alltime_snapshot: { Args: never; Returns: undefined }
      capture_top100_snapshot: {
        Args: { p_season_id: string }
        Returns: undefined
      }
      check_and_award_badges: {
        Args: { user_id_param: string }
        Returns: {
          newly_awarded_badges: Json
        }[]
      }
      check_email_exists: { Args: { lookup_email: string }; Returns: boolean }
      check_expiring_admin_access: { Args: never; Returns: undefined }
      cleanup_echo_data: { Args: never; Returns: undefined }
      cleanup_expired_dismissals: { Args: never; Returns: undefined }
      cleanup_expired_open_to_play: { Args: never; Returns: undefined }
      cleanup_old_gate_attempts: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      cleanup_stale_typing_indicators: { Args: never; Returns: undefined }
      cleanup_unverified_profiles: { Args: never; Returns: undefined }
      clear_typing_indicator: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      clone_real_profiles_to_mock: {
        Args: { limit_count?: number }
        Returns: number
      }
      club_key_v2: { Args: { p_name: string }; Returns: string }
      compute_player_ratings: { Args: never; Returns: undefined }
      count_orphan_posts: { Args: never; Returns: number }
      create_business_account: {
        Args: {
          p_category?: string
          p_club_name?: string
          p_description?: string
          p_name: string
        }
        Returns: string
      }
      create_creator_page: {
        Args: {
          p_avatar_url?: string
          p_bio?: string
          p_display_name: string
          p_slug?: string
        }
        Returns: string
      }
      create_group_conversation:
        | {
            Args: { group_name: string; participant_ids: string[] }
            Returns: string
          }
        | {
            Args: {
              group_avatar_url?: string
              group_name: string
              participant_ids: string[]
            }
            Returns: string
          }
      current_auth_uid: { Args: never; Returns: string }
      decline_golfer_verification_invite: {
        Args: { p_note?: string; p_request_id: string }
        Returns: Json
      }
      decrement_slots_if_available: {
        Args: { p_game_id: string }
        Returns: undefined
      }
      delete_business_team_member: {
        Args: { p_business_id: string; p_user_profile_id: string }
        Returns: boolean
      }
      delete_group: { Args: { p_conversation_id: string }; Returns: boolean }
      delete_message_for_me: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dismiss_golfer_candidate: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: Json
      }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      echo_admin_insights: {
        Args: { p_days?: number }
        Returns: {
          avg_query_ms: number
          conv_24h: number
          conv_total: number
          export_count: number
          shares_active: number
          tags: Json
          users_active: number
        }[]
      }
      echo_admin_insights_guard: {
        Args: { p_days?: number }
        Returns: {
          avg_query_ms: number
          conv_24h: number
          conv_total: number
          export_count: number
          shares_active: number
          tags: Json
          users_active: number
        }[]
      }
      echo_analytics_export_formats_guarded: {
        Args: { p_from: string; p_to: string }
        Returns: {
          count: number
          format: string
        }[]
      }
      echo_analytics_overview_delta: {
        Args: { p_from: string; p_to: string }
        Returns: {
          current_value: number
          delta: number
          metric: string
          previous_value: number
        }[]
      }
      echo_analytics_overview_guarded: {
        Args: {
          p_event?: string
          p_from: string
          p_tag?: string
          p_to: string
          p_user?: string
        }
        Returns: {
          active_users: number
          avg_latency_ms: number
          total_exports: number
          total_shares: number
          total_threads: number
        }[]
      }
      echo_analytics_timeseries_guarded: {
        Args: {
          p_event?: string
          p_from: string
          p_tag?: string
          p_to: string
          p_user?: string
        }
        Returns: {
          count: number
          day: string
          event: string
        }[]
      }
      echo_analytics_top_tags_guarded: {
        Args: { p_from: string; p_to: string; p_user?: string }
        Returns: {
          last_used_at: string
          tag: string
          uses: number
        }[]
      }
      echo_analytics_top_threads_guarded: {
        Args: { p_from: string; p_to: string }
        Returns: {
          last_open_at: string
          opens: number
          thread_id: string
        }[]
      }
      echo_get_course_context: {
        Args: { p_country?: string; p_limit?: number; p_query?: string }
        Returns: Json
      }
      echo_get_player_context: {
        Args: { p_player_name: string }
        Returns: Json
      }
      echo_get_tournament_context: { Args: never; Returns: Json }
      echo_get_user_context: { Args: { p_user_id: string }; Returns: Json }
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
          tags: string[]
          thread_id: string
        }[]
      }
      echo_message_counts: {
        Args: { conversation_ids: string[] }
        Returns: {
          conversation_id: string
          message_count: number
        }[]
      }
      echo_purge_old_data: { Args: never; Returns: undefined }
      echo_share_create:
        | { Args: { p_thread: string }; Returns: string }
        | {
            Args: { p_thread_id: string; p_ttl_seconds?: number }
            Returns: string
          }
      echo_share_fetch: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          messages: Json
          tags: string[]
          thread_id: string
          title: string
        }[]
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
      echo_share_rotate: { Args: { p_thread: string }; Returns: string }
      echo_share_set_redactions: {
        Args: { p_pairs: Json; p_token: string }
        Returns: undefined
      }
      echo_stats_exports: {
        Args: { p_from: string; p_to: string }
        Returns: {
          kind: string
          total: number
        }[]
      }
      echo_stats_overview: {
        Args: { p_from: string; p_to: string }
        Returns: {
          events_count: number
          exports: number
          shares_created: number
          unique_users: number
        }[]
      }
      echo_stats_timeseries: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          events: number
        }[]
      }
      echo_stats_top_tags: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          tag: string
          uses: number
        }[]
      }
      echo_stats_top_users: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          events: number
          user_id: string
        }[]
      }
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
      echo_thread_update_last_opened: {
        Args: { p_thread: string }
        Returns: undefined
      }
      echo_threads_delete_many: { Args: { ids: string[] }; Returns: undefined }
      echo_threads_set_star: {
        Args: { ids: string[]; starred: boolean }
        Returns: undefined
      }
      echo_views_delete: { Args: { p_id: string }; Returns: undefined }
      echo_views_get: { Args: { p_id: string }; Returns: Json }
      echo_views_list: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          owner: string
          params: Json
        }[]
        SetofOptions: {
          from: "*"
          to: "echo_admin_dashboard_views"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      echo_views_save: {
        Args: {
          p_name: string
          p_params: Json
          p_set_default?: boolean
          p_view_id?: string
        }
        Returns: string
      }
      enablelongtransactions: { Args: never; Returns: string }
      ensure_user_season_stats: { Args: { p_user_id: string }; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      execute_sql: { Args: { params?: Json; query: string }; Returns: Json }
      expire_pings: { Args: never; Returns: undefined }
      explore_courses_by_rating: {
        Args: {
          p_country?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sub_country?: string
        }
        Returns: {
          average_rating: number
          club_id: string
          continent: Database["public"]["Enums"]["continent"]
          country: string
          country_code: string
          country_rank: number
          course_type: Database["public"]["Enums"]["course_type"]
          created_at: string
          description: string
          global_rank: number
          has_hosted_major: boolean
          id: string
          latitude: number
          longitude: number
          major_championships: string[]
          name: string
          region: string
          region_key: string
          regional_rank: number
          sub_country: string
          thumbnail_image: string
          top100_url: string
          updated_at: string
          usa_rank: number
          website_url: string
        }[]
      }
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
      generate_tee_time_groups: {
        Args: { p_players_per_group?: number; p_round_id: string }
        Returns: number
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
      get_active_season: {
        Args: never
        Returns: {
          days_remaining: number
          end_date: string
          id: string
          name: string
          season_number: number
          start_date: string
        }[]
      }
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
      get_business_access_level: {
        Args: { p_business_id: string; p_user_profile_id: string }
        Returns: string
      }
      get_business_profile_analytics: {
        Args: { p_business_profile_id: string; p_days?: number }
        Returns: {
          click_outs: number
          day: string
          directory_impressions: number
          mentions: number
          message_clicks: number
          post_engagements: number
          post_views: number
          profile_views: number
        }[]
      }
      get_business_profile_headline_stats: {
        Args: { p_business_profile_id: string; p_days?: number }
        Returns: Json
      }
      get_championship_leaderboard: {
        Args: {
          p_club_id: string
          p_country: string
          p_current_user_id: string
          p_limit: number
          p_offset: number
          p_scope: string
        }
        Returns: {
          courses_logged: number
          courses_to_next_division: number
          display_name: string
          division_id: string
          division_name: string
          division_ring_color: string
          home_club: string
          is_active_streak: boolean
          is_friend: boolean
          is_rival: boolean
          last_activity_at: string
          profile_photo_url: string
          rank: number
          rank_change_today: number
          rank_change_week: number
          streak_days: number
          user_id: string
          username: string
          zone_type: string
        }[]
      }
      get_championship_leaderboard_alltime: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_limit?: number
          p_offset?: number
          p_scope?: string
        }
        Returns: {
          current_division: string
          display_name: string
          home_club: string
          is_friend: boolean
          is_rival: boolean
          profile_photo_url: string
          rank: number
          total_courses: number
          user_id: string
          username: string
        }[]
      }
      get_clip_of_the_week: {
        Args: never
        Returns: {
          avatar_url: string
          caption: string
          comment_count: number
          course_id: string
          course_name: string
          created_at: string
          display_name: string
          duration_seconds: number
          hls_url: string
          is_verified: boolean
          like_count: number
          post_id: string
          thumbnail_url: string
          user_id: string
          username: string
          why_ai: string
        }[]
      }
      get_cloudflare_secrets: { Args: never; Returns: Json }
      get_continue_watching: {
        Args: { p_format?: string; p_limit?: number; p_user_id: string }
        Returns: {
          comment_count: number
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_username: string
          display_order: number
          duration_seconds: number
          height: number
          last_interaction_at: string
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_content: string
          post_created_at: string
          post_id: string
          post_user_id: string
          poster_url: string
          progress_seconds: number
          share_count: number
          stream_id: string
          total_seconds: number
          width: number
        }[]
      }
      get_conversation_last_senders: {
        Args: { p_conversation_ids: string[] }
        Returns: {
          conversation_id: string
          created_at: string
          sender_id: string
        }[]
      }
      get_countries_leaderboard: {
        Args: {
          p_current_user_id?: string
          p_limit?: number
          p_offset?: number
          p_scope?: string
        }
        Returns: {
          avatar_url: string
          countries_count: number
          country_list: string[]
          courses_count: number
          display_name: string
          home_club: string
          is_friend: boolean
          rank: number
          user_id: string
          username: string
        }[]
      }
      get_course_countries: {
        Args: never
        Returns: {
          country_name: string
          course_count: number
        }[]
      }
      get_course_hall_of_fame: {
        Args: never
        Returns: {
          course_id: string
          course_name: string
          hall_of_fame_category: string
          lifetime_avg_rating: number
          lifetime_plays: number
          location: string
          season_wins: number
          thumbnail_url: string
        }[]
      }
      get_course_leaderboard: {
        Args: {
          p_country: string
          p_current_user_id: string
          p_exclude_countries: string[]
          p_limit: number
          p_offset: number
          p_sort_by: string
          p_sort_order: string
          p_sub_country: string
          p_time_period: string
        }
        Returns: {
          avg_rating: number
          city: string
          club_name: string
          country: string
          course_id: string
          course_name: string
          has_played: boolean
          image_url: string
          rank: number
          rank_change: number
          rating_count: number
          region: string
          total_rounds: number
        }[]
      }
      get_course_media: {
        Args: {
          p_course_id: string
          p_cursor?: string
          p_filter?: string
          p_page_size?: number
          p_seen_post_ids?: string[]
          p_user_id: string
        }
        Returns: {
          business_is_verified: boolean
          business_logo_url: string
          business_name: string
          comment_count: number
          course_country: string
          course_region: string
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_relation: string
          creator_username: string
          display_order: number
          duration_seconds: number
          engagement_score: number
          height: number
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_actor_id: string
          post_actor_type: string
          post_content: string
          post_created_at: string
          post_id: string
          post_status: string
          post_user_id: string
          poster_url: string
          review_course_id: string
          review_course_image: string
          review_course_name: string
          review_rating: number
          share_count: number
          source_review_id: string
          stream_id: string
          width: number
        }[]
      }
      get_course_of_the_week: {
        Args: never
        Returns: {
          avg_rating: number
          country: string
          course_id: string
          course_name: string
          description: string
          global_rank: number
          review_count: number
          sub_country: string
          thumbnail_image: string
          week_label: string
        }[]
      }
      get_course_regions: {
        Args: never
        Returns: {
          course_count: number
          region_name: string
        }[]
      }
      get_course_sub_regions: {
        Args: { p_region: string }
        Returns: {
          course_count: number
          sub_region_name: string
        }[]
      }
      get_current_username: { Args: { _user_id: string }; Returns: string }
      get_deleted_message_ids_for_me: {
        Args: { p_conversation_id: string }
        Returns: string[]
      }
      get_division_config: {
        Args: never
        Returns: {
          display_name: string
          division_id: string
          ring_color: string
          sort_order: number
          threshold: number
        }[]
      }
      get_exploration_leaderboard: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_limit?: number
          p_metric?: string
          p_offset?: number
          p_scope: string
        }
        Returns: {
          avatar_url: string
          continent_list: string[]
          continents_count: number
          countries_count: number
          country_list: string[]
          courses_count: number
          display_name: string
          home_club: string
          home_club_id: string
          is_friend: boolean
          rank: number
          region_list: string[]
          regions_count: number
          user_id: string
          username: string
        }[]
      }
      get_explore_feed: {
        Args: {
          p_cursor?: string
          p_page_size?: number
          p_region?: string
          p_search_query?: string
          p_seen_post_ids?: string[]
          p_user_id: string
        }
        Returns: {
          business_is_verified: boolean
          business_logo_url: string
          business_name: string
          comment_count: number
          course_country: string
          course_region: string
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_relation: string
          creator_username: string
          display_order: number
          duration_seconds: number
          engagement_score: number
          height: number
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_actor_id: string
          post_actor_type: string
          post_content: string
          post_created_at: string
          post_id: string
          post_status: string
          post_user_id: string
          poster_url: string
          review_course_id: string
          review_course_image: string
          review_course_name: string
          review_rating: number
          share_count: number
          source_review_id: string
          stream_id: string
          width: number
        }[]
      }
      get_explore_hero: {
        Args: { p_mood: string; p_user_id: string }
        Returns: {
          context_stats: Json
          course_id: string
          course_name: string
          filter_tier: string
          global_rank: number
          hero_image_url: string
          location_primary: string
          location_secondary: string
          rating_avg: number
          review_count: number
          why_ai: string
        }[]
      }
      get_explore_recommendations: {
        Args: { p_limit?: number; p_mood: string; p_user_id: string }
        Returns: {
          context_stats: Json
          course_id: string
          course_name: string
          filter_tier: string
          global_rank: number
          hero_image_url: string
          location_primary: string
          location_secondary: string
          match_label: string
          rating_avg: number
          review_count: number
          why_ai: string
        }[]
      }
      get_fast_climbers: {
        Args: { days_param?: number; limit_param?: number }
        Returns: {
          courses_logged_recently: number
          display_name: string
          global_rank: number
          home_club: string
          profile_photo_url: string
          total_top100_played: number
          user_id: string
          username: string
        }[]
      }
      get_friend_course_activity: {
        Args: { p_course_ids: string[]; p_user_id: string }
        Returns: {
          course_id: string
          friend_played_count: number
          network_rating_avg: number
          network_rating_count: number
          nudge_dismissed_recently: boolean
          self_has_played: boolean
          self_has_reviewed: boolean
          top_friend_avatars: string[]
          top_friend_names: string[]
        }[]
      }
      get_friend_played_recommendations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          country: string
          course_id: string
          course_name: string
          friend_played_count: number
          friend_rating_avg: number
          rating_avg: number
          region: string
          review_count: number
          thumbnail_image: string
          top_friend_names: string[]
        }[]
      }
      get_friends_feed: {
        Args: {
          p_cursor?: string
          p_mode?: string
          p_page_size?: number
          p_search_query?: string
          p_seen_post_ids?: string[]
          p_user_id: string
        }
        Returns: {
          business_is_verified: boolean
          business_logo_url: string
          business_name: string
          comment_count: number
          course_country: string
          course_global_rank: number
          course_id: string
          course_latitude: number
          course_longitude: number
          course_name: string
          course_region: string
          course_thumbnail_image: string
          creator_avatar_url: string
          creator_display_name: string
          creator_handicap_index: number
          creator_home_club: string
          creator_home_club_visibility: string
          creator_is_verified: boolean
          creator_relation: string
          creator_show_handicap: boolean
          creator_username: string
          display_order: number
          duration_seconds: number
          engagement_score: number
          height: number
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_actor_id: string
          post_actor_type: string
          post_content: string
          post_created_at: string
          post_id: string
          post_status: string
          post_tags: Json
          post_user_id: string
          poster_url: string
          review_course_country: string
          review_course_id: string
          review_course_image: string
          review_course_name: string
          review_course_region: string
          review_course_sub_country: string
          review_rating: number
          review_text: string
          share_count: number
          source_review_id: string
          stream_id: string
          width: number
        }[]
      }
      get_friends_first_post_ids: {
        Args: {
          p_current_user_id: string
          p_limit: number
          p_max_duration?: number
          p_media_type?: string
          p_min_duration?: number
          p_offset: number
        }
        Returns: {
          is_friend: boolean
          post_id: string
        }[]
      }
      get_global_country_breakdown: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          country: string
          member_count: number
        }[]
      }
      get_global_course_videos: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          course_id: string
          course_name: string
          created_at: string
          creator_avatar_url: string
          creator_name: string
          duration_ms: number
          hls_url: string
          like_count: number
          media_id: string
          post_id: string
          poster_url: string
        }[]
      }
      get_handicap_improvement_leaderboard: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_limit?: number
          p_offset?: number
          p_scope: string
        }
        Returns: {
          club_name: string
          current_handicap: number
          display_name: string
          improvement: number
          previous_handicap: number
          primary_club_id: string
          profile_photo_url: string
          rank: number
          user_id: string
          username: string
        }[]
      }
      get_home_clubs: { Args: never; Returns: Json }
      get_home_clubs_for_user:
        | { Args: { p_user_profile_id: string }; Returns: Json }
        | {
            Args: { p_user_profile_id: string; p_viewer_id: string }
            Returns: Json
          }
      get_home_clubs_for_users:
        | { Args: { p_user_profile_ids: string[] }; Returns: Json }
        | {
            Args: { p_user_profile_ids: string[]; p_viewer_id: string }
            Returns: Json
          }
      get_leaderboard_countries: {
        Args: never
        Returns: {
          country_code: string
          country_name: string
          user_count: number
        }[]
      }
      get_long_form_videos: {
        Args: {
          p_category?: string
          p_cursor?: string
          p_mode?: string
          p_page_size?: number
          p_search_query?: string
          p_seen_post_ids?: string[]
          p_user_id: string
        }
        Returns: {
          actor_id: string
          actor_type: string
          comment_count: number
          course_id: string
          course_name: string
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_relation: string
          creator_username: string
          display_order: number
          duration_seconds: number
          height: number
          hls_url: string
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_content: string
          post_created_at: string
          post_id: string
          post_user_id: string
          poster_url: string
          review_categories: Json
          review_id: string
          review_overall_score: number
          share_count: number
          stream_id: string
          width: number
        }[]
      }
      get_lowest_handicap_leaderboard: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_limit?: number
          p_offset?: number
          p_scope: string
        }
        Returns: {
          avatar_url: string
          club_name: string
          country: string
          display_name: string
          handicap_index: number
          is_current_user: boolean
          rank: number
          user_id: string
        }[]
      }
      get_nearby_courses: {
        Args: {
          p_limit?: number
          p_radius_km?: number
          p_user_lat: number
          p_user_lng: number
        }
        Returns: {
          country: string
          course_id: string
          course_name: string
          distance_km: number
          global_rank: number
          rating_avg: number
          region: string
          review_count: number
          thumbnail_image: string
        }[]
      }
      get_or_create_dm_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_podium_all_time: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_scope: string
        }
        Returns: {
          avatar_url: string
          courses_count: number
          display_name: string
          rank: number
          user_id: string
        }[]
      }
      get_podium_seasonal: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_division_id?: string
          p_scope: string
        }
        Returns: {
          avatar_url: string
          courses_count: number
          display_name: string
          rank: number
          user_id: string
        }[]
      }
      get_profile_posts: {
        Args: {
          p_actor_id: string
          p_actor_type: string
          p_cursor?: string
          p_page_size?: number
          p_seen_post_ids?: string[]
          p_user_id: string
        }
        Returns: {
          business_is_verified: boolean
          business_logo_url: string
          business_name: string
          comment_count: number
          course_country: string
          course_id: string
          course_name: string
          course_region: string
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_relation: string
          creator_username: string
          display_order: number
          duration_seconds: number
          engagement_score: number
          height: number
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_actor_id: string
          post_actor_type: string
          post_content: string
          post_created_at: string
          post_id: string
          post_status: string
          post_tags: Json
          post_user_id: string
          poster_url: string
          review_course_country: string
          review_course_id: string
          review_course_image: string
          review_course_name: string
          review_course_region: string
          review_course_sub_country: string
          review_rating: number
          review_text: string
          share_count: number
          source_review_id: string
          stream_id: string
          width: number
        }[]
      }
      get_regions_leaderboard: {
        Args: {
          p_current_user_id?: string
          p_limit?: number
          p_offset?: number
          p_scope?: string
        }
        Returns: {
          avatar_url: string
          display_name: string
          is_current_user: boolean
          rank: number
          regions_count: number
          user_id: string
          username: string
        }[]
      }
      get_relationship_status: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_relationship_statuses: {
        Args: { p_current_user_id: string; p_target_user_ids: string[] }
        Returns: {
          friend_status: string
          is_blocked: boolean
          is_blocking: boolean
          is_followed_by: boolean
          is_following: boolean
          target_user_id: string
        }[]
      }
      get_season_calendar: {
        Args: never
        Returns: {
          color: string
          days_remaining: number
          days_until_start: number
          description: string
          duration_days: number
          end_date: string
          icon: string
          is_current: boolean
          name: string
          prize_claimed: boolean
          prize_description: string
          season_id: string
          season_number: number
          season_winner_courses: number
          season_winner_user_id: string
          sponsor_name: string
          sponsor_url: string
          start_date: string
          status: string
          tagline: string
        }[]
      }
      get_season_improvement_leaderboard: {
        Args: {
          p_club_id?: string
          p_country?: string
          p_current_user_id?: string
          p_limit?: number
          p_offset?: number
          p_scope: string
        }
        Returns: {
          club_name: string
          current_handicap: number
          display_name: string
          improvement: number
          primary_club_id: string
          profile_photo_url: string
          rank: number
          season_start_handicap: number
          user_id: string
          username: string
        }[]
      }
      get_season_recap: {
        Args: {
          scope_param?: Database["public"]["Enums"]["leaderboard_scope"]
          season_key_param: string
        }
        Returns: Json
      }
      get_similar_handicap_leaderboard: {
        Args: {
          p_current_user_id?: string
          p_target_handicap: number
          p_window_size?: number
        }
        Returns: {
          avatar_url: string
          club_name: string
          display_name: string
          handicap_index: number
          is_current_user: boolean
          rank: number
          user_id: string
          username: string
        }[]
      }
      get_suggested_creators: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          handicap: number
          home_course: string
          is_followed: boolean
          is_verified: boolean
          total_engagement: number
          user_id: string
          username: string
          video_count: number
        }[]
      }
      get_suggested_feed: {
        Args: {
          p_cursor?: string
          p_mode?: string
          p_page_size?: number
          p_seen_post_ids?: string[]
          p_user_id: string
        }
        Returns: {
          business_is_verified: boolean
          business_logo_url: string
          business_name: string
          comment_count: number
          course_id: string
          course_name: string
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_relation: string
          creator_username: string
          display_order: number
          duration_seconds: number
          engagement_score: number
          height: number
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_actor_id: string
          post_actor_type: string
          post_content: string
          post_created_at: string
          post_id: string
          post_status: string
          post_tags: Json
          post_type: string
          post_user_id: string
          poster_url: string
          review_course_country: string
          review_course_id: string
          review_course_image: string
          review_course_name: string
          review_course_region: string
          review_course_sub_country: string
          review_rating: number
          review_text: string
          share_count: number
          source_review_id: string
          stream_id: string
          tournament_meta: Json
          width: number
        }[]
      }
      get_top_video_reviews:
        | {
            Args: {
              days_back?: number
              p_region_slug?: string
              result_limit?: number
            }
            Returns: {
              aspect_ratio: number
              avatar_url: string
              comments_count: number
              course_id: string
              course_location: string
              course_name: string
              course_slug: string
              created_at: string
              display_name: string
              engagement_score: number
              likes_count: number
              post_id: string
              rating: number
              review_id: string
              review_snippet: string
              review_text: string
              thumbnail_url: string
              user_id: string
              username: string
              video_url: string
            }[]
          }
        | {
            Args: {
              days_back?: number
              p_region_slug?: string
              p_sort_by?: string
              result_limit?: number
            }
            Returns: {
              aspect_ratio: number
              avatar_url: string
              comments_count: number
              course_id: string
              course_location: string
              course_name: string
              course_slug: string
              created_at: string
              display_name: string
              engagement_score: number
              likes_count: number
              post_id: string
              rating: number
              review_id: string
              review_snippet: string
              review_text: string
              thumbnail_url: string
              user_id: string
              username: string
              video_url: string
            }[]
          }
      get_top100_course_insights: {
        Args: { target_course_id: string; target_user_id: string }
        Returns: Json
      }
      get_top100_course_leaderboard:
        | {
            Args: {
              p_country?: string
              p_current_user_id?: string
              p_limit?: number
              p_offset?: number
              p_sort_by?: string
              p_sort_order?: string
              p_time_period?: string
            }
            Returns: {
              avg_rating: number
              city: string
              club_name: string
              country: string
              course_id: string
              course_name: string
              has_played: boolean
              image_url: string
              rank: number
              rank_change: number
              rating_count: number
              region: string
              total_rounds: number
            }[]
          }
        | {
            Args: {
              p_country?: string
              p_current_user_id?: string
              p_limit?: number
              p_offset?: number
              p_sort_by?: string
              p_sort_order?: string
              p_sub_country?: string
              p_time_period?: string
            }
            Returns: {
              avg_rating: number
              city: string
              club_name: string
              country: string
              course_id: string
              course_name: string
              has_played: boolean
              image_url: string
              rank: number
              rank_change: number
              rating_count: number
              region: string
              total_rounds: number
            }[]
          }
      get_top100_course_movers: {
        Args: {
          limit_param?: number
          scope_param?: string
          time_range_param?: string
        }
        Returns: {
          country: string
          course_id: string
          course_name: string
          list_slug: string
          plays_delta: number
          rating_delta: number
          sub_country: string
          thumbnail_url: string
        }[]
      }
      get_top100_discover_recommendations: {
        Args: { limit_param?: number; target_user_id: string }
        Returns: {
          content: string
          course_id: string
          course_name: string
          created_at: string
          engagement_score: number
          list_rank: number
          list_slug: string
          post_id: string
          short_label: string
        }[]
      }
      get_top100_friend_recent_activity: {
        Args: {
          limit_param?: number
          scope_param?: string
          time_range_param?: string
        }
        Returns: {
          country: string
          course_id: string
          course_name: string
          friend_avatar_url: string
          friend_id: string
          friend_name: string
          list_slug: string
          played_at: string
          rating: number
          sub_country: string
          thumbnail_url: string
        }[]
      }
      get_top100_friends_snapshot: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_top100_leaderboard: {
        Args: {
          current_user_id?: string
          limit_param?: number
          offset_param?: number
          scope_param?: string
          time_range_param?: string
        }
        Returns: {
          display_name: string
          global_rank: number
          home_club: string
          is_friend: boolean
          last_activity: string
          primary_club_id: string
          profile_photo_url: string
          regional_rank: number
          top100_courses_played: number
          user_id: string
          username: string
        }[]
      }
      get_top100_lists_with_hero_courses: {
        Args: { target_user_id?: string }
        Returns: {
          hero_course_country: string
          hero_course_id: string
          hero_course_name: string
          hero_course_rank: number
          hero_course_region: string
          hero_course_thumbnail: string
          list_id: string
          list_name: string
          list_short_label: string
          list_slug: string
          played_count: number
          total_courses: number
        }[]
      }
      get_top100_progress_for_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_top100_season_stats: {
        Args: {
          season_end?: string
          season_start?: string
          target_user_id: string
        }
        Returns: Json
      }
      get_trending_courses: {
        Args: { p_days_back?: number; p_limit?: number; p_region_slug?: string }
        Returns: {
          country: string
          course_id: string
          course_name: string
          global_rank: number
          post_count: number
          review_count: number
          sub_country: string
          thumbnail_image: string
          trending_score: number
        }[]
      }
      get_trending_top100_moments: {
        Args: { days_param: number; limit_param: number }
        Returns: {
          content: string
          course_id: string
          course_name: string
          created_at: string
          engagement_score: number
          list_rank: number
          list_slug: string
          post_id: string
          short_label: string
        }[]
      }
      get_unread_count: { Args: { p_conversation_id: string }; Returns: number }
      get_user_business_ids: {
        Args: { p_user_profile_id: string }
        Returns: string[]
      }
      get_user_business_role: {
        Args: { p_business_id: string; p_user_profile_id: string }
        Returns: string
      }
      get_user_businesses: {
        Args: { p_user_id: string }
        Returns: {
          business_category: string
          business_id: string
          business_is_verified: boolean
          business_location: string
          business_logo_url: string
          business_name: string
          business_slug: string
          member_role: string
        }[]
      }
      get_user_championship_status: {
        Args: { p_season_id?: string; p_user_id: string }
        Returns: {
          active_streak_days: number
          best_rank_this_season: number
          closest_rival_gap: number
          closest_rival_name: string
          courses_logged: number
          courses_to_promotion: number
          days_remaining: number
          division_id: string
          division_name: string
          division_ring_color: string
          global_rank: number
          longest_streak_this_season: number
          next_division_name: string
          rank_change_today: number
          rank_change_week: number
          rivals_ahead: number
          rivals_count: number
          season_ends_at: string
          season_id: string
          season_name: string
          zone_type: string
        }[]
      }
      get_user_combination_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          current_progress: number
          description: string
          is_earned: boolean
          progress_details: Json
          target_value: number
          tier_name: string
        }[]
      }
      get_user_course_anchored_content: {
        Args: {
          p_format?: string
          p_limit_per_course?: number
          p_mood?: string
          p_user_id: string
        }
        Returns: {
          content_count: number
          course_country: string
          course_id: string
          course_name: string
          recent_post_ids: string[]
        }[]
      }
      get_user_exploration_status: {
        Args: { p_user_id: string }
        Returns: {
          continent_list: string[]
          continents_count: number
          countries_count: number
          country_list: string[]
          friends_rank: number
          global_rank: number
          region_list: string[]
          regions_count: number
        }[]
      }
      get_user_passport: {
        Args: { p_user_id: string }
        Returns: {
          avg_rating_given: number
          countries_played: number
          courses_played: number
          first_play_year: number
          friends_courses_to_try: number
          reviews_written: number
          top_100_played: number
          wishlist_count: number
        }[]
      }
      get_user_podium_proximity: {
        Args: {
          p_division_id?: string
          p_scope?: string
          p_time_filter?: string
          p_user_id: string
        }
        Returns: {
          courses_to_podium: number
          is_on_podium: boolean
          third_place_courses: number
          user_position: number
        }[]
      }
      get_user_position_change: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: number
      }
      get_user_recent_achievements: {
        Args: { limit_param?: number; user_id_param: string }
        Returns: {
          achievement_data: Json
          achievement_type: string
          created_at: string
          id: string
        }[]
      }
      get_user_streak_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
          current_progress: number
          earned_at: string
          is_earned: boolean
          threshold_months: number
          tier_name: string
        }[]
      }
      get_user_top100_course_ids: {
        Args: { target_user_id: string }
        Returns: string[]
      }
      get_user_top100_courses_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_top100_intent: {
        Args: { target_user_id: string }
        Returns: Json
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
      get_video_of_the_week: {
        Args: never
        Returns: {
          avatar_url: string
          caption: string
          comment_count: number
          course_id: string
          course_name: string
          created_at: string
          display_name: string
          duration_seconds: number
          hls_url: string
          is_verified: boolean
          like_count: number
          post_id: string
          thumbnail_url: string
          user_id: string
          username: string
          why_ai: string
        }[]
      }
      get_watch_category_counts: {
        Args: never
        Returns: {
          category: string
          post_count: number
        }[]
      }
      get_watch_most_loved_this_week: {
        Args: {
          p_format?: string
          p_limit?: number
          p_mood?: string
          p_user_id?: string
          p_window?: string
        }
        Returns: {
          avatar_url: string
          caption: string
          comment_count: number
          course_id: string
          course_name: string
          created_at: string
          display_name: string
          duration_seconds: number
          engagement_score: number
          format: string
          hls_url: string
          is_verified: boolean
          like_count: number
          post_id: string
          thumbnail_url: string
          user_id: string
          username: string
        }[]
      }
      get_watch_of_the_week: {
        Args: { p_mood?: string; p_user_id?: string }
        Returns: {
          avatar_url: string
          caption: string
          comment_count: number
          course_id: string
          course_name: string
          created_at: string
          display_name: string
          duration_seconds: number
          format: string
          hls_url: string
          is_verified: boolean
          like_count: number
          post_id: string
          thumbnail_url: string
          user_id: string
          username: string
          why_ai: string
        }[]
      }
      get_watch_shorts: {
        Args: {
          p_category?: string
          p_cursor?: string
          p_max_duration?: number
          p_mode?: string
          p_page_size?: number
          p_search_query?: string
          p_seen_ids?: string[]
          p_user_id: string
          p_user_lat?: number
          p_user_lng?: number
        }
        Returns: {
          business_is_verified: boolean
          business_logo_url: string
          business_name: string
          comment_count: number
          course_country: string
          course_region: string
          creator_avatar_url: string
          creator_display_name: string
          creator_is_verified: boolean
          creator_relation: string
          creator_username: string
          display_order: number
          duration_seconds: number
          engagement_score: number
          height: number
          is_followed_by_me: boolean
          is_liked_by_me: boolean
          like_count: number
          media_id: string
          media_type: string
          media_url: string
          post_actor_id: string
          post_actor_type: string
          post_content: string
          post_created_at: string
          post_id: string
          post_status: string
          post_user_id: string
          poster_url: string
          review_course_id: string
          review_course_image: string
          review_course_name: string
          review_rating: number
          share_count: number
          source_review_id: string
          stream_id: string
          width: number
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
      immutable_date_trunc_minute: { Args: { ts: string }; Returns: string }
      increment_rate_limit: {
        Args: {
          p_user_id: string
          p_window_start: string
          p_window_type: string
        }
        Returns: undefined
      }
      insert_leaderboard_milestones: {
        Args: { milestones: Json }
        Returns: {
          inserted_count: number
        }[]
      }
      invite_golfer_from_discover: {
        Args: { p_user_id: string }
        Returns: Json
      }
      invite_golfer_to_verification:
        | { Args: { _note?: string; _user_id: string }; Returns: string }
        | {
            Args: { _invite_reason?: string; _note?: string; _user_id: string }
            Returns: string
          }
      invite_users_to_trip: {
        Args: { p_trip_id: string; p_user_ids: string[] }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_business_owner:
        | { Args: { _business_id: string }; Returns: boolean }
        | {
            Args: { p_business_id: string; p_user_profile_id: string }
            Returns: boolean
          }
      is_following_user: {
        Args: { followed: string; follower: string }
        Returns: boolean
      }
      is_host_of_game: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: boolean
      }
      is_message_saved: { Args: { p_message_id: string }; Returns: boolean }
      is_mobile_device: { Args: never; Returns: boolean }
      is_panel_admin: { Args: never; Returns: boolean }
      is_participant: {
        Args: { p_game_id: string; p_user_id: string }
        Returns: boolean
      }
      is_thread_member: { Args: { _thread_id: string }; Returns: boolean }
      is_user_blocked: {
        Args: { p_blocked_id: string; p_blocker_id: string }
        Returns: boolean
      }
      leave_group: { Args: { p_conversation_id: string }; Returns: boolean }
      leave_group_conversation: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      log_user_achievement: {
        Args: { p_event: string; p_metadata: Json; p_user_id: string }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_conversation_messages_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_message_read: { Args: { p_message_id: string }; Returns: undefined }
      mark_messages_read_in_conversation: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      match_tour_rankings_players: { Args: never; Returns: undefined }
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
      normalize_club_key: { Args: { p_name: string }; Returns: string }
      normalize_college_name: { Args: { name: string }; Returns: string }
      normalize_key: { Args: { p_text: string }; Returns: string }
      notifications_minute_bucket: { Args: { ts: string }; Returns: string }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      populate_taggable_entities: { Args: never; Returns: undefined }
      populate_tour_ranking_wins: { Args: never; Returns: undefined }
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
      prune_leaderboard_snapshots: { Args: never; Returns: undefined }
      publish_scheduled_posts: { Args: never; Returns: undefined }
      queue_push_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_title: string
          p_user_id: string
        }
        Returns: number
      }
      recalculate_review_vote_counts: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      record_course_log_impact: {
        Args: { p_course_id?: string; p_user_id: string }
        Returns: {
          courses_after: number
          courses_before: number
          days_remaining: number
          division_after: string
          division_before: string
          division_changed: boolean
          new_streak: number
          promoted: boolean
          rank_after: number
          rank_before: number
          rank_change: number
          rivals_passed: string[]
          season_name: string
        }[]
      }
      refresh_college_season_stats: {
        Args: { target_season_id?: string }
        Returns: undefined
      }
      refresh_college_season_stats_auto: { Args: never; Returns: undefined }
      refresh_college_weekly_movers: { Args: never; Returns: undefined }
      refresh_expired_course_mood_blurbs: { Args: never; Returns: number }
      register_push_token: {
        Args: { p_platform: string; p_token: string }
        Returns: string
      }
      reinvite_golfer_verification_request:
        | {
            Args: { p_admin_id: string; p_note?: string; p_request_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_admin_id: string
              p_invite_reason?: string
              p_note?: string
              p_request_id: string
            }
            Returns: Json
          }
      reject_business_verification: {
        Args: { _admin_note: string; _request_id: string }
        Returns: undefined
      }
      remove_business_member: {
        Args: { p_business_id: string; p_member_user_id: string }
        Returns: Json
      }
      remove_from_business_team: {
        Args: { p_business_id: string; p_user_profile_id: string }
        Returns: Json
      }
      remove_golfer_verification: {
        Args: { p_note?: string; p_user_id: string }
        Returns: undefined
      }
      remove_group_member: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      remove_message_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: undefined
      }
      reorder_after_removal: {
        Args: { p_course_ids: string[]; p_user_id: string }
        Returns: undefined
      }
      reorder_top_ten_courses: {
        Args: { p_course_ids: string[]; p_user_id: string }
        Returns: undefined
      }
      request_business_verification: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      request_club_page: {
        Args: { p_club_name: string; p_manager_email?: string }
        Returns: string
      }
      request_domain_verification: {
        Args: { p_domain: string; p_request_id: string }
        Returns: Json
      }
      reset_golfer_verification_test_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      reset_watch_personalization: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      revoke_business_verification:
        | { Args: { _business_id: string; _reason?: string }; Returns: Json }
        | {
            Args: {
              p_admin_id: string
              p_business_id: string
              p_bypass_cooldown?: boolean
              p_reason?: string
            }
            Returns: undefined
          }
      rotate_championship_seasons: { Args: never; Returns: undefined }
      rpc_explore_trending: {
        Args: { p_limit?: number; p_region_key?: string }
        Returns: {
          aspect_ratio: number
          comments_count: number
          course_id: string
          created_at: string
          display_order: number
          likes_count: number
          media_type: string
          media_url: string
          moment_id: string
          region_key: string
          shares_count: number
          source_id: string
          source_type: string
          stream_id: string
          thumbnail_url: string
          trend_score: number
          user_id: string
        }[]
      }
      search_golf_clubs: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          country: string
          id: string
          member_count: number
          name: string
          region: string
        }[]
      }
      search_golf_courses: {
        Args: {
          country_filter?: string
          limit_count?: number
          list_slug?: string
          offset_count?: number
          region_slug?: string
          search_query?: string
        }
        Returns: {
          continent: string
          country: string
          country_rank: number
          created_at: string
          description: string
          global_rank: number
          id: string
          latitude: number
          list_memberships: Json
          longitude: number
          name: string
          region: string
          regional_rank: number
          sub_country: string
          thumbnail_image: string
          top100_url: string
          updated_at: string
          usa_rank: number
          website_url: string
        }[]
      }
      search_users_for_team: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          display_name: string
          id: string
          is_verified_golfer: boolean
          profile_photo_url: string
          username: string
        }[]
      }
      seed_user_personal_ranks: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      send_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_media_metadata?: Json
          p_media_url?: string
          p_message_type?: string
          p_reply_to_id?: string
        }
        Returns: string
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
      set_business_access: {
        Args: {
          p_access: string
          p_business_id: string
          p_user_profile_id: string
        }
        Returns: Json
      }
      set_home_club: {
        Args: { p_business_id?: string; p_pending_name?: string }
        Returns: undefined
      }
      set_home_clubs: {
        Args: {
          p_additional_business_ids?: string[]
          p_clear_pending?: boolean
          p_primary_business_id: string
        }
        Returns: undefined
      }
      set_typing_indicator: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      snapshot_daily_ranks: { Args: never; Returns: undefined }
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
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
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
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
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
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
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
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
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
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
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
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
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
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
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
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
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
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
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
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
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
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
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
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
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
      submit_business_verification_review:
        | {
            Args: { _decision: string; _note?: string; _request_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_bypass_cooldown?: boolean
              p_decision: string
              p_note?: string
              p_request_id: string
              p_reviewer_id: string
            }
            Returns: Json
          }
      submit_golfer_verification_request: {
        Args: { _evidence_url?: string; _note?: string; _request_id: string }
        Returns: undefined
      }
      submit_golfer_verification_review: {
        Args: { _decision: string; _note?: string; _request_id: string }
        Returns: undefined
      }
      submit_report: {
        Args: {
          p_details?: string
          p_reason?: string
          p_reported_conversation_id?: string
          p_reported_user_id?: string
        }
        Returns: string
      }
      sync_user_email: {
        Args: { current_email: string; user_id_param: string }
        Returns: undefined
      }
      test_echo_insert: { Args: never; Returns: string }
      test_lab_clear_notifications: {
        Args: { p_target_user_id: string; p_test_user_id: string }
        Returns: undefined
      }
      test_lab_clear_relationships: {
        Args: { p_target_user_id: string; p_test_user_id: string }
        Returns: undefined
      }
      test_lab_follow: {
        Args: { p_target_user_id: string; p_test_user_id: string }
        Returns: undefined
      }
      test_lab_insert_notification: {
        Args: {
          p_actor_id: string
          p_created_at?: string
          p_data?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_is_read?: boolean
          p_message?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      test_lab_insert_notifications_batch: {
        Args: { p_notifications: Json }
        Returns: number
      }
      test_lab_send_friend_request: {
        Args: { p_target_user_id: string; p_test_user_id: string }
        Returns: string
      }
      test_lab_unfollow: {
        Args: { p_target_user_id: string; p_test_user_id: string }
        Returns: undefined
      }
      test_lab_update_friend_request: {
        Args: { p_friend_id: string; p_new_status: string; p_user_id: string }
        Returns: undefined
      }
      toggle_conversation_archive: {
        Args: { p_archive: boolean; p_conversation_id: string }
        Returns: boolean
      }
      toggle_conversation_mute: {
        Args: { p_conversation_id: string; p_mute: boolean }
        Returns: undefined
      }
      toggle_saved_message: { Args: { p_message_id: string }; Returns: boolean }
      track_profile_analytics_event: {
        Args: {
          p_action_type?: string
          p_content_id?: string
          p_event_type: string
          p_metadata?: Json
          p_profile_id: string
          p_profile_type: string
          p_source?: string
          p_user_id?: string
        }
        Returns: string
      }
      trigger_push_queue_processing: { Args: never; Returns: undefined }
      trigger_video_metadata_backfill: { Args: never; Returns: undefined }
      trigger_watch_editorial_blurb_refresh: { Args: never; Returns: undefined }
      unaccent: { Args: { "": string }; Returns: string }
      unblock_user: { Args: { p_blocked_id: string }; Returns: undefined }
      unlockrows: { Args: { "": string }; Returns: number }
      unregister_push_token: { Args: { p_token: string }; Returns: undefined }
      update_business_member_role: {
        Args: {
          p_business_id: string
          p_member_user_id: string
          p_new_role: string
        }
        Returns: Json
      }
      update_business_verification_status: {
        Args: { p_notes?: string; p_profile_id: string; p_status: string }
        Returns: undefined
      }
      update_group_info: {
        Args: {
          p_avatar_url?: string
          p_conversation_id: string
          p_description?: string
          p_name?: string
        }
        Returns: boolean
      }
      update_member_role: {
        Args: {
          p_conversation_id: string
          p_new_role: string
          p_user_id: string
        }
        Returns: boolean
      }
      update_message_delivery_status: {
        Args: { p_message_id: string; p_status: string }
        Returns: undefined
      }
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
      update_presence: { Args: { p_status: string }; Returns: undefined }
      update_user_personal_rank_order: {
        Args: { p_ordered_course_ids: string[]; p_user_id: string }
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
      upsert_business_team_member:
        | {
            Args: {
              p_business_id: string
              p_role: Database["public"]["Enums"]["business_team_role"]
              p_user_profile_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_business_id: string
              p_role: string
              p_user_profile_id: string
            }
            Returns: string
          }
      user_can_see_game: {
        Args: { _game_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_conversation_participant: {
        Args: { check_user_id: string; conv_id: string }
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
      verify_domain_code: {
        Args: { p_code: string; p_verification_id: string }
        Returns: Json
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
      business_team_role: "owner" | "admin" | "director" | "coach" | "staff"
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
      course_type:
        | "links"
        | "parkland"
        | "heathland"
        | "desert"
        | "mountain"
        | "coastal"
        | "mixed"
      creator_event_type:
        | "impression"
        | "profile_visit"
        | "follow"
        | "unfollow"
        | "post_view"
        | "post_like"
        | "post_unlike"
        | "post_comment"
        | "post_save"
        | "post_unsave"
        | "post_share"
        | "cta_click"
        | "external_link_click"
      creator_team_role: "owner" | "admin" | "editor" | "analyst"
      leaderboard_scope:
        | "global"
        | "gbi"
        | "europe"
        | "usa"
        | "friends"
        | "nearby"
      leaderboard_time_range: "all_time" | "this_year" | "this_month"
      milestone_type:
        | "new_personal_best"
        | "entered_rank_tier"
        | "fast_climber"
        | "top_percentile"
        | "overtook_rivals"
      ping_format: "NINE" | "EIGHTEEN" | "RANGE" | "CASUAL"
      ping_response_state: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"
      ping_status: "ACTIVE" | "MATCHING" | "CLOSED"
      ping_visibility: "FRIENDS" | "NEARBY" | "ALL"
      post_visibility: "anyone" | "followers" | "private"
      user_type:
        | "individual"
        | "club"
        | "pro_shop"
        | "academy"
        | "tour_event"
        | "other"
        | "brand"
        | "creator"
        | "personal"
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
      business_team_role: ["owner", "admin", "director", "coach", "staff"],
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
      course_type: [
        "links",
        "parkland",
        "heathland",
        "desert",
        "mountain",
        "coastal",
        "mixed",
      ],
      creator_event_type: [
        "impression",
        "profile_visit",
        "follow",
        "unfollow",
        "post_view",
        "post_like",
        "post_unlike",
        "post_comment",
        "post_save",
        "post_unsave",
        "post_share",
        "cta_click",
        "external_link_click",
      ],
      creator_team_role: ["owner", "admin", "editor", "analyst"],
      leaderboard_scope: [
        "global",
        "gbi",
        "europe",
        "usa",
        "friends",
        "nearby",
      ],
      leaderboard_time_range: ["all_time", "this_year", "this_month"],
      milestone_type: [
        "new_personal_best",
        "entered_rank_tier",
        "fast_climber",
        "top_percentile",
        "overtook_rivals",
      ],
      ping_format: ["NINE", "EIGHTEEN", "RANGE", "CASUAL"],
      ping_response_state: ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],
      ping_status: ["ACTIVE", "MATCHING", "CLOSED"],
      ping_visibility: ["FRIENDS", "NEARBY", "ALL"],
      post_visibility: ["anyone", "followers", "private"],
      user_type: [
        "individual",
        "club",
        "pro_shop",
        "academy",
        "tour_event",
        "other",
        "brand",
        "creator",
        "personal",
      ],
    },
  },
} as const
