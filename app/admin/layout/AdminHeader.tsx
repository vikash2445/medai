'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';  // ← Clerk use karo, NextAuth nahi
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, Bell, Search, User, Settings, LogOut, 
  Moon, Sun, ChevronDown, HelpCircle
} from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function AdminHeader({ onMenuClick, isMobileMenuOpen }: AdminHeaderProps) {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    const titles: Record<string, string> = {
      'admin': 'Dashboard',
      'orders': 'Orders',
      'customers': 'Customers',
      'products': 'Products',
      'categories': 'Categories',
      'prescriptions': 'Prescriptions',
      'settings': 'Settings',
      'payment': 'Payment Settings',
      'shipping': 'Shipping Settings',
    };
    return titles[path || 'admin'] || 'Admin Panel';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/admin/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {getPageTitle()}
            </h1>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, products, customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </form>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
              <Bell size={18} />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.fullName || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {user?.primaryEmailAddress?.emailAddress || 'admin@mediora.com'}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/admin/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={14} />
                        Profile
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={14} />
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden py-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}