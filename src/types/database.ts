export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  created_at: string
}

export type Family = {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
}

export type FamilyRole = 'owner' | 'member'

export type FamilyMember = {
  id: string
  family_id: string
  user_id: string
  role: FamilyRole
  created_at: string
}

export type Ledger = {
  id: string
  family_id: string
  name: string
  icon: string
  color: string
  is_default: boolean
  created_at: string
  deleted_at: string | null
}

export type CategoryType = 'expense' | 'income'

export type Category = {
  id: string
  family_id: string | null
  name: string
  type: CategoryType
  icon: string
  color: string
  sort_order: number
  created_at: string
}

export type TransactionType = 'expense' | 'income'

/** 金额单位：分 */
export type Transaction = {
  id: string
  family_id: string
  ledger_id: string
  user_id: string
  category_id: string
  type: TransactionType
  amount: number
  note: string
  pay_method: string | null
  occurred_at: string
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: { id: string; name?: string; avatar_url?: string | null }
        Update: { name?: string; avatar_url?: string | null }
        Relationships: []
      }
      families: {
        Row: Family
        Insert: { name: string; owner_id: string }
        Update: { name?: string }
        Relationships: []
      }
      family_members: {
        Row: FamilyMember
        Insert: { family_id: string; user_id: string; role?: FamilyRole }
        Update: { role?: FamilyRole }
        Relationships: []
      }
      ledgers: {
        Row: Ledger
        Insert: {
          family_id: string
          name: string
          icon?: string
          color?: string
          is_default?: boolean
        }
        Update: {
          name?: string
          icon?: string
          color?: string
          is_default?: boolean
          deleted_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: {
          family_id?: string | null
          name: string
          type: CategoryType
          icon?: string
          color?: string
          sort_order?: number
        }
        Update: {
          name?: string
          type?: CategoryType
          icon?: string
          color?: string
          sort_order?: number
        }
        Relationships: []
      }
      transactions: {
        Row: Transaction
        Insert: {
          family_id: string
          ledger_id: string
          category_id: string
          type: TransactionType
          amount: number
          note?: string
          pay_method?: string | null
          occurred_at?: string
        }
        Update: {
          ledger_id?: string
          category_id?: string
          type?: TransactionType
          amount?: number
          note?: string
          pay_method?: string | null
          occurred_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_family: {
        Args: { family_name: string }
        Returns: string
      }
      join_family_by_invite: {
        Args: { code: string }
        Returns: string
      }
      is_family_member: {
        Args: { fid: string }
        Returns: boolean
      }
      is_family_owner: {
        Args: { fid: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
