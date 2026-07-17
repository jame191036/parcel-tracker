"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Nav from "@/components/Nav";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // หน้า login ไม่ต้องมี header
  if (pathname.startsWith("/login")) return null;

  return (
    <header className="mb-10 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          ทะเบียนคุม
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          รายการเบิกจ่ายพัสดุ
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Nav />
        <ThemeToggle />
        {email && (
          <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              {email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
