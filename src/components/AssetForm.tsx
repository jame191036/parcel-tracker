"use client";

import { useEffect, useState, FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AssetType, Company, Payee, ReturnStatus, Asset } from "@/lib/database.types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";

type Option = { id: string; name: string };

const NONE = "__none__";

const emptyForm = {
  asset_no: "",
  supreme_court_no: "",
  activity_name: "",
  description: "",
  asset_type_id: "",
  total_amount: "",
  company_id: "",
  payee_id: "",
  return_status_id: "",
  disbursement_date: "",
  transferred_date: "",
};

// field ที่ label อยู่บนสุดแล้วตามด้วย control — ใช้ซ้ำทั้งฟอร์ม
function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function AssetForm({ assetId }: { assetId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(assetId);

  const [assetTypes, setAssetTypes] = useState<Option[]>([]);
  const [companies, setCompanies] = useState<Option[]>([]);
  const [payees, setPayees] = useState<Option[]>([]);
  const [returnStatuses, setReturnStatuses] = useState<Option[]>([]);

  const [form, setForm] = useState(emptyForm);
  const [loadingRecord, setLoadingRecord] = useState(isEdit);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      const [{ data: types }, { data: comps }, { data: pays }, { data: statuses }] = await Promise.all([
        supabase.from("asset_type").select("asset_type_id, asset_type_name").eq("is_active", true),
        supabase.from("company").select("company_id, company_name").eq("is_active", true),
        supabase.from("payee").select("payee_id, payee_name").eq("is_active", true),
        supabase.from("return_status").select("return_status_id, return_status_name").eq("is_active", true),
      ]);
      setAssetTypes((types as AssetType[] | null)?.map((t) => ({ id: t.asset_type_id, name: t.asset_type_name })) ?? []);
      setCompanies((comps as Company[] | null)?.map((c) => ({ id: c.company_id, name: c.company_name })) ?? []);
      setPayees((pays as Payee[] | null)?.map((p) => ({ id: p.payee_id, name: p.payee_name })) ?? []);
      setReturnStatuses(
        (statuses as ReturnStatus[] | null)?.map((r) => ({ id: r.return_status_id, name: r.return_status_name })) ?? []
      );
    }
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!assetId) return;
    async function loadRecord() {
      const { data, error } = await supabase
        .from("asset")
        .select("*")
        .eq("asset_id", assetId!) // guard `if (!assetId) return` ด้านบนการันตีว่าไม่ undefined
        .single();

      if (error) {
        setError(error.message);
        setLoadingRecord(false);
        return;
      }

      const row = data as Asset;
      setForm({
        asset_no: row.asset_no,
        supreme_court_no: row.supreme_court_no ?? "",
        activity_name: row.activity_name,
        description: row.description ?? "",
        asset_type_id: row.asset_type_id ?? "",
        total_amount: String(row.total_amount ?? ""),
        company_id: row.company_id ?? "",
        payee_id: row.payee_id ?? "",
        return_status_id: row.return_status_id ?? "",
        disbursement_date: row.disbursement_date ? row.disbursement_date.slice(0, 10) : "",
        transferred_date: row.transferred_date ? row.transferred_date.slice(0, 10) : "",
      });
      setLoadingRecord(false);
    }
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      asset_no: form.asset_no,
      supreme_court_no: form.supreme_court_no || null,
      activity_name: form.activity_name,
      description: form.description || null,
      asset_type_id: form.asset_type_id || null,
      total_amount: Number(form.total_amount || 0),
      company_id: form.company_id || null,
      payee_id: form.payee_id || null,
      return_status_id: form.return_status_id || null,
      disbursement_date: form.disbursement_date || null,
      transferred_date: form.transferred_date || null,
    };

    const { error } = isEdit
      ? await supabase.from("asset").update(payload).eq("asset_id", assetId!) // isEdit ⇒ assetId มีค่า
      : await supabase.from("asset").insert(payload);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleDelete() {
    if (!assetId) return;
    setDeleting(true);
    setError(null);

    const { error } = await supabase.from("asset").delete().eq("asset_id", assetId);

    setDeleting(false);

    if (error) {
      setConfirmOpen(false);
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (loadingRecord) {
    return <p className="font-mono text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>;
  }

  // dropdown แบบ optional: ค่าว่าง = ไม่ระบุ (Radix ใช้ค่าว่างไม่ได้ → placeholder + sentinel)
  const optionalSelect = (
    key: "asset_type_id" | "company_id" | "payee_id" | "return_status_id",
    options: Option[],
    placeholder = "— เลือก —"
  ) => (
    <Select
      value={form[key] || undefined}
      onValueChange={(v) => update(key, v === NONE ? "" : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— ไม่ระบุ —</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Card className="max-w-2xl p-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="เลขพัสดุ *">
            <Input
              required
              value={form.asset_no}
              onChange={(e) => update("asset_no", e.target.value)}
            />
          </Field>
          <Field label="เลขที่ฎีกา">
            <Input
              value={form.supreme_court_no}
              onChange={(e) => update("supreme_court_no", e.target.value)}
            />
          </Field>

          <Field label="ชื่อโครงการ *" className="col-span-2">
            <Input
              required
              value={form.activity_name}
              onChange={(e) => update("activity_name", e.target.value)}
            />
          </Field>

          <Field label="คำอธิบายเพิ่มเติม" className="col-span-2">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>

          <Field label="ประเภทพัสดุ">{optionalSelect("asset_type_id", assetTypes)}</Field>

          <Field label="ยอดเงิน (บาท) *">
            <Input
              required
              type="number"
              step="0.01"
              value={form.total_amount}
              onChange={(e) => update("total_amount", e.target.value)}
            />
          </Field>

          <Field label="บริษัททำเบิกจ่าย">{optionalSelect("company_id", companies)}</Field>
          <Field label="เบิกเงินให้ใคร">{optionalSelect("payee_id", payees)}</Field>
          <Field label="สถานะการคืนเงิน">{optionalSelect("return_status_id", returnStatuses)}</Field>

          <Field label="วันที่เบิกจ่าย">
            <Input
              type="date"
              value={form.disbursement_date}
              onChange={(e) => update("disbursement_date", e.target.value)}
            />
          </Field>
          <Field label="วันที่เงินโอนเข้า">
            <Input
              type="date"
              value={form.transferred_date}
              onChange={(e) => update("transferred_date", e.target.value)}
            />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
            {isEdit ? "บันทึกการแก้ไขไม่สำเร็จ" : "บันทึกไม่สำเร็จ"}: {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div>
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmOpen(true)}
                disabled={deleting || submitting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                ลบรายการนี้
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" asChild>
              <a href="/">ยกเลิก</a>
            </Button>
            <Button type="submit" disabled={submitting || deleting}>
              {submitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "บันทึกรายการ"}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              ต้องการลบรายการ &quot;{form.asset_no}&quot; ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
