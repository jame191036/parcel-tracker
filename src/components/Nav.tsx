"use client";

import { usePathname } from "next/navigation";
import { List, PlusCircle, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "รายการทั้งหมด", icon: List, exact: true },
  { href: "/new", label: "จดรายการใหม่", icon: PlusCircle, exact: false },
  { href: "/master", label: "จัดการข้อมูลหลัก", icon: Settings2, exact: false },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
