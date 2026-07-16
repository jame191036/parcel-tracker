-- ==========================================================
-- Migration: เปิดให้เข้าถึงตารางได้โดยไม่ต้อง login (anon)
-- รันใน Supabase: Project > SQL Editor > New query
-- ⚠️ คำเตือน: ทุกคนที่มี anon key (public) จะอ่าน/เขียนข้อมูลได้หมด
--    รวมถึงข้อมูลการเงิน เหมาะสำหรับใช้งานภายในทีมที่ไว้ใจกัน
--    หรือ deploy หลัง VPN/intranet เท่านั้น ไม่ควรเปิดสู่อินเทอร์เน็ตสาธารณะ
-- ==========================================================

drop policy if exists "authenticated read/write asset" on asset;
drop policy if exists "authenticated read/write asset_type" on asset_type;
drop policy if exists "authenticated read/write company" on company;
drop policy if exists "authenticated read/write payee" on payee;

create policy "public read/write asset" on asset
  for all using (true) with check (true);
create policy "public read/write asset_type" on asset_type
  for all using (true) with check (true);
create policy "public read/write company" on company
  for all using (true) with check (true);
create policy "public read/write payee" on payee
  for all using (true) with check (true);
