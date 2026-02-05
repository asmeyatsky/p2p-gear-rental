'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserGroupIcon,
  ShoppingBagIcon,
  CalendarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Gear', href: '/admin/gear', icon: ShoppingBagIcon },
  { name: 'Rentals', href: '/admin/rentals', icon: CalendarIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-purple-400" />
                <span className="ml-2 text-xl font-bold text-white">Admin Panel</span>
              </div>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
                      } mr-3 h-6 w-6 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-700 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}