-- ==========================================================
-- Migration: เปลี่ยน RLS จาก public → เฉพาะผู้ที่ล็อกอิน (authenticated)
-- รันใน Supabase: Project > SQL Editor > New query
--
-- ทำก่อน deploy ขึ้นอินเทอร์เน็ตสาธารณะ (เช่น Vercel):
--   1) เปิดใช้ Email auth: Authentication > Providers > Email (ปิด "Confirm email"
--      ได้ถ้าจะสร้าง user เองในทีม)
--   2) สร้างผู้ใช้: Authentication > Users > Add user (กำหนด email + password)
--   3) รันไฟล์นี้
-- หลังรัน: ต้องล็อกอินก่อนถึงจะอ่าน/เขียนข้อมูลได้ (anon key อย่างเดียวเข้าไม่ได้แล้ว)
--
-- ถ้าจะย้อนกลับเป็น public: รัน supabase/open-rls-policy.sql
-- ==========================================================

-- ลบ policy public เดิม (idempotent)
drop policy if exists "public read/write asset" on asset;
drop policy if exists "public read/write asset_type" on asset_type;
drop policy if exists "public read/write company" on company;
drop policy if exists "public read/write payee" on payee;
drop policy if exists "public read/write return_status" on return_status;

-- เผื่อรันซ้ำ ลบ policy authenticated เดิมด้วย
drop policy if exists "authenticated read/write asset" on asset;
drop policy if exists "authenticated read/write asset_type" on asset_type;
drop policy if exists "authenticated read/write company" on company;
drop policy if exists "authenticated read/write payee" on payee;
drop policy if exists "authenticated read/write return_status" on return_status;

-- สร้าง policy ใหม่: เฉพาะผู้ที่ล็อกอินแล้วเท่านั้น
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
