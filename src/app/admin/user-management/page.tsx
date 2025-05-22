'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@/lib/auth';

export default function UserManagementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const authStatus = checkAuth();
    if (authStatus.isAuthenticated && authStatus.role === 'admin') {
      setIsAuthorized(true);
    } else {
      // If not authenticated or not an admin, redirect to login.
      // If already on login page (e.g. checkAuth redirects there), this might be redundant but safe.
      router.push('/login');
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading access check...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    // This state might be briefly visible if the redirect is slow,
    // or if the router.push hasn't completed the navigation yet.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Access Denied. You do not have permission to view this page. Redirecting...</p>
      </div>
    );
  }

  // Only render the actual page content if authorized
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <p>Welcome to the User Management Dashboard. Only admins can see this.</p>
      {/* Further user management UI will go here */}
    </div>
  );
}
