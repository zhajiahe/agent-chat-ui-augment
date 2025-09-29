"use client";

import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="h-12 border-b flex items-center justify-between px-4 bg-white">
      <Link href="/" className="font-medium text-lg text-gray-900">
        AI智能问数
      </Link>
    </header>
  );
}


