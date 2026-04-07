export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile & { [key: string]: unknown };
        Insert: ProfileInsert & { [key: string]: unknown };
        Update: ProfileUpdate & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      projects: {
        Row: Project & { [key: string]: unknown };
        Insert: ProjectInsert & { [key: string]: unknown };
        Update: ProjectUpdate & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      saved_outputs: {
        Row: SavedOutput & { [key: string]: unknown };
        Insert: SavedOutputInsert & { [key: string]: unknown };
        Update: SavedOutputUpdate & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      chat_messages: {
        Row: ChatMessage & { [key: string]: unknown };
        Insert: ChatMessageInsert & { [key: string]: unknown };
        Update: ChatMessageUpdate & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

/** Matches the GenericRelationship type required by @supabase/supabase-js */
export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ai_messages_used: number;
  ai_messages_limit: number;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> &
  Partial<Pick<Profile, "created_at" | "updated_at">>;

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
> &
  Partial<Pick<Profile, "updated_at">>;

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tech_stack: string[] | null;
  status: "active" | "archived" | "completed";
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = {
  user_id: string;
  name: string;
  description?: string | null | undefined;
  tech_stack?: string[] | null | undefined;
  status?: "active" | "archived" | "completed" | undefined;
  id?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
};

export type ProjectUpdate = {
  name?: string | undefined;
  description?: string | null | undefined;
  tech_stack?: string[] | null | undefined;
  status?: "active" | "archived" | "completed" | undefined;
  updated_at?: string | undefined;
};

// ─── Saved Outputs ────────────────────────────────────────────────────────────

export interface SavedOutput {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  category: "overview" | "database" | "api" | "docs" | "general";
  assistant_type: string | null;
  created_at: string;
  updated_at: string;
}

export type SavedOutputInsert = Omit<
  SavedOutput,
  "id" | "created_at" | "updated_at"
> &
  Partial<Pick<SavedOutput, "id" | "created_at" | "updated_at">>;

export type SavedOutputUpdate = Partial<
  Omit<
    SavedOutput,
    "id" | "project_id" | "user_id" | "created_at" | "updated_at"
  >
> &
  Partial<Pick<SavedOutput, "updated_at">>;

// ─── Chat Messages ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  assistant_type: string | null;
  created_at: string;
}

export type ChatMessageInsert = Omit<ChatMessage, "id" | "created_at"> &
  Partial<Pick<ChatMessage, "id" | "created_at">>;

export type ChatMessageUpdate = Partial<
  Omit<ChatMessage, "id" | "project_id" | "user_id" | "created_at">
>;
