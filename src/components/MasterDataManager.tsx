"use client";

import { useEffect, useState, FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type MasterRow = {
  [key: string]: string | boolean | null | undefined;
  description: string | null;
  is_active: boolean;
  is_delete: boolean;
  create_date: string;
};

type Props = {
  tableName: "asset_type" | "company" | "payee" | "return_status";
  idField: string;
  nameField: string;
  nameLabel: string;
};

export default function MasterDataManager({ tableName, idField, nameField, nameLabel }: Props) {
  // component นี้ทำงานกับ 4 master table แบบ generic (tableName + ชื่อคอลัมน์เป็น dynamic)
  // type generic ของ supabase-js ตรวจ union ของหลายตารางไม่ได้ จึงใช้ client แบบไม่ผูก schema
  // เฉพาะที่นี่ — runtime เหมือนเดิมทุกอย่าง แค่ปิด type-check ของ query dynamic
  const supabase = createClient() as unknown as SupabaseClient;

  const [rows, setRows] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MasterRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadRows() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("is_delete", false)
      .order("create_date", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setRows((data as MasterRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);

    const { error } = await supabase.from(tableName).insert({
      [nameField]: newName.trim(),
      description: newDescription.trim() || null,
    });

    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    setNewDescription("");
    loadRows();
  }

  function startEdit(row: MasterRow) {
    setEditingId(row[idField] as string);
    setEditName((row[nameField] as string) ?? "");
    setEditDescription(row.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setSavingEdit(true);
    setError(null);

    const { error } = await supabase
      .from(tableName)
      .update({
        [nameField]: editName.trim(),
        description: editDescription.trim() || null,
      })
      .eq(idField, id);

    setSavingEdit(false);

    if (error) {
      setError(error.message);
      return;
    }
    cancelEdit();
    loadRows();
  }

  async function toggleActive(row: MasterRow) {
    setError(null);
    const { error } = await supabase
      .from(tableName)
      .update({ is_active: !row.is_active })
      .eq(idField, row[idField] as string);

    if (error) {
      setError(error.message);
      return;
    }
    loadRows();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    const { error } = await supabase
      .from(tableName)
      .update({ is_delete: true })
      .eq(idField, deleteTarget[idField] as string);

    setDeleting(false);

    if (error) {
      setDeleteTarget(null);
      setError(error.message);
      return;
    }
    setDeleteTarget(null);
    loadRows();
  }

  return (
    <div>
      <Card className="mb-6 p-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1 space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {nameLabel} *
            </Label>
            <Input required value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="min-w-[220px] flex-1 space-y-1">
            <Label className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              คำอธิบาย
            </Label>
            <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          </div>
          <Button type="submit" disabled={adding}>
            <Plus className="h-4 w-4" />
            {adding ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </Button>
        </form>
      </Card>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
          เกิดข้อผิดพลาด: {error}
        </p>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          ยังไม่มีข้อมูล
        </p>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead>{nameLabel}</TableHead>
                <TableHead>คำอธิบาย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const id = row[idField] as string;
                const isEditing = editingId === id;
                return (
                  <TableRow key={id}>
                    {isEditing ? (
                      <>
                        <TableCell>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(id)}
                              disabled={savingEdit}
                            >
                              บันทึก
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              ยกเลิก
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{row[nameField] as string}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.description || "—"}
                        </TableCell>
                        <TableCell>
                          {row.is_active ? (
                            <Badge variant="success">ใช้งาน</Badge>
                          ) : (
                            <Badge variant="secondary">ปิดใช้งาน</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                              แก้ไข
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleActive(row)}
                              className="text-muted-foreground"
                            >
                              {row.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(row)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              ลบ
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              ต้องการลบ &quot;{deleteTarget ? (deleteTarget[nameField] as string) : ""}&quot;
              ใช่หรือไม่? รายการที่เคยอ้างอิงอยู่แล้วจะไม่ถูกกระทบ แต่จะไม่แสดงในลิสต์นี้อีก
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "กำลังลบ..." : "ลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
