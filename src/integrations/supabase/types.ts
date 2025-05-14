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
      admin_settings: {
        Row: {
          auto_sync: boolean
          google_connected: boolean
          google_email: string | null
          google_folder_id: string | null
          google_folder_name: string | null
          id: string
          password: string
          storage_type: string
        }
        Insert: {
          auto_sync?: boolean
          google_connected?: boolean
          google_email?: string | null
          google_folder_id?: string | null
          google_folder_name?: string | null
          id: string
          password: string
          storage_type?: string
        }
        Update: {
          auto_sync?: boolean
          google_connected?: boolean
          google_email?: string | null
          google_folder_id?: string | null
          google_folder_name?: string | null
          id?: string
          password?: string
          storage_type?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          rating: number
          unique_code: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          rating: number
          unique_code?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          rating?: number
          unique_code?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          id: string
          name: string
          sentences: string[]
          upload_date: string
        }
        Insert: {
          id: string
          name: string
          sentences: string[]
          upload_date?: string
        }
        Update: {
          id?: string
          name?: string
          sentences?: string[]
          upload_date?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          unique_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          unique_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          unique_code?: string | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          file_path: string
          id: string
          language: string
          needs_rerecording: boolean | null
          recording_date: string
          sentence_index: number
          sentence_text: string
          snr: number | null
          unique_code: string | null
        }
        Insert: {
          file_path: string
          id?: string
          language: string
          needs_rerecording?: boolean | null
          recording_date?: string
          sentence_index: number
          sentence_text: string
          snr?: number | null
          unique_code?: string | null
        }
        Update: {
          file_path?: string
          id?: string
          language?: string
          needs_rerecording?: boolean | null
          recording_date?: string
          sentence_index?: number
          sentence_text?: string
          snr?: number | null
          unique_code?: string | null
        }
        Relationships: []
      }
      user_languages: {
        Row: {
          created_at: string
          id: string
          language: string
          unique_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          unique_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          unique_code?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          age: number
          contact_number: string
          created_at: string
          gender: string
          id: string
          name: string
          password: string | null
          unique_code: string
        }
        Insert: {
          age: number
          contact_number: string
          created_at?: string
          gender: string
          id?: string
          name: string
          password?: string | null
          unique_code?: string
        }
        Update: {
          age?: number
          contact_number?: string
          created_at?: string
          gender?: string
          id?: string
          name?: string
          password?: string | null
          unique_code?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
