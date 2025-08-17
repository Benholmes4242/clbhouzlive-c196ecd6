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
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
          token?: string
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
          id: string
          rating: number
          review: string | null
          review_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          review_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          review_date?: string | null
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
          review_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          media_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          media_url?: string
          review_id?: string
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
          created_at: string
          id: string
          media_type: string
          media_url: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
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
          home_club: string | null
          id: string
          is_public: boolean | null
          location: string | null
          logo_url: string | null
          notification_preferences: Json | null
          pending_email: string | null
          phone: string | null
          pinned_achievement_ids: string[] | null
          profile_photo_url: string | null
          profile_video_thumbnail_url: string | null
          profile_video_url: string | null
          profile_video_visibility: string | null
          show_achievements_public: boolean | null
          social_links: Json | null
          top100_visible: boolean | null
          tracker_visible: boolean | null
          updated_at: string | null
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
          contact_person_name?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
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
          home_club?: string | null
          id: string
          is_public?: boolean | null
          location?: string | null
          logo_url?: string | null
          notification_preferences?: Json | null
          pending_email?: string | null
          phone?: string | null
          pinned_achievement_ids?: string[] | null
          profile_photo_url?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          profile_video_visibility?: string | null
          show_achievements_public?: boolean | null
          social_links?: Json | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          updated_at?: string | null
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
          contact_person_name?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
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
          home_club?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          logo_url?: string | null
          notification_preferences?: Json | null
          pending_email?: string | null
          phone?: string | null
          pinned_achievement_ids?: string[] | null
          profile_photo_url?: string | null
          profile_video_thumbnail_url?: string | null
          profile_video_url?: string | null
          profile_video_visibility?: string | null
          show_achievements_public?: boolean | null
          social_links?: Json | null
          top100_visible?: boolean | null
          tracker_visible?: boolean | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
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
    }
    Functions: {
      can_change_email: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      check_and_award_badges: {
        Args: { user_id_param: string }
        Returns: {
          newly_awarded_badges: Json
        }[]
      }
      execute_sql: {
        Args: { params?: Json; query: string }
        Returns: Json
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
      get_all_users_admin: {
        Args: Record<PropertyKey, never>
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
      get_cloudflare_secrets: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_user_top100_courses_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_mobile_device: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_user_achievement: {
        Args: {
          achievement_data_param: Json
          achievement_type_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      populate_taggable_entities: {
        Args: Record<PropertyKey, never>
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
    }
    Enums: {
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
      user_type:
        | "individual"
        | "club"
        | "pro_shop"
        | "academy"
        | "tour_event"
        | "other"
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
    Enums: {
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
