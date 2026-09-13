export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: number;
          record_id: string;
          table_name: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          record_id: string;
          table_name: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          record_id?: string;
          table_name?: string;
        };
        Relationships: [];
      };
      briefing_stories: {
        Row: {
          briefing_id: string;
          position: number;
          story_id: string;
        };
        Insert: {
          briefing_id: string;
          position: number;
          story_id: string;
        };
        Update: {
          briefing_id?: string;
          position?: number;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "briefing_stories_briefing_id_fkey";
            columns: ["briefing_id"];
            isOneToOne: false;
            referencedRelation: "daily_briefings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "briefing_stories_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          description: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          description?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          description?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          created_at: string;
          description: string | null;
          founded_year: number | null;
          headquarters: string | null;
          id: string;
          logo_url: string | null;
          metadata: Json;
          name: string;
          slug: string;
          status: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          founded_year?: number | null;
          headquarters?: string | null;
          id?: string;
          logo_url?: string | null;
          metadata?: Json;
          name: string;
          slug: string;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          founded_year?: number | null;
          headquarters?: string | null;
          id?: string;
          logo_url?: string | null;
          metadata?: Json;
          name?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      daily_briefings: {
        Row: {
          briefing_date: string;
          created_at: string;
          id: string;
          introduction: string;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          briefing_date: string;
          created_at?: string;
          id?: string;
          introduction: string;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          briefing_date?: string;
          created_at?: string;
          id?: string;
          introduction?: string;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_events: {
        Row: {
          company_id: string | null;
          created_at: string;
          description: string | null;
          event_type: string;
          id: string;
          model_id: string | null;
          occurred_at: string;
          source_url: string | null;
          status: string;
          story_id: string | null;
          title: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_type?: string;
          id?: string;
          model_id?: string | null;
          occurred_at: string;
          source_url?: string | null;
          status?: string;
          story_id?: string | null;
          title: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_type?: string;
          id?: string;
          model_id?: string | null;
          occurred_at?: string;
          source_url?: string | null;
          status?: string;
          story_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entity_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_events_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_events_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      ingestion_submissions: {
        Row: {
          agent_name: string;
          created_at: string;
          duplicate_candidates: Json;
          id: string;
          idempotency_key: string;
          key_id: string | null;
          payload: Json;
          reviewed_at: string | null;
          status: string;
          story_id: string | null;
        };
        Insert: {
          agent_name: string;
          created_at?: string;
          duplicate_candidates?: Json;
          id?: string;
          idempotency_key: string;
          key_id?: string | null;
          payload: Json;
          reviewed_at?: string | null;
          status?: string;
          story_id?: string | null;
        };
        Update: {
          agent_name?: string;
          created_at?: string;
          duplicate_candidates?: Json;
          id?: string;
          idempotency_key?: string;
          key_id?: string | null;
          payload?: Json;
          reviewed_at?: string | null;
          status?: string;
          story_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ingestion_submissions_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      models: {
        Row: {
          api_available: boolean | null;
          company_id: string | null;
          context_window: number | null;
          created_at: string;
          description: string | null;
          id: string;
          input_price_per_million: number | null;
          license: string | null;
          metadata: Json;
          model_type: string | null;
          name: string;
          open_weights: boolean | null;
          output_price_per_million: number | null;
          pricing_notes: string | null;
          release_date: string | null;
          slug: string;
          status: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          api_available?: boolean | null;
          company_id?: string | null;
          context_window?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          input_price_per_million?: number | null;
          license?: string | null;
          metadata?: Json;
          model_type?: string | null;
          name: string;
          open_weights?: boolean | null;
          output_price_per_million?: number | null;
          pricing_notes?: string | null;
          release_date?: string | null;
          slug: string;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          api_available?: boolean | null;
          company_id?: string | null;
          context_window?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          input_price_per_million?: number | null;
          license?: string | null;
          metadata?: Json;
          model_type?: string | null;
          name?: string;
          open_weights?: boolean | null;
          output_price_per_million?: number | null;
          pricing_notes?: string | null;
          release_date?: string | null;
          slug?: string;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "models_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          author: string | null;
          id: string;
          primary_source: boolean;
          published_at: string | null;
          source_name: string;
          source_type: string;
          source_url: string;
          story_id: string;
        };
        Insert: {
          author?: string | null;
          id?: string;
          primary_source?: boolean;
          published_at?: string | null;
          source_name: string;
          source_type: string;
          source_url: string;
          story_id: string;
        };
        Update: {
          author?: string | null;
          id?: string;
          primary_source?: boolean;
          published_at?: string | null;
          source_name?: string;
          source_type?: string;
          source_url?: string;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sources_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      stories: {
        Row: {
          body: string;
          breaking: boolean;
          category: string;
          created_at: string;
          featured: boolean;
          headline: string;
          hero_image_alt: string | null;
          hero_image_credit: string | null;
          hero_image_url: string | null;
          id: string;
          importance: number;
          published_at: string | null;
          search_document: unknown;
          slug: string;
          status: string;
          subheadline: string | null;
          summary: string;
          updated_at: string;
          verification_status: string;
          what_changed: string[];
        };
        Insert: {
          body: string;
          breaking?: boolean;
          category: string;
          created_at?: string;
          featured?: boolean;
          headline: string;
          hero_image_alt?: string | null;
          hero_image_credit?: string | null;
          hero_image_url?: string | null;
          id?: string;
          importance?: number;
          published_at?: string | null;
          search_document?: unknown;
          slug: string;
          status?: string;
          subheadline?: string | null;
          summary: string;
          updated_at?: string;
          verification_status?: string;
          what_changed?: string[];
        };
        Update: {
          body?: string;
          breaking?: boolean;
          category?: string;
          created_at?: string;
          featured?: boolean;
          headline?: string;
          hero_image_alt?: string | null;
          hero_image_credit?: string | null;
          hero_image_url?: string | null;
          id?: string;
          importance?: number;
          published_at?: string | null;
          search_document?: unknown;
          slug?: string;
          status?: string;
          subheadline?: string | null;
          summary?: string;
          updated_at?: string;
          verification_status?: string;
          what_changed?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "stories_category_fkey";
            columns: ["category"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["slug"];
          },
        ];
      };
      story_companies: {
        Row: {
          company_id: string;
          story_id: string;
        };
        Insert: {
          company_id: string;
          story_id: string;
        };
        Update: {
          company_id?: string;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_companies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_companies_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      story_editorial: {
        Row: {
          event_key: string | null;
          internal_notes: string;
          story_id: string;
        };
        Insert: {
          event_key?: string | null;
          internal_notes?: string;
          story_id: string;
        };
        Update: {
          event_key?: string | null;
          internal_notes?: string;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_editorial_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: true;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      story_models: {
        Row: {
          model_id: string;
          story_id: string;
        };
        Insert: {
          model_id: string;
          story_id: string;
        };
        Update: {
          model_id?: string;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_models_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_models_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      directory_trends: { Args: never; Returns: Json };
      find_duplicates: {
        Args: { event_key: string; headline: string; source_urls: string[] };
        Returns: Json;
      };
      ingest_story: {
        Args: { api_token: string; payload: Json };
        Returns: Json;
      };
      is_admin: { Args: never; Returns: boolean };
      review_submission: {
        Args: { decision: string; submission_id: string };
        Returns: string;
      };
      save_briefing: {
        Args: { payload: Json; target_id?: string };
        Returns: string;
      };
      save_reviewed_story: {
        Args: { payload: Json; submission_id: string; target_id?: string };
        Returns: string;
      };
      save_story: {
        Args: { payload: Json; target_id?: string };
        Returns: string;
      };
      search_stories: {
        Args: {
          category_slug?: string;
          company_slug?: string;
          date_from?: string;
          date_to?: string;
          model_slug?: string;
          search_query?: string;
        };
        Returns: {
          body: string;
          breaking: boolean;
          category: string;
          created_at: string;
          featured: boolean;
          headline: string;
          hero_image_alt: string | null;
          hero_image_credit: string | null;
          hero_image_url: string | null;
          id: string;
          importance: number;
          published_at: string | null;
          search_document: unknown;
          slug: string;
          status: string;
          subheadline: string | null;
          summary: string;
          updated_at: string;
          verification_status: string;
          what_changed: string[];
        }[];
        SetofOptions: {
          from: "*";
          to: "stories";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
