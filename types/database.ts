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
  ai_credits_balance: number;
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
