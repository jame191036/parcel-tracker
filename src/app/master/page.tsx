"use client";

import { useState } from "react";
import MasterDataManager from "@/components/MasterDataManager";

const tabs = [
  { key: "asset_type", label: "ประเภทพัสดุ", nameField: "asset_type_name", idField: "asset_type_id", nameLabel: "ชื่อประเภทพัสดุ" },
  { key: "company", label: "บริษัท", nameField: "company_name", idField: "company_id", nameLabel: "ชื่อบริษัท" },
  { key: "payee", label: "ผู้รับเงิน", nameField: "payee_name", idField: "payee_id", nameLabel: "ชื่อผู้รับเงิน" },
  { key: "return_status", label: "สถานะการคืนเงิน", nameField: "return_status_name", idField: "return_status_id", nameLabel: "ชื่อสถานะ" },
] as const;

export default function MasterDataPage() {
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("asset_type");
  const current = tabs.find((t) => t.key === active)!;

  return (
    <main>
      <h2 className="mb-6 font-display text-lg font-medium text-foreground">จัดการข้อมูลหลัก</h2>

      <div className="mb-6 flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 text-sm font-medium ${
              active === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <MasterDataManager
        key={current.key}
        tableName={current.key}
        idField={current.idField}
        nameField={current.nameField}
        nameLabel={current.nameLabel}
      />
    </main>
  );
}