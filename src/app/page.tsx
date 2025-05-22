"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth";

export default function DemoPage(): React.ReactNode {
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authenticated = checkAuth();
    if (authenticated) {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
    setIsLoadingAuth(false);
  }, [router]);

  if (isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-screen">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    // This case should ideally be handled by the redirect,
    // but as a fallback:
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
