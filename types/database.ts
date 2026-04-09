export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── User Role ────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'subscriber' | 'admin' | 'super_admin';

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
      credit_packs: {
        Row: CreditPack & { [key: string]: unknown };
        Insert: Omit<CreditPack, "id" | "created_at"> & Partial<Pick<CreditPack, "id" | "created_at">> & { [key: string]: unknown };
        Update: Partial<Omit<CreditPack, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      credit_purchases: {
        Row: CreditPurchase & { [key: string]: unknown };
        Insert: Omit<CreditPurchase, "id" | "created_at" | "admin_notes" | "reviewed_at" | "status"> & 
          Partial<Pick<CreditPurchase, "id" | "created_at" | "admin_notes" | "reviewed_at" | "status">> & 
          { [key: string]: unknown };
        Update: Partial<Omit<CreditPurchase, "id" | "user_id" | "created_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      credit_ledger: {
        Row: CreditLedgerEntry & { [key: string]: unknown };
        Insert: Omit<CreditLedgerEntry, "id" | "created_at"> & Partial<Pick<CreditLedgerEntry, "id" | "created_at">> & { [key: string]: unknown };
        Update: Partial<Omit<CreditLedgerEntry, "id" | "user_id" | "created_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      assistants: {
        Row: Assistant & { [key: string]: unknown };
        Insert: Omit<Assistant, "id" | "created_at" | "updated_at"> & Partial<Pick<Assistant, "id" | "created_at" | "updated_at">> & { [key: string]: unknown };
        Update: Partial<Omit<Assistant, "id" | "created_at" | "updated_at">> & Partial<Pick<Assistant, "updated_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      admin_event_logs: {
        Row: AdminEventLog & { [key: string]: unknown };
        Insert: Omit<AdminEventLog, "id" | "created_at"> & Partial<Pick<AdminEventLog, "id" | "created_at">> & { [key: string]: unknown };
        Update: Partial<Omit<AdminEventLog, "id" | "created_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      admin_templates: {
        Row: AdminTemplate & { [key: string]: unknown };
        Insert: Omit<AdminTemplate, "id" | "created_at" | "updated_at" | "version"> & Partial<Pick<AdminTemplate, "id" | "created_at" | "updated_at" | "version">> & { [key: string]: unknown };
        Update: Partial<Omit<AdminTemplate, "id" | "created_at" | "updated_at">> & Partial<Pick<AdminTemplate, "updated_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      admin_knowledge_sources: {
        Row: AdminKnowledgeSource & { [key: string]: unknown };
        Insert: Omit<AdminKnowledgeSource, "id" | "created_at" | "updated_at" | "chunk_count" | "last_synced_at"> & Partial<Pick<AdminKnowledgeSource, "id" | "created_at" | "updated_at" | "chunk_count" | "last_synced_at">> & { [key: string]: unknown };
        Update: Partial<Omit<AdminKnowledgeSource, "id" | "created_at" | "updated_at">> & Partial<Pick<AdminKnowledgeSource, "updated_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
      admin_settings: {
        Row: AdminSetting & { [key: string]: unknown };
        Insert: Omit<AdminSetting, "id" | "created_at" | "updated_at"> & Partial<Pick<AdminSetting, "id" | "created_at" | "updated_at">> & { [key: string]: unknown };
        Update: Partial<Omit<AdminSetting, "id" | "created_at" | "updated_at">> & Partial<Pick<AdminSetting, "updated_at">> & { [key: string]: unknown };
        Relationships: GenericRelationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      deduct_credit: {
        Args: { p_user_id: string };
        Returns: number;
      };
      add_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      is_super_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
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
  ai_credits_balance: number;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> &
  Partial<Pick<Profile, "created_at" | "updated_at" | "role">>;

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
> &
  Partial<Pick<Profile, "updated_at" | "role">>;

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

// ─── Credit Packs ─────────────────────────────────────────────────────────────

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_pkr: number;
  is_active: boolean;
  created_at: string;
}

// ─── Credit Purchases ─────────────────────────────────────────────────────────

export interface CreditPurchase {
  id: string;
  user_id: string;
  pack_id: string;
  credits: number;
  amount_pkr: number;
  method: "jazzcash" | "easypaisa" | "bank_transfer" | "whatsapp";
  transaction_ref: string;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// ─── Credit Ledger ────────────────────────────────────────────────────────────

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  change: number;
  reason: string;
  balance_after: number;
  created_at: string;
}

// ─── Assistants ───────────────────────────────────────────────────────────────

export type AssistantProvider = "openai" | "anthropic" | "google" | "custom";

export interface Assistant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  persona: string;
  provider: AssistantProvider;
  model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Admin Control Plane ─────────────────────────────────────────────────────

export type AdminLogSeverity = "info" | "warning" | "error";

export interface AdminEventLog {
  id: string;
  actor_id: string | null;
  category: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  severity: AdminLogSeverity;
  message: string;
  metadata: Json;
  created_at: string;
}

export type AdminTemplateStatus = "draft" | "active" | "archived";

export interface AdminTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  status: AdminTemplateStatus;
  version: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type KnowledgeStatus = "queued" | "indexing" | "healthy" | "failed";

export interface AdminKnowledgeSource {
  id: string;
  name: string;
  source_ref: string;
  sync_instructions: string | null;
  status: KnowledgeStatus;
  chunk_count: number;
  last_synced_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: Json;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
