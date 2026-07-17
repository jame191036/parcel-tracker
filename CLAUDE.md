# CLAUDE.md

บริบทโปรเจกต์นี้สำหรับ Claude Code — อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง

## ภาพรวมโปรเจกต์

**ทะเบียนคุมพัสดุ (Parcel / Disbursement Tracker)** — ระบบจดเลขพัสดุและติดตามการเบิกจ่ายเงินภายในองค์กร
Next.js 14 (App Router) + TypeScript + Tailwind + Supabase JS client
แอปเดียว ไม่มี backend แยก — เรียก Supabase ตรงจาก client (`"use client"` components ทั้งหมด) และคุมสิทธิ์ด้วย Row Level Security

UI เป็นภาษาไทยทั้งหมด (label, ปุ่ม, ข้อความ error) — เขียนต่อให้เป็นภาษาไทยตามเดิม

## Stack

- Next.js 14 App Router, React 18, TypeScript (strict mode)
- Tailwind CSS — สี/ฟอนต์ custom อยู่ใน `tailwind.config.ts` (ink, paper, line, brand, brandSoft, warn / IBM Plex Sans Thai, IBM Plex Mono)
- **shadcn/ui** — component อยู่ใน `src/components/ui/` (button, input, textarea, label, select, badge, card, table, dialog, sonner), helper `cn()` ใน `src/lib/utils.ts`, config ที่ `components.json`. เพิ่ม component ใหม่ด้วย `npx shadcn@latest add <name>` ได้เลย
  - **semantic token = สีฟ้า + รองรับ dark mode**: `globals.css` ประกาศ CSS variables ทั้งชุด light (`:root`) และ dark (`.dark`) — `--primary`=blue (light blue-600 / dark blue-500), `--background`/`--foreground`/`--border`/`--secondary`(blue-100)/`--destructive`(warn ส้ม) ฯลฯ แล้ว `tailwind.config.ts` map เป็นคลาส `bg-primary`/`text-foreground`/`border-border`/`bg-secondary`...
  - **ต้องใช้ semantic token เท่านั้นในโค้ดใหม่** (`text-foreground`, `border-border`, `bg-card`, `text-primary`, `text-muted-foreground`) — **ห้าม hardcode สี legacy** (`text-ink`, `border-line`, `bg-paper`, `text-brand`, `bg-brandSoft`) เพราะเป็น hex คงที่ ไม่ flip ตอน dark mode (ตอนนี้ migrate ออกหมดแล้ว) ส่วนสถานะ "ยังไม่โอน" ใช้ `amber-500/700 dark:amber-400`
- **Dark mode** — `next-themes` (`darkMode: ["class"]`): `<ThemeProvider>` (`src/components/theme-provider.tsx`) ครอบใน `layout.tsx` ด้วย `attribute="class" defaultTheme="system" enableSystem`, ปุ่มสลับคือ `src/components/ThemeToggle.tsx` (เช็ก `mounted` กัน hydration mismatch), `<html suppressHydrationWarning>`, และ `<Toaster>` อ่าน theme จาก `useTheme()`
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — ใช้ `createClient()` จาก `src/lib/supabase/client.ts` เท่านั้น (browser client, ไม่มี server-side auth flow)

## โครงสร้างไฟล์

```
src/
├── app/
│   ├── layout.tsx        # โครง layout + nav (รายการทั้งหมด / จดรายการใหม่ / จัดการข้อมูลหลัก)
│   ├── page.tsx           # หน้ารายการทั้งหมด → <AssetTable />
│   ├── new/page.tsx        # หน้าเพิ่มรายการ → <AssetForm />
│   ├── edit/[id]/page.tsx  # หน้าแก้ไขรายการ → <AssetForm assetId={params.id} />
│   ├── master/page.tsx     # หน้าจัดการ master data แบบ tab (4 ตาราง)
│   └── globals.css
├── components/
│   ├── AssetTable.tsx        # ตาราง + filter/search + export จาก asset_view
│   ├── AssetForm.tsx         # ฟอร์ม insert/update ตาราง asset (ใช้ทั้งหน้า new และ edit)
│   ├── MasterDataManager.tsx # component กลาง CRUD ใช้ซ้ำกับ 4 master table
│   ├── Nav.tsx               # nav bar (client, ไฮไลต์ลิงก์ที่ active ด้วย usePathname)
│   └── ui/                   # shadcn/ui primitives (button, input, select, table, dialog ...)
└── lib/
    ├── database.types.ts   # TS types มือเขียน (ไม่ได้ generate จาก Supabase CLI)
    ├── export.ts           # ส่งออก CSV (Excel) + PDF (ผ่านหน้าต่างพิมพ์) ไม่พึ่งไลบรารีภายนอก
    ├── utils.ts            # cn() helper ของ shadcn
    └── supabase/client.ts
supabase/
└── schema.sql   # source of truth ของ schema — ต้องอัปเดตไฟล์นี้ทุกครั้งที่แก้ DB
```

## Database schema (สถานะล่าสุด)

ตาราง master (โครงสร้างเหมือนกันหมด: `<x>_id` uuid PK, `<x>_name`, `description`, `create_date`, `edit_date`, `is_active`, `is_delete`):
- `asset_type` — ประเภทพัสดุ
- `company` — บริษัททำเบิกจ่าย
- `payee` — เบิกเงินให้ใคร
- `return_status` — สถานะการคืนเงิน (ค่าตั้งต้น: "เข้ากองกลาง", "จ่ายบริษัท")

ตารางหลัก `asset`: asset_no, supreme_court_no, activity_name, description, asset_type_id (FK), total_amount, company_id (FK), payee_id (FK), return_status_id (FK), disbursement_date, transferred_date, create_date, edit_date

View `asset_view` = `asset` join ชื่อจาก master ทั้ง 4 ตัว (asset_type_name, company_name, payee_name, return_status_name) — frontend SELECT จาก view นี้เสมอ ไม่ query ตาราง asset ตรงๆ

**RLS: เฉพาะผู้ล็อกอิน (`auth.role() = 'authenticated'`) ทุกตาราง** — มีระบบ login แล้ว (Supabase Auth email/password) เพื่อให้ deploy ขึ้น public ได้ปลอดภัย
- migration: `supabase/auth-rls-policy.sql` (public → authenticated), ย้อนกลับ public ได้ด้วย `supabase/open-rls-policy.sql`
- ต้องเปิด Email provider + สร้าง user ใน Supabase Dashboard (Authentication > Users) เอง — แอปไม่มีหน้า signup (internal tool, admin provision ให้)
- **auth flow**: `src/middleware.ts` (ต้องอยู่ใน `src/` เพราะโปรเจกต์ใช้ src directory) เรียก `updateSession()` จาก `src/lib/supabase/middleware.ts` — รีเฟรช session + เด้ง unauthenticated ไป `/login`, เด้งคน login แล้วออกจาก `/login`. หน้า login = `src/app/login/page.tsx`, header+ปุ่ม logout = `src/components/AppHeader.tsx` (ซ่อนตัวเองบน `/login`)
- component ที่ query ข้อมูลไม่ต้องแก้ — browser client (`@supabase/ssr`) แนบ session อัตโนมัติหลัง login

**Soft delete convention**: ตาราง master ไม่ hard delete — ใช้ `is_delete = true` (ซ่อนจากลิสต์) และ `is_active` (toggle เปิด/ปิดใช้งาน, กรองใน dropdown ตอนเพิ่ม/แก้ไข asset ด้วย `.eq("is_active", true)`) เหตุผล: กัน foreign key เพี้ยนถ้ามี asset เก่าอ้างอิง id อยู่

## Gotcha ที่เจอมาแล้ว (สำคัญ กันเสียเวลาซ้ำ)

1. **แก้ view ที่มีอยู่แล้วให้เพิ่มคอลัมน์กลาง/ท้าย**: ห้ามใช้ `create or replace view` ถ้า column order เปลี่ยน (Postgres error 42P16 "cannot change name of view column") — ต้อง `drop view if exists ...;` ก่อนแล้วค่อย `create view ...` ใหม่เสมอ
2. **Migration SQL ต้อง idempotent เสมอ**: ใช้ `if not exists` ทุกจุดที่ทำได้ (`create table if not exists`, `add column if not exists`) ส่วน `create trigger` และ `create policy` ไม่รองรับ `if not exists` โดยตรง — ต้องครอบด้วย `do $$ begin if not exists (...) then ... end if; end $$;` เพื่อกัน error ตอนรันซ้ำ
3. Supabase SQL Editor รันทั้ง script เป็น transaction เดียว — ถ้า statement ไหน error กลางทาง ทุก statement ก่อนหน้าจะ rollback หมดด้วย (แม้จะดูเหมือนรันผ่านไปแล้วจาก log บางส่วน) ให้ระวังเวลาเขียน migration ยาวๆ
4. **อัปเดต `supabase/schema.sql` ทุกครั้งที่แก้ schema** ให้ตรงกับสถานะจริงบน Supabase เพราะเป็นไฟล์ที่คนติดตั้งใหม่ในอนาคตจะรัน — schema.sql ควรสร้าง DB จากศูนย์แล้วได้ผลลัพธ์เดียวกับที่ production เป็นอยู่ตอนนี้เป๊ะๆ
5. **⚠️ อย่าอัป `@supabase/supabase-js` เกิน 2.45.x (pin ไว้ที่ `2.45.4` เป๊ะ)**: `@supabase/ssr@0.5.2` คืน type `SupabaseClient<Database, SchemaName, Schema>` (generic order แบบเก่า) แต่ supabase-js ตั้งแต่ ~2.7x ขึ้นไปเปลี่ยนลำดับ generic ของ `SupabaseClient` (arg 2 กลายเป็น `SchemaNameOrClientOptions` และ fallback เป็น `never` แทน `any`) → ssr ส่ง schema object ไปผิดช่อง ทำให้ **type ทุก query กลายเป็น `never`** (insert/update/eq error หมด) และ build ล้ม นอกจากนี้ 2.110+ ยัง require node 22 (โปรเจกต์ใช้ node 20). วิธีแก้: pin supabase-js ไว้คู่กับ ssr 0.5.2. ถ้าจะอัป supabase-js เป็นเวอร์ชันใหม่จริงๆ ต้องอัป `@supabase/ssr` เป็นเวอร์ชันที่คู่กัน (0.6/0.7+) พร้อมกัน
6. **`database.types.ts` ต้องครบ shape ที่ postgrest-js คาดหวัง**: แต่ละตารางต้องมี `Row/Insert/Update/Relationships` + top-level ต้องมี `Functions/Enums/CompositeTypes` ไม่งั้น `Database["public"]` ไม่ผ่าน `extends GenericSchema` แล้ว fallback เป็น `never`
7. **MasterDataManager query แบบ dynamic**: component นี้ทำงานกับ 4 master table แบบ generic (ชื่อตาราง/คอลัมน์เป็นตัวแปร) ซึ่ง type generic ตรวจ union ไม่ได้ จึง cast client เป็น `SupabaseClient` (ไม่ผูก schema) เฉพาะไฟล์นั้น — ถ้าเพิ่ม field ใหม่ในตาราง master จะไม่มี type ช่วยเช็ก ต้องระวังเอง
8. **middleware ต้องอยู่ที่ `src/middleware.ts`**: โปรเจกต์ใช้ src directory ดังนั้น Next.js จะมองหา middleware ใน `src/` เท่านั้น — ถ้าวางที่ root (`./middleware.ts`) จะไม่ทำงานเงียบๆ (ไม่ error แต่ auth ไม่คุ้มครองเลย ทุกหน้าเปิดโล่ง)

## Convention การเขียนโค้ด

- ทุก component ที่ใช้ hooks/event handler ต้องมี `"use client"` บรรทัดแรก
- ใช้ component จาก `src/components/ui/` เป็นหลัก (`Button`, `Input`, `Select`, `Card`, `Table`, `Badge`, `Dialog` ...) แทนการเขียน element ดิบ + คลาส Tailwind ซ้ำๆ
- ปุ่ม/action ที่ทำลายข้อมูล (ลบ) ต้อง**ยืนยันก่อนเสมอ** — ใช้ `<Dialog>` (ดูตัวอย่างใน AssetForm.tsx / MasterDataManager.tsx) แทน `window.confirm()` แบบเดิม
- Error จาก Supabase ให้ setError แล้วโชว์ในกล่อง `border-destructive/30 bg-destructive/5 text-destructive` ใต้ฟอร์ม — อย่าใช้ `alert()` (มี `<Toaster>` จาก sonner ใน layout เผื่ออยากใช้ `toast()` เพิ่ม)
- **Radix Select ใช้ value ค่าว่าง (`""`) ไม่ได้** — ตัวเลือก "ทั้งหมด"/"ไม่ระบุ" ต้องใช้ sentinel (`"all"` / `"__none__"`) แล้ว map กลับเป็น `""` ตอน onChange (ดู AssetTable.tsx / AssetForm.tsx)
- ตั้งชื่อ label/ข้อความ UI เป็นภาษาไทยล้วน สั้น กระชับ ตรงกับ field ใน schema

## สิ่งที่ทำเสร็จแล้ว

- ✅ ดูรายการ (`/`), เพิ่มรายการ (`/new`), แก้ไข/ลบรายการ (`/edit/[id]`)
- ✅ **Login (Supabase Auth) + RLS แบบ authenticated** — หน้า `/login`, middleware คุมสิทธิ์, ปุ่ม logout ใน header (พร้อม deploy ขึ้น public)
- ✅ ตาราง `return_status` + คอลัมน์ `description` ทุกตาราง
- ✅ หน้าจัดการ master data (`/master`) — CRUD ครบ 4 ตาราง พร้อม soft delete
- ✅ **Filter/Search** — กรองใน `AssetTable.tsx` แบบ client-side (`useMemo`) บนข้อมูลที่โหลดมาแล้ว: ค้นหาข้อความ (เลขพัสดุ/เลขฎีกา/ชื่อโครงการ), ประเภท/บริษัท/เบิกให้/สถานะคืนเงิน (dropdown ดึงจากค่าที่มีจริงในรายการ), สถานะโอนเงิน, ช่วงวันที่เบิก + สรุปจำนวน/ยอดรวมตามผลกรอง
- ✅ **Export Excel/PDF** — `src/lib/export.ts` (ไม่พึ่งไลบรารีภายนอก): Excel = CSV แบบ UTF-8 BOM, PDF = เปิดหน้าต่างพิมพ์ของ browser แล้วบันทึกเป็น PDF (เลี่ยงปัญหาฝังฟอนต์ไทยใน jsPDF) — ปุ่มอยู่ในแถบกรอง export เฉพาะรายการที่กรองอยู่

## Deploy (Vercel)

พร้อม deploy: `npm run build` ผ่าน, `.env.local` ไม่ถูก commit (ดู `.env.local.example`)
1. push ขึ้น Git → import เข้า Vercel (detect Next.js อัตโนมัติ)
2. ตั้ง env ใน Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **ก่อน/หลัง deploy: รัน `supabase/auth-rls-policy.sql` + เปิด Email auth + สร้าง user** (ไม่งั้นเข้าใช้ไม่ได้ หรือถ้ายังเป็น RLS public จะเปิดข้อมูลการเงินสู่สาธารณะ)

## สิ่งที่ยังไม่ได้ทำ (ทำต่อได้เลย)

- ⬜ (ยังไม่มีงานค้างหลัก — filter/search, export, master data, auth เสร็จหมดแล้ว)
