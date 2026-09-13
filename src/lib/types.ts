export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type StoryStatus = "draft" | "review" | "published" | "archived";
export type VerificationStatus =
  "unverified" | "source_confirmed" | "corroborated" | "disputed";
export interface Story {
  id: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  summary: string;
  body: string;
  category: string;
  status: StoryStatus;
  importance: number;
  breaking: boolean;
  featured: boolean;
  what_changed: string[];
  verification_status: VerificationStatus;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  hero_image_credit: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface Source {
  id: string;
  story_id: string;
  source_name: string;
  source_url: string;
  author: string | null;
  source_type:
    | "announcement"
    | "paper"
    | "documentation"
    | "repository"
    | "filing"
    | "reporting"
    | "other";
  primary_source: boolean;
  published_at: string | null;
}
export interface Category {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  headquarters: string | null;
  founded_year: number | null;
  metadata: Json;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}
export interface Model {
  id: string;
  company_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  release_date: string | null;
  model_type: string | null;
  context_window: number | null;
  input_price_per_million: number | null;
  output_price_per_million: number | null;
  pricing_notes: string | null;
  api_available: boolean | null;
  open_weights: boolean | null;
  license: string | null;
  website: string | null;
  metadata: Json;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}
export interface Briefing {
  id: string;
  slug: string;
  title: string;
  introduction: string;
  briefing_date: string;
  status: StoryStatus;
  created_at: string;
  updated_at: string;
}
export interface EntityEvent {
  id: string;
  company_id: string | null;
  model_id: string | null;
  story_id: string | null;
  title: string;
  description: string | null;
  event_type: string;
  occurred_at: string;
  source_url: string | null;
  status: StoryStatus;
  created_at: string;
}
export interface Submission {
  id: string;
  idempotency_key: string;
  payload: Json;
  status: "pending" | "accepted" | "rejected" | "archived";
  story_id: string | null;
  duplicate_candidates: Json;
  agent_name: string;
  created_at: string;
  reviewed_at: string | null;
}
export interface AuditLog {
  id: number;
  action: string;
  table_name: string;
  record_id: string;
  actor_id: string | null;
  created_at: string;
}
export interface StoryDetail extends Story {
  sources: Source[];
  companies: Company[];
  models: Model[];
}

// Generated schema is the source of truth for SQL shapes and foreign keys.
// Check-constrained text columns are narrowed here because PostgreSQL's type
// generator reports them as strings rather than unions.
type Generated = import("./database.types").Database;
type PublicTables = Generated["public"]["Tables"];
type NarrowRows = {
  stories: Story & { search_document: string | null };
  sources: Source;
  companies: Company;
  models: Model;
  daily_briefings: Briefing;
  entity_events: EntityEvent;
  ingestion_submissions: Submission & { key_id: string | null };
};
export type Database = Omit<Generated, "public"> & {
  public: Omit<Generated["public"], "Tables"> & {
    Tables: {
      [K in keyof PublicTables]: Omit<PublicTables[K], "Row"> & {
        Row: K extends keyof NarrowRows
          ? { [P in keyof NarrowRows[K]]: NarrowRows[K][P] }
          : PublicTables[K]["Row"];
      };
    };
  };
};
