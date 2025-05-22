'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Settings, LogOut, ChevronsLeft, ChevronsRight, Users } from 'lucide-react'; // Using lucide-react for icons
import { logout, checkAuth } from '@/lib/auth';

export function Sidebar() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const authStatus = checkAuth();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div
      className={`bg-gray-800 text-white h-screen p-4 flex flex-col justify-between
                  ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out`}
    >
      <div>
        <Button
          onClick={toggleSidebar}
          className="mb-6 w-full flex items-center justify-center"
          variant="ghost"
        >
          {isCollapsed ? <ChevronsRight size={24} /> : <ChevronsLeft size={24} />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
        <nav>
          <ul>
            <li className="mb-3">
              <Link href="/" legacyBehavior>
                <a className="flex items-center p-2 hover:bg-gray-700 rounded-md">
                  <Home size={20} />
                  {!isCollapsed && <span className="ml-3">Chat</span>}
                </a>
              </Link>
            </li>
            <li className="mb-3">
              <Link href="/settings" legacyBehavior>
                <a className="flex items-center p-2 hover:bg-gray-700 rounded-md">
                  <Settings size={20} />
                  {!isCollapsed && <span className="ml-3">Settings</span>}
                </a>
              </Link>
            </li>
            {authStatus.isAuthenticated && authStatus.role === 'admin' && (
              <li className="mb-3">
                <Link href="/admin/user-management" legacyBehavior>
                  <a className="flex items-center p-2 hover:bg-gray-700 rounded-md">
                    <Users size={20} />
                    {!isCollapsed && <span className="ml-3">User Management</span>}
                  </a>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start p-2 hover:bg-gray-700"
          onClick={() => {
            logout();
            router.push('/login');
          }}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );
}
