// Types ที่ตรงกับ schema ใน Supabase (ดู supabase/schema-full.sql)
// อัปเดตไฟล์นี้เองถ้าแก้โครงสร้างตาราง หรือใช้
// `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`
// เพื่อ generate อัตโนมัติจาก Supabase โปรเจกต์จริง
//
// โครงสร้าง Database ด้านล่างจงใจทำให้ครบตาม shape ที่ @supabase/supabase-js
// เวอร์ชันใหม่คาดหวัง (Row/Insert/Update/Relationships ต่อตาราง + Functions/Enums/
// CompositeTypes) ไม่งั้น client จะ fallback type ทุกอย่างเป็น `never`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------- Row types (ผลลัพธ์ SELECT) ----------

export type Asset = {
  asset_id: string;
  asset_no: string;
  supreme_court_no: string | null;
  activity_name: string;
  description: string | null;
  asset_type_id: string | null;
  total_amount: number;
  company_id: string | null;
  payee_id: string | null;
  return_status_id: string | null;
  disbursement_date: string | null;
  transferred_date: string | null;
  create_date: string;
  edit_date: string | null;
};

export type AssetType = {
  asset_type_id: string;
  asset_type_name: string;
  description: string | null;
  create_date: string;
  edit_date: string | null;
  is_active: boolean;
  is_delete: boolean;
};

export type Company = {
  company_id: string;
  company_name: string;
  description: string | null;
  create_date: string;
  edit_date: string | null;
  is_active: boolean;
  is_delete: boolean;
};

export type Payee = {
  payee_id: string;
  payee_name: string;
  description: string | null;
  create_date: string;
  edit_date: string | null;
  is_active: boolean;
  is_delete: boolean;
};

export type ReturnStatus = {
  return_status_id: string;
  return_status_name: string;
  description: string | null;
  create_date: string;
  edit_date: string | null;
  is_active: boolean;
  is_delete: boolean;
};

// ใช้กับ view เดียวที่ join ชื่อ master ทั้งหมดมาให้แล้ว (asset_view ใน schema)
export type AssetView = Asset & {
  asset_type_name: string | null;
  company_name: string | null;
  payee_name: string | null;
  return_status_name: string | null;
};

// ---------- Insert types (คอลัมน์ที่มี default/generated เป็น optional) ----------

export type AssetInsert = {
  asset_id?: string;
  asset_no: string;
  supreme_court_no?: string | null;
  activity_name: string;
  description?: string | null;
  asset_type_id?: string | null;
  total_amount?: number;
  company_id?: string | null;
  payee_id?: string | null;
  return_status_id?: string | null;
  disbursement_date?: string | null;
  transferred_date?: string | null;
  create_date?: string;
  edit_date?: string | null;
};

// master ทั้ง 4 ตารางโครงสร้าง insert เหมือนกัน ต่างแค่ชื่อคอลัมน์ name
type MasterInsertBase = {
  description?: string | null;
  create_date?: string;
  edit_date?: string | null;
  is_active?: boolean;
  is_delete?: boolean;
};
export type AssetTypeInsert = MasterInsertBase & {
  asset_type_id?: string;
  asset_type_name: string;
};
export type CompanyInsert = MasterInsertBase & {
  company_id?: string;
  company_name: string;
};
export type PayeeInsert = MasterInsertBase & {
  payee_id?: string;
  payee_name: string;
};
export type ReturnStatusInsert = MasterInsertBase & {
  return_status_id?: string;
  return_status_name: string;
};

// ---------- Database (shape สำหรับ createBrowserClient<Database>) ----------

export type Database = {
  public: {
    Tables: {
      asset: {
        Row: Asset;
        Insert: AssetInsert;
        Update: Partial<AssetInsert>;
        Relationships: [];
      };
      asset_type: {
        Row: AssetType;
        Insert: AssetTypeInsert;
        Update: Partial<AssetTypeInsert>;
        Relationships: [];
      };
      company: {
        Row: Company;
        Insert: CompanyInsert;
        Update: Partial<CompanyInsert>;
        Relationships: [];
      };
      payee: {
        Row: Payee;
        Insert: PayeeInsert;
        Update: Partial<PayeeInsert>;
        Relationships: [];
      };
      return_status: {
        Row: ReturnStatus;
        Insert: ReturnStatusInsert;
        Update: Partial<ReturnStatusInsert>;
        Relationships: [];
      };
    };
    Views: {
      asset_view: {
        Row: AssetView;
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
