import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nottura Admin Panel",
  description: "Internal operational panel for Nottura",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#121212] text-white antialiased selection:bg-white/20 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
