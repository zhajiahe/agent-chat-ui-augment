"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/providers/Auth";
import { SettingsDialog } from "@/components/settings";

export default function Header() {
  const { user } = useAuth();
  return (
    <header className="h-12 border-b flex items-center justify-between px-4">
      <Link href="/" className="font-medium">AI智能问数</Link>
      <div className="flex items-center gap-3">
        {user ? <SettingsDialog /> : null}
      </div>
    </header>
  );
}


