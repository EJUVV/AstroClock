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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          acao: string
          antes: Json | null
          depois: Json | null
          id: string
          motivo: string
          quando: string
          quem: string | null
          registro_id: string
          tabela: string
        }
        Insert: {
          acao: string
          antes?: Json | null
          depois?: Json | null
          id?: string
          motivo: string
          quando?: string
          quem?: string | null
          registro_id: string
          tabela: string
        }
        Update: {
          acao?: string
          antes?: Json | null
          depois?: Json | null
          id?: string
          motivo?: string
          quando?: string
          quem?: string | null
          registro_id?: string
          tabela?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_quem_fkey"
            columns: ["quem"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      diretorias: {
        Row: {
          desde: string
          membro_id: string
          registrado_por: string | null
          setor_id: string
        }
        Insert: {
          desde?: string
          membro_id: string
          registrado_por?: string | null
          setor_id: string
        }
        Update: {
          desde?: string
          membro_id?: string
          registrado_por?: string | null
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diretorias_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diretorias_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diretorias_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: true
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_diretorias: {
        Row: {
          encerrado_por: string | null
          fim: string | null
          id: string
          inicio: string
          membro_id: string
          registrado_por: string | null
          setor_id: string
        }
        Insert: {
          encerrado_por?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          membro_id: string
          registrado_por?: string | null
          setor_id: string
        }
        Update: {
          encerrado_por?: string | null
          fim?: string | null
          id?: string
          inicio?: string
          membro_id?: string
          registrado_por?: string | null
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_diretorias_encerrado_por_fkey"
            columns: ["encerrado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_diretorias_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_diretorias_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_diretorias_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
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
          eh_rh: boolean
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          eh_rh?: boolean
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          eh_rh?: boolean
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
      abaixo_da_meta: {
        Args: { p_semana: string; p_setor?: string }
        Returns: {
          ativo: boolean
          cumpriu: boolean
          data_entrada: string
          dispensada: boolean
          email: string
          horas_sede: number
          horas_total: number
          membro_id: string
          meta_sede: number
          meta_total: number
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          setor: string
        }[]
      }
      atribuir_diretoria: {
        Args: { p_membro_id: string; p_setor: string }
        Returns: undefined
      }
      cancelar_registro_de_membro: {
        Args: { p_id: string; p_motivo: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "registros"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      criar_registro_de_membro: {
        Args: {
          p_descricao: string
          p_fim: string
          p_inicio: string
          p_local: Database["public"]["Enums"]["local_registro"]
          p_membro_id: string
          p_motivo: string
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "registros"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dirige_rh: { Args: { p_membro_id: string }; Returns: boolean }
      editar_registro_de_membro: {
        Args: {
          p_descricao?: string
          p_fim?: string
          p_id: string
          p_inicio?: string
          p_local?: Database["public"]["Enums"]["local_registro"]
          p_motivo: string
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "registros"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      encerrar_cronometros_esquecidos: { Args: never; Returns: number }
      exigir_rh_com_motivo: { Args: { p_motivo: string }; Returns: undefined }
      horas_da_semana: {
        Args: { p_membro_id?: string; p_semana: string }
        Returns: {
          horas_sede: number
          horas_total: number
          membro_id: string
        }[]
      }
      horas_do_mes: {
        Args: { p_mes: string }
        Returns: {
          dispensado: boolean
          horas_sede: number
          horas_total: number
          membro_id: string
          setor_id: string
        }[]
      }
      medias_da_semana: {
        Args: { p_semana: string; p_setor?: string }
        Returns: {
          media_diaria: number
          media_sede: number
          media_total: number
        }[]
      }
      meta_da_semana: {
        Args: { p_semana: string }
        Returns: {
          horas_sede: number
          horas_total: number
        }[]
      }
      meu_id: { Args: never; Returns: string }
      meu_perfil: {
        Args: never
        Returns: Database["public"]["Enums"]["perfil"]
      }
      meu_setor_id: { Args: never; Returns: string }
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
      minha_posicao_no_ranking: {
        Args: { p_mes: string }
        Returns: {
          faltam_para_podio_ej: number
          faltam_para_podio_setor: number
          horas_total: number
          posicao_ej: number
          posicao_setor: number
          total_ej: number
          total_setor: number
        }[]
      }
      minhas_diretorias: {
        Args: never
        Returns: {
          desde: string
          diretor_id: string
          diretor_nome: string
          eh_rh: boolean
          setor: string
        }[]
      }
      percentual_da_semana: {
        Args: { p_semana: string; p_setor?: string }
        Returns: number
      }
      perfil_tem_meta: {
        Args: { p: Database["public"]["Enums"]["perfil"] }
        Returns: boolean
      }
      podio_do_mes: {
        Args: { p_mes: string }
        Returns: {
          escopo: string
          horas_sede: number
          horas_total: number
          membro_id: string
          nome: string
          posicao: number
          setor: string
        }[]
      }
      progresso_da_semana: {
        Args: { p_semana: string }
        Returns: {
          cumpriu: boolean
          dispensada: boolean
          elegivel: boolean
          horas_sede: number
          horas_total: number
          meta_sede: number
          meta_total: number
          semana: string
        }[]
      }
      progresso_de_membro: {
        Args: { p_membro_id: string; p_semana: string }
        Returns: {
          cumpriu: boolean
          dispensada: boolean
          elegivel: boolean
          horas_sede: number
          horas_total: number
          meta_sede: number
          meta_total: number
          semana: string
        }[]
      }
      progresso_do_mes: {
        Args: { p_mes: string }
        Returns: {
          cumpriu: boolean
          dispensada: boolean
          elegivel: boolean
          horas_sede: number
          horas_total: number
          meta_sede: number
          meta_total: number
          semana: string
        }[]
      }
      ranking_do_mes: {
        Args: { p_mes: string }
        Returns: {
          ativo: boolean
          data_entrada: string
          dispensado: boolean
          email: string
          horas_sede: number
          horas_total: number
          membro_id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          posicao: number
          setor: string
        }[]
      }
      ranking_dos_setores: {
        Args: { p_mes: string }
        Returns: {
          media_sede: number
          media_total: number
          membros_contados: number
          posicao: number
          setor: string
        }[]
      }
      ranking_interno: {
        Args: { p_mes: string }
        Returns: {
          dispensado: boolean
          horas_sede: number
          horas_total: number
          membro_id: string
          nome: string
          posicao_ej: number
          posicao_setor: number
          setor: string
          setor_id: string
        }[]
      }
      remover_diretoria: { Args: { p_setor: string }; Returns: undefined }
      resumo_da_semana: {
        Args: { p_semana: string; p_setor?: string }
        Returns: {
          ativo: boolean
          cumpriu: boolean
          data_entrada: string
          dispensada: boolean
          email: string
          horas_sede: number
          horas_total: number
          membro_id: string
          meta_sede: number
          meta_total: number
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          setor: string
        }[]
      }
      revisar_cronometro: {
        Args: { p_aprovar: boolean; p_id: string; p_motivo?: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "registros"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      segunda_da_semana: { Args: { p_dia: string }; Returns: string }
      semanas_seguidas_abaixo: {
        Args: { p_semana: string }
        Returns: {
          ativo: boolean
          data_entrada: string
          email: string
          membro_id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil"]
          semanas_seguidas: number
          setor: string
        }[]
      }
      setores_que_dirijo: { Args: never; Returns: string[] }
      situacao_dos_setores: {
        Args: never
        Returns: {
          desde: string
          diretor_id: string
          diretor_nome: string
          eh_rh: boolean
          setor: string
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      local_registro: ["sede", "online"],
      origem_registro: ["manual", "cronometro"],
      perfil: ["membro", "rh", "diretor_rh", "diretor_setor", "presidente"],
    },
  },
} as const
