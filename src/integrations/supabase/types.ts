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
      golf_courses: {
        Row: {
          continent: Database["public"]["Enums"]["continent"]
          country: string
          created_at: string
          description: string | null
          global_rank: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string | null
          regional_rank: number | null
          thumbnail_image: string | null
          top100_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          continent: Database["public"]["Enums"]["continent"]
          country: string
          created_at?: string
          description?: string | null
          global_rank?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region?: string | null
          regional_rank?: number | null
          thumbnail_image?: string | null
          top100_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          continent?: Database["public"]["Enums"]["continent"]
          country?: string
          created_at?: string
          description?: string | null
          global_rank?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string | null
          regional_rank?: number | null
          thumbnail_image?: string | null
          top100_url?: string | null
          updated_at?: string
          website_url?: string | null
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
      user_profiles: {
        Row: {
          bag_visible: boolean | null
          created_at: string | null
          eg_app_connected: boolean | null
          eg_handicap_index: number | null
          eg_recent_rounds: Json | null
          home_club: string | null
          id: string
          profile_photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          bag_visible?: boolean | null
          created_at?: string | null
          eg_app_connected?: boolean | null
          eg_handicap_index?: number | null
          eg_recent_rounds?: Json | null
          home_club?: string | null
          id: string
          profile_photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bag_visible?: boolean | null
          created_at?: string | null
          eg_app_connected?: boolean | null
          eg_handicap_index?: number | null
          eg_recent_rounds?: Json | null
          home_club?: string | null
          id?: string
          profile_photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      continent:
        | "North America"
        | "South America"
        | "Europe"
        | "Asia"
        | "Africa"
        | "Oceania"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      continent: [
        "North America",
        "South America",
        "Europe",
        "Asia",
        "Africa",
        "Oceania",
      ],
    },
  },
} as const
