import type { Metadata } from "next";
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
  // TODO(Arya): Bungkus layout utama dengan AppShell / Sidebar / Header / tema dark mode (#121212, #090A33, #FFFFFF).
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
