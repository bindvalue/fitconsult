export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string | null
          duration_minutes: number | null
          id: string
          logged_at: string | null
          notes: string | null
          rating: number | null
          student_id: string | null
          workout_plan_id: string | null
        }
        Insert: {
          activity_type?: string | null
          duration_minutes?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          rating?: number | null
          student_id?: string | null
          workout_plan_id?: string | null
        }
        Update: {
          activity_type?: string | null
          duration_minutes?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          rating?: number | null
          student_id?: string | null
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis: {
        Row: {
          already_trains: boolean | null
          available_schedule: string[] | null
          completed_at: string | null
          health_conditions: string | null
          id: string
          main_goal: string | null
          medications: string | null
          physical_limitations: string | null
          preferred_activities: string[] | null
          professor_id: string | null
          student_id: string | null
          training_frequency: number | null
        }
        Insert: {
          already_trains?: boolean | null
          available_schedule?: string[] | null
          completed_at?: string | null
          health_conditions?: string | null
          id?: string
          main_goal?: string | null
          medications?: string | null
          physical_limitations?: string | null
          preferred_activities?: string[] | null
          professor_id?: string | null
          student_id?: string | null
          training_frequency?: number | null
        }
        Update: {
          already_trains?: boolean | null
          available_schedule?: string[] | null
          completed_at?: string | null
          health_conditions?: string | null
          id?: string
          main_goal?: string | null
          medications?: string | null
          physical_limitations?: string | null
          preferred_activities?: string[] | null
          professor_id?: string | null
          student_id?: string | null
          training_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      benchmark_workouts: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          name: string
          scaling_options: Json | null
          workout_structure: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          name: string
          scaling_options?: Json | null
          workout_structure: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          scaling_options?: Json | null
          workout_structure?: Json
        }
        Relationships: []
      }
      challenges: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          id: string
          is_predefined: boolean
          points: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_predefined?: boolean
          points?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_predefined?: boolean
          points?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          google_meet_link: string | null
          id: string
          notes: string | null
          professor_id: string | null
          scheduled_at: string
          status: string | null
          student_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          google_meet_link?: string | null
          id?: string
          notes?: string | null
          professor_id?: string | null
          scheduled_at: string
          status?: string | null
          student_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          google_meet_link?: string | null
          id?: string
          notes?: string | null
          professor_id?: string | null
          scheduled_at?: string
          status?: string | null
          student_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crossfit_exercises: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          equipment_needed: string[] | null
          id: string
          movement_pattern: string | null
          name: string
          scaling_options: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          equipment_needed?: string[] | null
          id?: string
          movement_pattern?: string | null
          name: string
          scaling_options?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          equipment_needed?: string[] | null
          id?: string
          movement_pattern?: string | null
          name?: string
          scaling_options?: Json | null
        }
        Relationships: []
      }
      hero_workouts: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          scaling_options: Json | null
          story: string | null
          workout_structure: Json
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          scaling_options?: Json | null
          story?: string | null
          workout_structure: Json
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          scaling_options?: Json | null
          story?: string | null
          workout_structure?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          edited_at: string | null
          id: string
          message: string
          original_message: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
          sent_at: string | null
        }
        Insert: {
          edited_at?: string | null
          id?: string
          message: string
          original_message?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Update: {
          edited_at?: string | null
          id?: string
          message?: string
          original_message?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          cref: string | null
          experience_years: number | null
          id: string
          specialization: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          cref?: string | null
          experience_years?: number | null
          id?: string
          specialization?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          cref?: string | null
          experience_years?: number | null
          id?: string
          specialization?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          description: string | null
          id: string
          is_baseline: boolean | null
          measurements: Json | null
          photo_url: string
          professor_comment: string | null
          student_id: string | null
          taken_at: string | null
          weight: number | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_baseline?: boolean | null
          measurements?: Json | null
          photo_url: string
          professor_comment?: string | null
          student_id?: string | null
          taken_at?: string | null
          weight?: number | null
        }
        Update: {
          description?: string | null
          id?: string
          is_baseline?: boolean | null
          measurements?: Json | null
          photo_url?: string
          professor_comment?: string | null
          student_id?: string | null
          taken_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          action_type: string
          attempted_at: string | null
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          attempted_at?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          attempted_at?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      student_challenges: {
        Row: {
          assigned_at: string
          assigned_by: string
          challenge_id: string
          completed_at: string | null
          id: string
          notes: string | null
          progress: number | null
          status: string
          student_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          challenge_id: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          status?: string
          student_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          challenge_id?: string
          completed_at?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_challenges_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_challenges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          height: number | null
          id: string
          phone: string | null
          selected_plan: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          height?: number | null
          id?: string
          phone?: string | null
          selected_plan?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          height?: number | null
          id?: string
          phone?: string | null
          selected_plan?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          active: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          starts_at: string
          student_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          expires_at: string
          id?: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          starts_at: string
          student_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          starts_at?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          active: boolean | null
          completed_weeks: number | null
          created_at: string | null
          current_week: number | null
          description: string | null
          duration_weeks: number | null
          exercises: Json | null
          frequency_per_week: number | null
          id: string
          last_workout_date: string | null
          professor_id: string | null
          scaling_options: Json | null
          started_at: string | null
          student_id: string | null
          time_cap_minutes: number | null
          title: string
          workout_type: string | null
        }
        Insert: {
          active?: boolean | null
          completed_weeks?: number | null
          created_at?: string | null
          current_week?: number | null
          description?: string | null
          duration_weeks?: number | null
          exercises?: Json | null
          frequency_per_week?: number | null
          id?: string
          last_workout_date?: string | null
          professor_id?: string | null
          scaling_options?: Json | null
          started_at?: string | null
          student_id?: string | null
          time_cap_minutes?: number | null
          title: string
          workout_type?: string | null
        }
        Update: {
          active?: boolean | null
          completed_weeks?: number | null
          created_at?: string | null
          current_week?: number | null
          description?: string | null
          duration_weeks?: number | null
          exercises?: Json | null
          frequency_per_week?: number | null
          id?: string
          last_workout_date?: string | null
          professor_id?: string | null
          scaling_options?: Json | null
          started_at?: string | null
          student_id?: string | null
          time_cap_minutes?: number | null
          title?: string
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          completed_status: boolean | null
          created_at: string | null
          day_number: number
          duration_minutes: number | null
          id: string
          notes: string | null
          observation: string | null
          rating: number | null
          student_id: string
          week_number: number
          workout_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_status?: boolean | null
          created_at?: string | null
          day_number: number
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          observation?: string | null
          rating?: number | null
          student_id: string
          week_number: number
          workout_plan_id: string
        }
        Update: {
          completed_at?: string | null
          completed_status?: boolean | null
          created_at?: string | null
          day_number?: number
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          observation?: string | null
          rating?: number | null
          student_id?: string
          week_number?: number
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_student_account: {
        Args: { student_user_id: string }
        Returns: boolean
      }
      approve_professor: {
        Args: { professor_user_id: string }
        Returns: boolean
      }
      block_student_account: {
        Args: { student_user_id: string }
        Returns: boolean
      }
      create_admin_user: {
        Args: {
          admin_email: string
          admin_name: string
          admin_password: string
        }
        Returns: string
      }
      debug_user_registration: {
        Args: { user_email: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pending_student_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          status: string
          created_at: string
          age: number
          phone: string
          emergency_contact: string
        }[]
      }
      has_active_plan: {
        Args: { student_user_id: string }
        Returns: boolean
      }
      has_premium_plan: {
        Args: { student_user_id: string }
        Returns: boolean
      }
      is_account_active: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_valid_uuid: {
        Args: { input_text: string }
        Returns: boolean
      }
      list_pending_professors: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          status: string
          created_at: string
          cref: string
          specialization: string
          experience_years: number
          bio: string
        }[]
      }
      list_pending_student_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          status: string
          created_at: string
          age: number
          phone: string
          emergency_contact: string
        }[]
      }
      promote_to_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      reject_professor: {
        Args: { professor_user_id: string }
        Returns: boolean
      }
      test_professor_registration: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      upgrade_user_to_admin: {
        Args: { user_email: string; admin_name: string }
        Returns: string
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "pending" | "active" | "blocked" | "expired"
      subscription_plan: "basic" | "premium"
      user_role: "student" | "professor" | "admin"
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
      account_status: ["pending", "active", "blocked", "expired"],
      subscription_plan: ["basic", "premium"],
      user_role: ["student", "professor", "admin"],
    },
  },
} as const
