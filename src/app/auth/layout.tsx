import type { Metadata } from "next";
import React from "react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {children}
    </div>
  );
}