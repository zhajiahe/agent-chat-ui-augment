import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/Auth";
import { BottomLeftControls } from "@/components/BottomLeftControls";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI智能问数",
  description: "AI智能问数，让数据分析更简单",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <React.Suspense fallback={<div>Loading (layout)...</div>}>
            <NuqsAdapter>
              <div className="min-h-screen flex flex-col">
                <main className="flex-1 min-h-0">{children}</main>
                <BottomLeftControls />
              </div>
            </NuqsAdapter>
          </React.Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
