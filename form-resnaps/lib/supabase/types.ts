export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      attendance_logs: {
        Row: {
          actor: string | null;
          guest_id: string;
          id: string;
          scanned_at: string;
          session_id: string | null;
          source: Database["public"]["Enums"]["attendance_source"];
          type: Database["public"]["Enums"]["attendance_type"];
          user_agent: string | null;
        };
        ComputedFields: never;
        Insert: {
          actor?: string | null;
          guest_id: string;
          id?: string;
          scanned_at?: string;
          session_id?: string | null;
          source?: Database["public"]["Enums"]["attendance_source"];
          type: Database["public"]["Enums"]["attendance_type"];
          user_agent?: string | null;
        };
        Update: {
          actor?: string | null;
          guest_id?: string;
          id?: string;
          scanned_at?: string;
          session_id?: string | null;
          source?: Database["public"]["Enums"]["attendance_source"];
          type?: Database["public"]["Enums"]["attendance_type"];
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_logs_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guest_status";
            referencedColumns: ["guest_id"];
          },
          {
            foreignKeyName: "attendance_logs_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_logs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "scan_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor: string | null;
          created_at: string;
          id: string;
          meta: Json | null;
          target_guest: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor?: string | null;
          created_at?: string;
          id?: string;
          meta?: Json | null;
          target_guest?: string | null;
        };
        Update: {
          action?: string;
          actor?: string | null;
          created_at?: string;
          id?: string;
          meta?: Json | null;
          target_guest?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_target_guest_fkey";
            columns: ["target_guest"];
            isOneToOne: false;
            referencedRelation: "guest_status";
            referencedColumns: ["guest_id"];
          },
          {
            foreignKeyName: "audit_logs_target_guest_fkey";
            columns: ["target_guest"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
        ];
      };
      committee_members: {
        Row: {
          created_at: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      event_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          category: string | null;
          contact: string | null;
          created_at: string;
          full_name: string;
          id: string;
          import_batch: string | null;
          name_search: string;
          notes: string | null;
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          contact?: string | null;
          created_at?: string;
          full_name: string;
          id?: string;
          import_batch?: string | null;
          name_search: string;
          notes?: string | null;
        };
        Update: {
          category?: string | null;
          contact?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          import_batch?: string | null;
          name_search?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      scan_sessions: {
        Row: {
          consumed_at: string | null;
          expires_at: string;
          guest_id: string | null;
          id: string;
          ip_hash: string | null;
          issued_at: string;
          key_version: number;
          mode: Database["public"]["Enums"]["attendance_type"];
          user_agent: string | null;
        };
        ComputedFields: never;
        Insert: {
          consumed_at?: string | null;
          expires_at: string;
          guest_id?: string | null;
          id?: string;
          ip_hash?: string | null;
          issued_at?: string;
          key_version: number;
          mode: Database["public"]["Enums"]["attendance_type"];
          user_agent?: string | null;
        };
        Update: {
          consumed_at?: string | null;
          expires_at?: string;
          guest_id?: string | null;
          id?: string;
          ip_hash?: string | null;
          issued_at?: string;
          key_version?: number;
          mode?: Database["public"]["Enums"]["attendance_type"];
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scan_sessions_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guest_status";
            referencedColumns: ["guest_id"];
          },
          {
            foreignKeyName: "scan_sessions_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      guest_status: {
        Row: {
          category: string | null;
          checked_in_at: string | null;
          checked_out_at: string | null;
          full_name: string | null;
          guest_id: string | null;
          status: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      assert_committee: { Args: { p_actor: string; p_admin?: boolean }; Returns: undefined };
      check_in: { Args: { p_guest_id: string; p_session_id: string; p_ua: string }; Returns: Json };
      check_out: {
        Args: { p_guest_id: string; p_session_id: string; p_ua: string };
        Returns: Json;
      };
      is_committee: { Args: Record<PropertyKey, never>; Returns: boolean };
      manual_attendance: {
        Args: {
          p_actor: string;
          p_guest_id: string;
          p_type: Database["public"]["Enums"]["attendance_type"];
        };
        Returns: Json;
      };
      normalize_name: { Args: { p: string }; Returns: string };
      revoke_all_sessions: { Args: { p_actor: string }; Returns: Json };
      search_guests: {
        Args: {
          p_limit?: number;
          p_mode: Database["public"]["Enums"]["attendance_type"];
          p_query: string;
        };
        Returns: {
          category: string;
          full_name: string;
          id: string;
        }[];
      };
      setting_text: { Args: { p_key: string }; Returns: string };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
      start_scan_session: {
        Args: {
          p_ip_hash: string;
          p_key_version: number;
          p_mode: Database["public"]["Enums"]["attendance_type"];
          p_ua: string;
        };
        Returns: Json;
      };
      unaccent: { Args: { "": string }; Returns: string };
      undo_attendance: {
        Args: {
          p_actor: string;
          p_guest_id: string;
          p_reason: string;
          p_type: Database["public"]["Enums"]["attendance_type"];
        };
        Returns: Json;
      };
    };
    Enums: {
      attendance_source: "qr" | "manual";
      attendance_type: "in" | "out";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attendance_source: ["qr", "manual"],
      attendance_type: ["in", "out"],
    },
  },
} as const;
