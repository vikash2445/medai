'use client';

import Link from 'next/link';
import { Heart, Shield, HelpCircle } from 'lucide-react';

interface AdminFooterProps {
  className?: string;
}

export default function AdminFooter({ className = '' }: AdminFooterProps) {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Orders', href: '/admin/orders' },
      { label: 'Products', href: '/admin/products' },
      { label: 'Customers', href: '/admin/customers' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API Status', href: '/status' },
      { label: 'Contact Support', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  };

  return (
    <footer className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Mediora Admin
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Complete healthcare and pharmacy management solution for modern businesses.
            </p>
            
          </div>

          {/* Platform links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              {footerLinks.platform.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <span>© {currentYear} Mediora. All rights reserved.</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/admin/status"
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                System Online
              </Link>
              
              <Link
                href="/admin/version"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                v2.0.0
              </Link>
              
              <Link
                href="/admin/security"
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <Shield size={12} />
                Security
              </Link>
              
              <Link
                href="/help"
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                <HelpCircle size={12} />
                Help
              </Link>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            <span>Made with </span>
            <Heart size={10} className="inline text-red-500" />
            <span> for better healthcare management</span>
          </div>
        </div>
      </div>
    </footer>
  );
}