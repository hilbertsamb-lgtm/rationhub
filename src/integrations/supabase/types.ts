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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      address_change_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          new_address: string
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          new_address: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          new_address?: string
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          created_at: string
          id: string
          message: string
          response: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          response?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          response?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_path: string
          monthly_quota: number
          name: string
          price: number
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_path: string
          monthly_quota?: number
          name: string
          price?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          unit?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string
          monthly_quota?: number
          name?: string
          price?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          mobile: string | null
          ration_card_number: string | null
          shop_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          mobile?: string | null
          ration_card_number?: string | null
          shop_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          ration_card_number?: string | null
          shop_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_shop_fk"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          issued_by: string | null
          items: Json
          month: string
          receipt_no: string
          shop_id: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_by?: string | null
          items?: Json
          month: string
          receipt_no: string
          shop_id: string
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_by?: string | null
          items?: Json
          month?: string
          receipt_no?: string
          shop_id?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      ration_card_requests: {
        Row: {
          address: string | null
          admin_note: string | null
          created_at: string
          full_name: string
          id: string
          mobile: string | null
          proposed_card_number: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          created_at?: string
          full_name: string
          id?: string
          mobile?: string | null
          proposed_card_number?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          created_at?: string
          full_name?: string
          id?: string
          mobile?: string | null
          proposed_card_number?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          keeper_id: string | null
          name: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          keeper_id?: string | null
          name: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          keeper_id?: string | null
          name?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          id: string
          product_id: string
          quantity: number
          shop_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          shop_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          booked_at: string
          collected_at: string | null
          id: string
          month: string
          shop_id: string
          status: Database["public"]["Enums"]["token_status"]
          token_number: string
          user_id: string
        }
        Insert: {
          booked_at?: string
          collected_at?: string | null
          id?: string
          month: string
          shop_id: string
          status?: Database["public"]["Enums"]["token_status"]
          token_number: string
          user_id: string
        }
        Update: {
          booked_at?: string
          collected_at?: string | null
          id?: string
          month?: string
          shop_id?: string
          status?: Database["public"]["Enums"]["token_status"]
          token_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      email_for_ration_card: { Args: { _card: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "shopkeeper"
      complaint_status: "open" | "in_progress" | "resolved" | "closed"
      product_status: "available" | "out_of_stock"
      request_status: "pending" | "approved" | "rejected"
      token_status: "booked" | "collected" | "cancelled" | "expired"
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
      app_role: ["admin", "user", "shopkeeper"],
      complaint_status: ["open", "in_progress", "resolved", "closed"],
      product_status: ["available", "out_of_stock"],
      request_status: ["pending", "approved", "rejected"],
      token_status: ["booked", "collected", "cancelled", "expired"],
    },
  },
} as const
