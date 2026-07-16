// Types ที่ตรงกับ schema ใน Supabase (ดู supabase/schema.sql)
// อัปเดตไฟล์นี้เองถ้าแก้โครงสร้างตาราง หรือใช้
// `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`
// เพื่อ generate อัตโนมัติจาก Supabase โปรเจกต์จริง

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

// ใช้กับ view เดียวที่ join ชื่อ master ทั้งหมดมาให้แล้ว (asset_view ใน schema.sql)
export type AssetView = Asset & {
  asset_type_name: string | null;
  company_name: string | null;
  payee_name: string | null;
  return_status_name: string | null;
};

export type Database = {
  public: {
    Tables: {
      asset: { Row: Asset; Insert: Partial<Asset>; Update: Partial<Asset> };
      asset_type: { Row: AssetType; Insert: Partial<AssetType>; Update: Partial<AssetType> };
      company: { Row: Company; Insert: Partial<Company>; Update: Partial<Company> };
      payee: { Row: Payee; Insert: Partial<Payee>; Update: Partial<Payee> };
      return_status: { Row: ReturnStatus; Insert: Partial<ReturnStatus>; Update: Partial<ReturnStatus> };
    };
    Views: {
      asset_view: { Row: AssetView };
    };
  };
};
