"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AssetView } from "@/lib/database.types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export default function AssetTable() {
  const [rows, setRows] = useState<AssetView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("asset_view")
      .select("*")
      .order("create_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setRows((data as AssetView[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="font-mono text-sm text-ink/50">กำลังโหลดรายการ...</p>;
  }

  if (error) {
    return (
      <div className="border border-warn/30 bg-warn/5 p-4 font-mono text-sm text-warn">
        โหลดข้อมูลไม่สำเร็จ: {error}
        <br />
        ตรวจสอบว่าตั้งค่า NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY แล้ว
        และรัน supabase/schema.sql บนโปรเจกต์ Supabase แล้ว
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-line p-10 text-center text-ink/50">
        ยังไม่มีรายการ —{" "}
        <a href="/new" className="text-brand underline">
          จดรายการแรก
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-brandSoft/60 text-left font-mono text-xs uppercase tracking-wide text-ink/60">
            <th className="px-4 py-3">เลขพัสดุ</th>
            <th className="px-4 py-3">เลขที่ฎีกา</th>
            <th className="px-4 py-3">ชื่อโครงการ</th>
            <th className="px-4 py-3">ประเภท</th>
            <th className="px-4 py-3 text-right">ยอดเงิน</th>
            <th className="px-4 py-3">บริษัท</th>
            <th className="px-4 py-3">เบิกให้</th>
            <th className="px-4 py-3">สถานะคืนเงิน</th>
            <th className="px-4 py-3">วันที่เบิก</th>
            <th className="px-4 py-3">วันที่โอน</th>
            <th className="px-4 py-3">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.asset_id} className="border-b border-line/60 last:border-0 hover:bg-brandSoft/30">
              <td className="px-4 py-3 font-mono tabular-num">{row.asset_no}</td>
              <td className="px-4 py-3 font-mono tabular-num text-ink/70">
                {row.supreme_court_no ?? "—"}
              </td>
              <td className="px-4 py-3">{row.activity_name}</td>
              <td className="px-4 py-3 text-ink/70">{row.asset_type_name ?? "—"}</td>
              <td className="px-4 py-3 text-right font-mono tabular-num">
                {formatMoney(row.total_amount)}
              </td>
              <td className="px-4 py-3 text-ink/70">{row.company_name ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{row.payee_name ?? "—"}</td>
              <td className="px-4 py-3 text-ink/70">{row.return_status_name ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-ink/70">
                {formatDate(row.disbursement_date)}
              </td>
              <td className="px-4 py-3 font-mono">
                {row.transferred_date ? (
                  <span className="text-brand">{formatDate(row.transferred_date)}</span>
                ) : (
                  <span className="text-warn">ยังไม่โอน</span>
                )}
              </td>
              <td className="px-4 py-3">
                <a href={`/edit/${row.asset_id}`} className="font-mono text-xs text-brand hover:underline">
                  แก้ไข
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
