import type { Metadata } from "next";
import "../globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/Auth";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI智能问数",
  description: "AI智能问数，让数据分析更简单",
};

export default function AuthLayout({
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
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                {children}
              </div>
            </NuqsAdapter>
          </React.Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}