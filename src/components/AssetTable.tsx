"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportCsv, exportPdf } from "@/lib/export";
import type { AssetView } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, FileText, Pencil, Search, Trash2, X } from "lucide-react";

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

const ALL = "all";

const emptyFilters = {
  q: "",
  asset_type_id: "",
  company_id: "",
  payee_id: "",
  return_status_id: "",
  transfer: "", // "" | "done" | "pending"
  date_from: "", // วันที่เบิก
  date_to: "",
  transferred_from: "", // วันที่โอน
  transferred_to: "",
  amount_min: "", // ยอดเงิน (บาท)
  amount_max: "",
};

type Option = { id: string; name: string };

// ดึงตัวเลือก dropdown จากค่าที่มีจริงในรายการ (id + ชื่อ) แบบไม่ซ้ำ
function uniqueOptions(
  rows: AssetView[],
  idKey: keyof AssetView,
  nameKey: keyof AssetView
): Option[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = row[idKey] as string | null;
    const name = row[nameKey] as string | null;
    if (id && name && !map.has(id)) map.set(id, name);
  }
  return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name, "th")
  );
}

// dropdown กรอง: "" = ทั้งหมด (Radix Select ใช้ค่าว่างไม่ได้ จึงใช้ sentinel "all")
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <div className="space-y-1">
      <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value || ALL}
        onValueChange={(v) => onChange(v === ALL ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>ทั้งหมด</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function AssetTable() {
  const [rows, setRows] = useState<AssetView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(emptyFilters);

  const [deleteTarget, setDeleteTarget] = useState<AssetView | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("asset")
      .delete()
      .eq("asset_id", deleteTarget.asset_id);
    setDeleting(false);

    if (error) {
      setDeleteTarget(null);
      toast.error(`ลบไม่สำเร็จ: ${error.message}`);
      return;
    }
    // เอาแถวที่ลบออกจาก state ทันที ไม่ต้องโหลดใหม่
    setRows((prev) => prev.filter((r) => r.asset_id !== deleteTarget.asset_id));
    toast.success(`ลบรายการ "${deleteTarget.asset_no}" แล้ว`);
    setDeleteTarget(null);
  }

  function updateFilter<K extends keyof typeof filters>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const typeOptions = useMemo(() => uniqueOptions(rows, "asset_type_id", "asset_type_name"), [rows]);
  const companyOptions = useMemo(() => uniqueOptions(rows, "company_id", "company_name"), [rows]);
  const payeeOptions = useMemo(() => uniqueOptions(rows, "payee_id", "payee_name"), [rows]);
  const returnStatusOptions = useMemo(
    () => uniqueOptions(rows, "return_status_id", "return_status_name"),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return rows.filter((row) => {
      if (q) {
        const haystack = [row.asset_no, row.supreme_court_no, row.activity_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.asset_type_id && row.asset_type_id !== filters.asset_type_id) return false;
      if (filters.company_id && row.company_id !== filters.company_id) return false;
      if (filters.payee_id && row.payee_id !== filters.payee_id) return false;
      if (filters.return_status_id && row.return_status_id !== filters.return_status_id) return false;
      if (filters.transfer === "done" && !row.transferred_date) return false;
      if (filters.transfer === "pending" && row.transferred_date) return false;
      if (filters.date_from && (!row.disbursement_date || row.disbursement_date < filters.date_from))
        return false;
      if (filters.date_to && (!row.disbursement_date || row.disbursement_date > filters.date_to))
        return false;
      // ช่วงวันที่โอน — แถวที่ยังไม่โอน (null) จะถูกตัดออกเมื่อกำหนดช่วง
      if (
        filters.transferred_from &&
        (!row.transferred_date || row.transferred_date < filters.transferred_from)
      )
        return false;
      if (
        filters.transferred_to &&
        (!row.transferred_date || row.transferred_date > filters.transferred_to)
      )
        return false;
      // ช่วงยอดเงิน
      if (filters.amount_min && (row.total_amount ?? 0) < Number(filters.amount_min)) return false;
      if (filters.amount_max && (row.total_amount ?? 0) > Number(filters.amount_max)) return false;
      return true;
    });
  }, [rows, filters]);

  const totalAmount = useMemo(
    () => filteredRows.reduce((sum, row) => sum + (row.total_amount ?? 0), 0),
    [filteredRows]
  );

  const hasActiveFilter = useMemo(
    () => Object.values(filters).some((v) => v !== ""),
    [filters]
  );

  // สรุปตัวกรองเป็นข้อความ ไว้ใส่หัวรายงาน PDF
  const filterNote = useMemo(() => {
    const parts: string[] = [];
    const nameOf = (list: Option[], id: string) => list.find((o) => o.id === id)?.name ?? id;
    if (filters.q) parts.push(`ค้นหา "${filters.q}"`);
    if (filters.asset_type_id) parts.push(`ประเภท: ${nameOf(typeOptions, filters.asset_type_id)}`);
    if (filters.company_id) parts.push(`บริษัท: ${nameOf(companyOptions, filters.company_id)}`);
    if (filters.payee_id) parts.push(`เบิกให้: ${nameOf(payeeOptions, filters.payee_id)}`);
    if (filters.return_status_id)
      parts.push(`สถานะคืนเงิน: ${nameOf(returnStatusOptions, filters.return_status_id)}`);
    if (filters.transfer === "done") parts.push("สถานะโอน: โอนแล้ว");
    if (filters.transfer === "pending") parts.push("สถานะโอน: ยังไม่โอน");
    if (filters.date_from) parts.push(`เบิกตั้งแต่ ${filters.date_from}`);
    if (filters.date_to) parts.push(`เบิกถึง ${filters.date_to}`);
    if (filters.transferred_from) parts.push(`โอนตั้งแต่ ${filters.transferred_from}`);
    if (filters.transferred_to) parts.push(`โอนถึง ${filters.transferred_to}`);
    if (filters.amount_min) parts.push(`ยอดตั้งแต่ ${formatMoney(Number(filters.amount_min))}`);
    if (filters.amount_max) parts.push(`ยอดถึง ${formatMoney(Number(filters.amount_max))}`);
    return parts.join(" · ");
  }, [filters, typeOptions, companyOptions, payeeOptions, returnStatusOptions]);

  if (loading) {
    return <p className="font-mono text-sm text-muted-foreground">กำลังโหลดรายการ...</p>;
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 p-4 font-mono text-sm text-destructive">
        โหลดข้อมูลไม่สำเร็จ: {error}
        <br />
        ตรวจสอบว่าตั้งค่า NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY แล้ว
        และรัน supabase/schema.sql บนโปรเจกต์ Supabase แล้ว
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
        ยังไม่มีรายการ —{" "}
        <a href="/new" className="text-primary underline">
          จดรายการแรก
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* แถบค้นหา / กรอง */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1 lg:col-span-2">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              ค้นหา (เลขพัสดุ / เลขฎีกา / ชื่อโครงการ)
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="พิมพ์คำค้น..."
                value={filters.q}
                onChange={(e) => updateFilter("q", e.target.value)}
              />
            </div>
          </div>

          <FilterSelect
            label="ประเภทพัสดุ"
            value={filters.asset_type_id}
            onChange={(v) => updateFilter("asset_type_id", v)}
            options={typeOptions}
          />
          <FilterSelect
            label="บริษัท"
            value={filters.company_id}
            onChange={(v) => updateFilter("company_id", v)}
            options={companyOptions}
          />
          <FilterSelect
            label="เบิกให้"
            value={filters.payee_id}
            onChange={(v) => updateFilter("payee_id", v)}
            options={payeeOptions}
          />
          <FilterSelect
            label="สถานะคืนเงิน"
            value={filters.return_status_id}
            onChange={(v) => updateFilter("return_status_id", v)}
            options={returnStatusOptions}
          />

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              สถานะโอนเงิน
            </Label>
            <Select
              value={filters.transfer || ALL}
              onValueChange={(v) => updateFilter("transfer", v === ALL ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>ทั้งหมด</SelectItem>
                <SelectItem value="done">โอนแล้ว</SelectItem>
                <SelectItem value="pending">ยังไม่โอน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              วันที่เบิก ตั้งแต่
            </Label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter("date_from", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              วันที่เบิก ถึง
            </Label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter("date_to", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              วันที่โอน ตั้งแต่
            </Label>
            <Input
              type="date"
              value={filters.transferred_from}
              onChange={(e) => updateFilter("transferred_from", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              วันที่โอน ถึง
            </Label>
            <Input
              type="date"
              value={filters.transferred_to}
              onChange={(e) => updateFilter("transferred_to", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              ยอดเงิน ตั้งแต่ (บาท)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={filters.amount_min}
              onChange={(e) => updateFilter("amount_min", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              ยอดเงิน ถึง (บาท)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="ไม่จำกัด"
              value={filters.amount_max}
              onChange={(e) => updateFilter("amount_max", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="font-mono text-xs text-muted-foreground">
            พบ{" "}
            <span className="font-semibold text-foreground">
              {filteredRows.length.toLocaleString("th-TH")}
            </span>{" "}
            รายการ
            {hasActiveFilter && ` (จากทั้งหมด ${rows.length.toLocaleString("th-TH")})`}
            {" · "}รวมยอดเงิน{" "}
            <span className="font-semibold text-foreground">{formatMoney(totalAmount)}</span> บาท
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(emptyFilters)}
              >
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(filteredRows)}
              disabled={filteredRows.length === 0}
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportPdf(filteredRows, { filterNote })}
              disabled={filteredRows.length === 0}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* ตาราง */}
      {filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          ไม่พบรายการที่ตรงกับตัวกรอง —{" "}
          <button
            type="button"
            onClick={() => setFilters(emptyFilters)}
            className="text-primary underline"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead>เลขพัสดุ</TableHead>
                <TableHead>เลขที่ฎีกา</TableHead>
                <TableHead>ชื่อโครงการ</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">ยอดเงิน</TableHead>
                <TableHead>บริษัท</TableHead>
                <TableHead>เบิกให้</TableHead>
                <TableHead>สถานะคืนเงิน</TableHead>
                <TableHead>วันที่เบิก</TableHead>
                <TableHead>วันที่โอน</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.asset_id}>
                  <TableCell className="font-mono tabular-num">{row.asset_no}</TableCell>
                  <TableCell className="font-mono tabular-num text-muted-foreground">
                    {row.supreme_court_no ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{row.activity_name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.asset_type_name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-num">
                    {formatMoney(row.total_amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.company_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.payee_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.return_status_name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {formatDate(row.disbursement_date)}
                  </TableCell>
                  <TableCell>
                    {row.transferred_date ? (
                      <Badge variant="success">{formatDate(row.transferred_date)}</Badge>
                    ) : (
                      <Badge variant="warn">ยังไม่โอน</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/edit/${row.asset_id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                          แก้ไข
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(row)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`ลบ ${row.asset_no}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        ลบ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  รวมทั้งสิ้น
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-num">
                  {formatMoney(totalAmount)}
                </TableCell>
                <TableCell colSpan={6} />
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              ต้องการลบรายการ &quot;{deleteTarget?.asset_no}&quot;
              {deleteTarget?.activity_name ? ` (${deleteTarget.activity_name})` : ""} ใช่หรือไม่?
              การลบไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "กำลังลบ..." : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
