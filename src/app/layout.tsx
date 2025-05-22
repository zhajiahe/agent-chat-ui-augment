'use client';

import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

// Metadata needs to be handled differently for client components.
// For now, we'll keep it here, but this might need adjustment if build errors occur.
// Typically, metadata is exported from server components or defined statically.
export const metadata: Metadata = {
  title: "Agent Chat",
  description: "Agent Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showSidebar = pathname !== '/login';

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="flex h-screen overflow-hidden">
          {showSidebar && <Sidebar />}
          <main className="flex-1 overflow-y-auto">
            <NuqsAdapter>{children}</NuqsAdapter>
          </main>
        </div>
      </body>
    </html>
  );
}
