import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private Archive Starter",
  description: "A Next.js and Supabase starter for private document archives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
