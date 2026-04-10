export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      installations: {
        Row: {
          completed_at: string | null
          id: string
          log: Json | null
          message: string | null
          spec_id: string | null
          started_at: string | null
          status: string | null
          step: number | null
          student_id: string | null
          student_name: string | null
          total_steps: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          log?: Json | null
          message?: string | null
          spec_id?: string | null
          started_at?: string | null
          status?: string | null
          step?: number | null
          student_id?: string | null
          student_name?: string | null
          total_steps?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          log?: Json | null
          message?: string | null
          spec_id?: string | null
          started_at?: string | null
          status?: string | null
          step?: number | null
          student_id?: string | null
          student_name?: string | null
          total_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "installations_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "specs"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string | null
          id: string
          polar_payment_id: string | null
          spec_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          polar_payment_id?: string | null
          spec_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          polar_payment_id?: string | null
          spec_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "specs"
            referencedColumns: ["id"]
          },
        ]
      }
      specs: {
        Row: {
          created_at: string | null
          framework: string
          id: string
          instructor_id: string | null
          raw_markdown: string | null
          share_code: string | null
          spec_content: Json
          title: string
        }
        Insert: {
          created_at?: string | null
          framework: string
          id?: string
          instructor_id?: string | null
          raw_markdown?: string | null
          share_code?: string | null
          spec_content: Json
          title: string
        }
        Update: {
          created_at?: string | null
          framework?: string
          id?: string
          instructor_id?: string | null
          raw_markdown?: string | null
          share_code?: string | null
          spec_content?: Json
          title?: string
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

// --- 커스텀 타입 ---

// AI가 수업 계획서에서 추출한 설치 항목
export type SetupTool = {
  name: string;
  version?: string;
  category: "ide" | "language" | "framework" | "package" | "system" | "database" | "tool";
  install_command?: string;
};

// AI가 파싱한 설치 계획
export type SpecContent = {
  summary: string;                    // AI 한줄 요약
  tools: SetupTool[];                 // 설치해야 할 도구 목록
  verification_commands: string[];    // 빌드/테스트 검증 명령들
  raw_input: string;                  // 강사 원문
  project_path?: string;
};

export type Spec = Tables<"specs"> & { spec_content: SpecContent };
export type Installation = Tables<"installations">;
