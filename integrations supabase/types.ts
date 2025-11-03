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
      admin_audit_log: {
        Row: {
          accessed_at: string | null
          action: string
          admin_email: string | null
          admin_user_id: string | null
          id: string
          ip_address: string | null
          reason: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          accessed_at?: string | null
          action: string
          admin_email?: string | null
          admin_user_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          accessed_at?: string | null
          action?: string
          admin_email?: string | null
          admin_user_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          booking_id: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string | null
          status: string
          storage_limit_gb: number
          storage_used_gb: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          status?: string
          storage_limit_gb?: number
          storage_used_gb?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string | null
          status?: string
          storage_limit_gb?: number
          storage_used_gb?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "custom_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          project_id: string | null
          read: boolean | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          project_id?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          booking_id: string | null
          contract_type: string
          contract_url: string | null
          created_at: string | null
          id: string
          notes: string | null
          project_id: string | null
          signed: boolean | null
          signed_date: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          contract_type: string
          contract_url?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          signed?: boolean | null
          signed_date?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          contract_type?: string
          contract_url?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          signed?: boolean | null
          signed_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "custom_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_booking_requests: {
        Row: {
          admin_notes: string | null
          approval_token: string | null
          approved_at: string | null
          approved_price: number | null
          archived_at: string | null
          archived_by: string | null
          booking_date: string
          booking_time: string
          client_company: string | null
          client_email: string
          client_name: string
          client_phone: string
          client_type: string
          counter_price: number | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_permanently: boolean | null
          deposit_amount: number
          id: string
          project_details: string | null
          requested_price: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_price?: number | null
          archived_at?: string | null
          archived_by?: string | null
          booking_date: string
          booking_time: string
          client_company?: string | null
          client_email: string
          client_name: string
          client_phone: string
          client_type: string
          counter_price?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_permanently?: boolean | null
          deposit_amount: number
          id?: string
          project_details?: string | null
          requested_price: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_price?: number | null
          archived_at?: string | null
          archived_by?: string | null
          booking_date?: string
          booking_time?: string
          client_company?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string
          client_type?: string
          counter_price?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_permanently?: boolean | null
          deposit_amount?: number
          id?: string
          project_details?: string | null
          requested_price?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliverable_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          message: string
          timecode: string | null
          user_id: string
          version_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          message: string
          timecode?: string | null
          user_id: string
          version_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          message?: string
          timecode?: string | null
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_feedback_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "deliverable_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverable_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          deliverable_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          id: string
          mime_type: string | null
          notes: string | null
          status: string
          storage_bucket: string
          uploaded_at: string | null
          uploaded_by: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          deliverable_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          status?: string
          storage_bucket: string
          uploaded_at?: string | null
          uploaded_by: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          deliverable_id?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          status?: string
          storage_bucket?: string
          uploaded_at?: string | null
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_versions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string | null
          created_by: string
          deliverable_type: string
          description: string | null
          id: string
          max_revisions: number | null
          project_id: string
          specs: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deliverable_type: string
          description?: string | null
          id?: string
          max_revisions?: number | null
          project_id: string
          specs?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deliverable_type?: string
          description?: string | null
          id?: string
          max_revisions?: number | null
          project_id?: string
          specs?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: string | null
          reason: string | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          reason?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          refresh_token: string
          scope: string
          token_expiry: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          refresh_token: string
          scope: string
          token_expiry: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          refresh_token?: string
          scope?: string
          token_expiry?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number
          google_calendar_event_id: string | null
          id: string
          meeting_link: string | null
          meeting_outcome: string | null
          opportunity_id: string | null
          project_id: string | null
          recording_url: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number
          google_calendar_event_id?: string | null
          id?: string
          meeting_link?: string | null
          meeting_outcome?: string | null
          opportunity_id?: string | null
          project_id?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number
          google_calendar_event_id?: string | null
          id?: string
          meeting_link?: string | null
          meeting_outcome?: string | null
          opportunity_id?: string | null
          project_id?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "custom_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          metadata: Json | null
          name: string | null
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          budget_max: number | null
          budget_min: number | null
          company: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          notes: string | null
          service_type: string
          source: string | null
          stage: string
          updated_at: string | null
          win_probability: number | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          service_type: string
          source?: string | null
          stage?: string
          updated_at?: string | null
          win_probability?: number | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          service_type?: string
          source?: string | null
          stage?: string
          updated_at?: string | null
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "custom_booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_date: string | null
          payment_type: string
          project_id: string | null
          status: string
          stripe_checkout_url: string | null
          stripe_payment_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_type: string
          project_id?: string | null
          status?: string
          stripe_checkout_url?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_type?: string
          project_id?: string | null
          status?: string
          stripe_checkout_url?: string | null
          stripe_payment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "custom_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          id: string
          mime_type: string | null
          project_id: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          id?: string
          mime_type?: string | null
          project_id: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          project_id?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_delivery_date: string | null
          booking_id: string | null
          created_at: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          opportunity_id: string | null
          project_name: string
          project_type: string
          revision_count: number | null
          shoot_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          booking_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          project_name: string
          project_type: string
          revision_count?: number | null
          shoot_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          booking_id?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string | null
          project_name?: string
          project_type?: string
          revision_count?: number | null
          shoot_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "custom_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_upgrades: {
        Row: {
          amount_gb: number
          client_id: string
          id: string
          price_paid: number
          purchased_at: string
          stripe_price_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_gb: number
          client_id: string
          id?: string
          price_paid: number
          purchased_at?: string
          stripe_price_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_gb?: number
          client_id?: string
          id?: string
          price_paid?: number
          purchased_at?: string
          stripe_price_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_upgrades_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_recent_booking_submission: {
        Args: { p_email: string }
        Returns: boolean
      }
      cleanup_old_failed_attempts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_client_project_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      has_admin_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_account_locked: {
        Args: { p_email: string }
        Returns: boolean
      }
      is_client: {
        Args: { p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "client"
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
      app_role: ["admin", "user", "client"],
    },
  },
} as const
