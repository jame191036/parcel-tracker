import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
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
            <AppHeader />
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
