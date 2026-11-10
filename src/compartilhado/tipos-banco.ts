// Gerado a partir do banco horas-dev (supabase gen types). Não edite à mão:
// depois de mudar tabelas, gere de novo com `npx supabase gen types typescript --linked`.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      dispensas: {
        Row: {
          criado_em: string
          id: string
          membro_id: string
          motivo: string
          registrado_por: string | null
          semana: string
        }
        Insert: {
          criado_em?: string
          id?: string
          membro_id: string
          motivo: string
          registrado_por?: string | null
          semana: string
        }
        Update: {
          criado_em?: string
          id?: string
          membro_id?: string
          motivo?: string
          registrado_por?: string | null
          semana?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispensas_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispensas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_setor: {
        Row: {
          alterado_em: string
          alterado_por: string | null
          id: string
          membro_id: string
          setor_anterior_id: string
          setor_novo_id: string
        }
        Insert: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          membro_id: string
          setor_anterior_id: string
          setor_novo_id: string
        }
        Update: {
          alterado_em?: string
          alterado_por?: string | null
          id?: string
          membro_id?: string
          setor_anterior_id?: string
          setor_novo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_setor_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_setor_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_setor_setor_anterior_id_fkey"
            columns: ["setor_anterior_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_setor_setor_novo_id_fkey"
            columns: ["setor_novo_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          ativo: boolean
          criado_em: string
          data_entrada: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          setor_id: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          data_entrada?: string
          email: string
          id?: string
          nome: string
          perfil?: Database["public"]["Enums"]["perfil"]
          setor_id: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          data_entrada?: string
          email?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil"]
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          alterado_por: string | null
          criado_em: string
          horas_sede: number
          horas_total: number
          id: string
          vigente_desde: string
        }
        Insert: {
          alterado_por?: string | null
          criado_em?: string
          horas_sede: number
          horas_total: number
          id?: string
          vigente_desde: string
        }
        Update: {
          alterado_por?: string | null
          criado_em?: string
          horas_sede?: number
          horas_total?: number
          id?: string
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      registros: {
        Row: {
          atualizado_em: string
          cancelado: boolean
          criado_em: string
          descricao: string
          fim: string | null
          id: string
          inicio: string
          local: Database["public"]["Enums"]["local_registro"]
          membro_id: string
          origem: Database["public"]["Enums"]["origem_registro"]
          precisa_revisao: boolean
        }
        Insert: {
          atualizado_em?: string
          cancelado?: boolean
          criado_em?: string
          descricao?: string
          fim?: string | null
          id?: string
          inicio?: string
          local: Database["public"]["Enums"]["local_registro"]
          membro_id?: string
          origem?: Database["public"]["Enums"]["origem_registro"]
          precisa_revisao?: boolean
        }
        Update: {
          atualizado_em?: string
          cancelado?: boolean
          criado_em?: string
          descricao?: string
          fim?: string | null
          id?: string
          inicio?: string
          local?: Database["public"]["Enums"]["local_registro"]
          membro_id?: string
          origem?: Database["public"]["Enums"]["origem_registro"]
          precisa_revisao?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "registros_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      lista_de_metas: {
        Row: {
          alterado_por: string | null
          criado_em: string | null
          horas_sede: number | null
          horas_total: number | null
          id: string | null
          vigente_desde: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metas_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      eh_diretor_rh: { Args: never; Returns: boolean }
      eh_rh: { Args: never; Returns: boolean }
      elegivel_na_semana: {
        Args: {
          p_ativo: boolean
          p_data_entrada: string
          p_perfil: Database["public"]["Enums"]["perfil"]
          p_semana: string
        }
        Returns: boolean
      }
      meu_id: { Args: never; Returns: string }
      meu_perfil: {
        Args: never
        Returns: Database["public"]["Enums"]["perfil"]
      }
      meus_dados: {
        Args: never
        Returns: {
          ativo: boolean
          data_entrada: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          setor: string
        }[]
      }
      perfil_tem_meta: {
        Args: { p: Database["public"]["Enums"]["perfil"] }
        Returns: boolean
      }
      setor_que_dirijo: { Args: never; Returns: string }
      ve_tudo: { Args: never; Returns: boolean }
    }
    Enums: {
      local_registro: "sede" | "online"
      origem_registro: "manual" | "cronometro"
      perfil: "membro" | "rh" | "diretor_rh" | "diretor_setor" | "presidente"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      local_registro: ["sede", "online"],
      origem_registro: ["manual", "cronometro"],
      perfil: ["membro", "rh", "diretor_rh", "diretor_setor", "presidente"],
    },
  },
} as const
