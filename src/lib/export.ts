// ยูทิลิตี้ส่งออกรายการเบิกจ่าย — ไม่พึ่งไลบรารีภายนอก
// Excel: CSV แบบ UTF-8 BOM (Excel เปิดภาษาไทยได้ถูกต้อง)
// PDF: เปิดหน้าต่างพิมพ์ที่จัด layout แล้ว → ผู้ใช้ "บันทึกเป็น PDF" ได้เอง

import type { AssetView } from "@/lib/database.types";

// คอลัมน์ที่ใช้ทั้ง CSV และ PDF — header + วิธีดึงค่าจากแต่ละแถว
const COLUMNS: { header: string; value: (row: AssetView) => string }[] = [
  { header: "เลขพัสดุ", value: (r) => r.asset_no },
  { header: "เลขที่ฎีกา", value: (r) => r.supreme_court_no ?? "" },
  { header: "ชื่อโครงการ", value: (r) => r.activity_name },
  { header: "ประเภท", value: (r) => r.asset_type_name ?? "" },
  { header: "ยอดเงิน", value: (r) => String(r.total_amount ?? 0) },
  { header: "บริษัท", value: (r) => r.company_name ?? "" },
  { header: "เบิกให้", value: (r) => r.payee_name ?? "" },
  { header: "สถานะคืนเงิน", value: (r) => r.return_status_name ?? "" },
  { header: "วันที่เบิก", value: (r) => (r.disbursement_date ? r.disbursement_date.slice(0, 10) : "") },
  { header: "วันที่โอน", value: (r) => (r.transferred_date ? r.transferred_date.slice(0, 10) : "") },
  { header: "สถานะโอน", value: (r) => (r.transferred_date ? "โอนแล้ว" : "ยังไม่โอน") },
];

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes()
  )}`;
}

function moneyText(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Excel (CSV) ---

function csvCell(text: string) {
  // ครอบด้วย " เสมอเพื่อความปลอดภัย และ escape " ภายในเป็น ""
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportCsv(rows: AssetView[]) {
  const header = COLUMNS.map((c) => csvCell(c.header)).join(",");
  const lines = rows.map((row) => COLUMNS.map((c) => csvCell(c.value(row))).join(","));
  // ﻿ = BOM ให้ Excel รู้ว่าเป็น UTF-8 แล้วแสดงภาษาไทยถูกต้อง
  const content = "﻿" + [header, ...lines].join("\r\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `รายการเบิกจ่าย-${timestamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- PDF (ผ่านหน้าต่างพิมพ์ของ browser) ---

export function exportPdf(rows: AssetView[], meta?: { filterNote?: string }) {
  const total = rows.reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
  const printedAt = new Date().toLocaleString("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const thead = COLUMNS.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const tbody = rows
    .map((row) => {
      const cells = COLUMNS.map((c, i) => {
        const raw = c.value(row);
        // คอลัมน์ยอดเงิน (index 4) จัดขวา + ใส่ตัวคั่นหลักพัน
        if (i === 4) return `<td class="num">${escapeHtml(moneyText(row.total_amount ?? 0))}</td>`;
        return `<td>${escapeHtml(raw)}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>รายการเบิกจ่ายพัสดุ</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "IBM Plex Sans Thai", "Sarabun", "TH Sarabun New", sans-serif;
    color: #1a1a1a;
    margin: 24px;
    font-size: 12px;
  }
  header { margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 12px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 11px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-size: 11px; }
  td.num, th:nth-child(5) { text-align: right; white-space: nowrap; }
  tfoot td { font-weight: bold; background: #f7f7f7; }
  @media print {
    body { margin: 0; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <header>
    <h1>รายการเบิกจ่ายพัสดุ</h1>
    <div class="meta">
      พิมพ์เมื่อ: ${escapeHtml(printedAt)}<br />
      จำนวน ${rows.length.toLocaleString("th-TH")} รายการ · รวมยอดเงิน ${escapeHtml(
        moneyText(total)
      )} บาท${meta?.filterNote ? `<br />ตัวกรอง: ${escapeHtml(meta.filterNote)}` : ""}
    </div>
  </header>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">รวมทั้งสิ้น</td>
        <td class="num">${escapeHtml(moneyText(total))}</td>
        <td colspan="6"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("เบราว์เซอร์บล็อกการเปิดหน้าต่าง — กรุณาอนุญาต popup แล้วลองใหม่");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  // รอให้ฟอนต์/เลย์เอาต์พร้อมก่อนสั่งพิมพ์
  win.onload = () => {
    win.print();
  };
}
