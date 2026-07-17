-- ==========================================================
-- Schema สำหรับระบบจดเลขพัสดุ
-- อ้างอิงจากสเปรดชีตออกแบบตารางที่ให้มา
-- นำไปรันใน Supabase: Project > SQL Editor > New query
-- ==========================================================

create extension if not exists "pgcrypto";

-- ---------- Master: ประเภทพัสดุ ----------
create table if not exists asset_type (
  asset_type_id uuid primary key default gen_random_uuid(),
  asset_type_name varchar not null,
  description varchar,
  create_date timestamptz not null default now(),
  edit_date timestamptz,
  is_active boolean not null default true,
  is_delete boolean not null default false
);

-- ---------- Master: บริษัททำเบิกจ่าย ----------
create table if not exists company (
  company_id uuid primary key default gen_random_uuid(),
  company_name varchar not null,
  description varchar,
  create_date timestamptz not null default now(),
  edit_date timestamptz,
  is_active boolean not null default true,
  is_delete boolean not null default false
);

-- ---------- Master: เบิกเงินให้ใคร (payee) ----------
create table if not exists payee (
  payee_id uuid primary key default gen_random_uuid(),
  payee_name varchar not null,
  description varchar,
  create_date timestamptz not null default now(),
  edit_date timestamptz,
  is_active boolean not null default true,
  is_delete boolean not null default false
);

-- ---------- Master: สถานะการคืนเงิน ----------
create table if not exists return_status (
  return_status_id uuid primary key default gen_random_uuid(),
  return_status_name varchar not null,
  description varchar,
  create_date timestamptz not null default now(),
  edit_date timestamptz,
  is_active boolean not null default true,
  is_delete boolean not null default false
);

-- ---------- ตารางหลัก: asset (เลขพัสดุ) ----------
create table if not exists asset (
  asset_id uuid primary key default gen_random_uuid(),
  asset_no varchar not null,                    -- เลขพัสดุ
  supreme_court_no varchar,                      -- เลขที่ฎีกา
  activity_name varchar not null,                 -- ชื่อโครงการ
  description varchar,                            -- คำอธิบายเพิ่มเติม
  asset_type_id uuid references asset_type(asset_type_id),
  total_amount decimal(10,2) not null default 0,   -- ยอดเงิน
  company_id uuid references company(company_id),
  payee_id uuid references payee(payee_id),
  return_status_id uuid references return_status(return_status_id), -- สถานะการคืนเงิน
  disbursement_date timestamptz,                  -- วันที่เบิกจ่าย
  transferred_date timestamptz,                   -- วันที่เงินโอนเข้า
  create_date timestamptz not null default now(),
  edit_date timestamptz
);

create index if not exists idx_asset_asset_no on asset(asset_no);
create index if not exists idx_asset_type on asset(asset_type_id);
create index if not exists idx_asset_company on asset(company_id);
create index if not exists idx_asset_payee on asset(payee_id);
create index if not exists idx_asset_return_status on asset(return_status_id);

-- ---------- View: asset พร้อมชื่อ master (สะดวกตอน SELECT จาก frontend) ----------
create or replace view asset_view as
select
  a.*,
  t.asset_type_name,
  c.company_name,
  p.payee_name,
  r.return_status_name
from asset a
left join asset_type t on t.asset_type_id = a.asset_type_id
left join company c on c.company_id = a.company_id
left join payee p on p.payee_id = a.payee_id
left join return_status r on r.return_status_id = a.return_status_id;

-- ---------- Trigger: อัปเดต edit_date อัตโนมัติ ----------
create or replace function set_edit_date()
returns trigger as $$
begin
  new.edit_date = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_asset_edit_date before update on asset
  for each row execute function set_edit_date();
create trigger trg_asset_type_edit_date before update on asset_type
  for each row execute function set_edit_date();
create trigger trg_company_edit_date before update on company
  for each row execute function set_edit_date();
create trigger trg_payee_edit_date before update on payee
  for each row execute function set_edit_date();
create trigger trg_return_status_edit_date before update on return_status
  for each row execute function set_edit_date();

-- ---------- ข้อมูลตั้งต้น: สถานะการคืนเงิน ----------
insert into return_status (return_status_name)
values ('เข้ากองกลาง'), ('จ่ายบริษัท');

-- ==========================================================
-- Row Level Security
-- ค่าตั้งต้น: เฉพาะผู้ที่ล็อกอินแล้ว (authenticated) อ่าน/เขียนได้
--    ต้องเปิดใช้ Supabase Auth (Email) + สร้าง user ก่อนใช้งาน
--    (แอปมีหน้า /login + middleware คุมสิทธิ์ให้แล้ว)
-- ถ้าอยากเปิด public ไม่ต้อง login (ใช้ภายใน/หลัง VPN): รัน supabase/open-rls-policy.sql
-- ==========================================================
alter table asset enable row level security;
alter table asset_type enable row level security;
alter table company enable row level security;
alter table payee enable row level security;
alter table return_status enable row level security;

create policy "authenticated read/write asset" on asset
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write asset_type" on asset_type
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write company" on company
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write payee" on payee
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write return_status" on return_status
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
