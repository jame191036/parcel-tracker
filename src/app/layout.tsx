import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ทะเบียนคุมพัสดุ",
  description: "ระบบจดเลขพัสดุและการเบิกจ่าย",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="font-body min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="mx-auto max-w-6xl px-6 py-10">
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
              </div>
            </header>
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
