"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AssetType, Company, Payee, ReturnStatus, Asset } from "@/lib/database.types";

type Option = { id: string; name: string };

const inputClass =
  "w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand";
const labelClass = "mb-1 block font-mono text-xs uppercase tracking-wide text-ink/60";

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
        .eq("asset_id", assetId)
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
      ? await supabase.from("asset").update(payload).eq("asset_id", assetId)
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
    if (!window.confirm(`ยืนยันลบรายการ "${form.asset_no}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`)) {
      return;
    }
    setDeleting(true);
    setError(null);

    const { error } = await supabase.from("asset").delete().eq("asset_id", assetId);

    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (loadingRecord) {
    return <p className="font-mono text-sm text-ink/50">กำลังโหลดข้อมูล...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl border border-line bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>เลขพัสดุ *</label>
          <input
            required
            className={inputClass}
            value={form.asset_no}
            onChange={(e) => update("asset_no", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>เลขที่ฎีกา</label>
          <input
            className={inputClass}
            value={form.supreme_court_no}
            onChange={(e) => update("supreme_court_no", e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>ชื่อโครงการ *</label>
          <input
            required
            className={inputClass}
            value={form.activity_name}
            onChange={(e) => update("activity_name", e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>คำอธิบายเพิ่มเติม</label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>ประเภทพัสดุ</label>
          <select
            className={inputClass}
            value={form.asset_type_id}
            onChange={(e) => update("asset_type_id", e.target.value)}
          >
            <option value="">— เลือก —</option>
            {assetTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>ยอดเงิน (บาท) *</label>
          <input
            required
            type="number"
            step="0.01"
            className={inputClass}
            value={form.total_amount}
            onChange={(e) => update("total_amount", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>บริษัททำเบิกจ่าย</label>
          <select
            className={inputClass}
            value={form.company_id}
            onChange={(e) => update("company_id", e.target.value)}
          >
            <option value="">— เลือก —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>เบิกเงินให้ใคร</label>
          <select
            className={inputClass}
            value={form.payee_id}
            onChange={(e) => update("payee_id", e.target.value)}
          >
            <option value="">— เลือก —</option>
            {payees.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>สถานะการคืนเงิน</label>
          <select
            className={inputClass}
            value={form.return_status_id}
            onChange={(e) => update("return_status_id", e.target.value)}
          >
            <option value="">— เลือก —</option>
            {returnStatuses.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>วันที่เบิกจ่าย</label>
          <input
            type="date"
            className={inputClass}
            value={form.disbursement_date}
            onChange={(e) => update("disbursement_date", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>วันที่เงินโอนเข้า</label>
          <input
            type="date"
            className={inputClass}
            value={form.transferred_date}
            onChange={(e) => update("transferred_date", e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 border border-warn/30 bg-warn/5 px-3 py-2 font-mono text-xs text-warn">
          {isEdit ? "บันทึกการแก้ไขไม่สำเร็จ" : "บันทึกไม่สำเร็จ"}: {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="px-4 py-2 text-sm text-warn hover:underline disabled:opacity-50"
            >
              {deleting ? "กำลังลบ..." : "ลบรายการนี้"}
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <a href="/" className="px-4 py-2 text-sm text-ink/60 hover:text-ink">
            ยกเลิก
          </a>
          <button
            type="submit"
            disabled={submitting || deleting}
            className="bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "บันทึกรายการ"}
          </button>
        </div>
      </div>
    </form>
  );
}
