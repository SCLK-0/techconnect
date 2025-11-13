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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          donor_id: string
          donor_name: string | null
          gcash_name: string | null
          gcash_number: string | null
          id: string
          proof_of_payment: string | null
          recipient_id: string | null
          recipient_type: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donor_id: string
          donor_name?: string | null
          gcash_name?: string | null
          gcash_number?: string | null
          id?: string
          proof_of_payment?: string | null
          recipient_id?: string | null
          recipient_type: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donor_id?: string
          donor_name?: string | null
          gcash_name?: string | null
          gcash_number?: string | null
          id?: string
          proof_of_payment?: string | null
          recipient_id?: string | null
          recipient_type?: string
          status?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          created_at: string | null
          id: string
          registered_year: string
          subjects_of_interest: string[]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          registered_year: string
          subjects_of_interest: string[]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          registered_year?: string
          subjects_of_interest?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string | null
          description: string | null
          download_count: number
          file_type: string | null
          file_url: string
          id: string
          status: string | null
          title: string
          tutor_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          download_count?: number
          file_type?: string | null
          file_url: string
          id?: string
          status?: string | null
          title: string
          tutor_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          download_count?: number
          file_type?: string | null
          file_url?: string
          id?: string
          status?: string | null
          title?: string
          tutor_id?: string
        }
        Relationships: []
      }
      session_assets: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          session_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          session_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          session_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_assets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_logs: {
        Row: {
          accomplishments: string | null
          created_at: string
          homework: string | null
          id: string
          next_steps: string | null
          session_id: string
          topics_covered: string
          user_id: string
          user_role: string
        }
        Insert: {
          accomplishments?: string | null
          created_at?: string
          homework?: string | null
          id?: string
          next_steps?: string | null
          session_id: string
          topics_covered: string
          user_id: string
          user_role: string
        }
        Update: {
          accomplishments?: string | null
          created_at?: string
          homework?: string | null
          id?: string
          next_steps?: string | null
          session_id?: string
          topics_covered?: string
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          duration: string | null
          duration_minutes: number
          id: string
          learner_id: string
          learner_peer_id: string | null
          scheduled_at: string | null
          session_status: string | null
          session_type: string | null
          status: string | null
          subject: string
          tutor_id: string
          tutor_peer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          duration_minutes: number
          id?: string
          learner_id: string
          learner_peer_id?: string | null
          scheduled_at?: string | null
          session_status?: string | null
          session_type?: string | null
          status?: string | null
          subject: string
          tutor_id: string
          tutor_peer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          duration_minutes?: number
          id?: string
          learner_id?: string
          learner_peer_id?: string | null
          scheduled_at?: string | null
          session_status?: string | null
          session_type?: string | null
          status?: string | null
          subject?: string
          tutor_id?: string
          tutor_peer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sessions_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tutor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          tutor_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          tutor_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          tutor_id?: string
        }
        Relationships: []
      }
      tutor_day_availability: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          is_available: boolean
          start_time: string | null
          tutor_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          start_time?: string | null
          tutor_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          start_time?: string | null
          tutor_id?: string
        }
        Relationships: []
      }
      tutor_profiles: {
        Row: {
          bio: string
          created_at: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          status: string | null
          subject_expertise: string[]
          user_id: string
        }
        Insert: {
          bio: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          status?: string | null
          subject_expertise: string[]
          user_id: string
        }
        Update: {
          bio?: string
          created_at?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          status?: string | null
          subject_expertise?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      whiteboard_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whiteboard_states: {
        Row: {
          canvas_state: Json
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          canvas_state: Json
          id?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          canvas_state?: Json
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_states_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      donations_recipient_view: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string | null
          recipient_id: string | null
          recipient_type: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_tutor_rating: {
        Args: { tutor_user_id: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
      get_tutor_stats: {
        Args: { tutor_user_id: string }
        Returns: {
          average_rating: number
          completed_sessions: number
          pending_sessions: number
          total_donations: number
          total_reviews: number
          total_sessions: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_resource_downloads: {
        Args: { resource_id: string }
        Returns: undefined
      }
      is_tutor_actually_online: {
        Args: { tutor_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tutor" | "learner"
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
      app_role: ["admin", "tutor", "learner"],
    },
  },
} as const
