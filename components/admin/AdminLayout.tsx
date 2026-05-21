'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Package, Pill, ShoppingBag, Users, Tag,
  Star, Image, Layers, MapPin, FileText, Settings, BarChart3,
  Bell, ChevronRight, Menu, X
} from 'lucide-react'
import { useState, ReactNode } from 'react'
import clsx from 'clsx'

const NAV = [
  { section: 'Overview', items: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
  { section: 'Catalog', items: [
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/medicines', label: 'Medicines', icon: Pill },
    { href: '/admin/combos', label: 'Combo Offers', icon: Layers },
    { href: '/admin/banners', label: 'Banners', icon: Image },
  ]},
  { section: 'Orders', items: [
    { href: '/admin/orders', label: 'All Orders', icon: ShoppingBag, badge: 'orders' },
    { href: '/admin/tracking', label: 'Tracking', icon: MapPin },
  ]},
  { section: 'Customers', items: [
    { href: '/admin/users', label: 'Customers', icon: Users },
    { href: '/admin/prescriptions', label: 'Prescriptions', icon: FileText },
  ]},
  { section: 'Marketing', items: [
    { href: '/admin/coupons', label: 'Coupons', icon: Tag },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
  ]},
  { section: 'System', items: [
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]},
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-56 bg-slate-900 flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
            <Pill size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Mediora</div>
            <div className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider">Admin Panel</div>
          </div>
          <button className="ml-auto lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {NAV.map(group => (
            <div key={group.section}>
              <div className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all group',
                        active
                          ? 'bg-green-500/15 text-green-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      )}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight size={12} className="text-green-500" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5">
           <UserButton
  appearance={{
    elements: {
      avatarBox: 'h-9 w-9'
    }
  }}
/>
            <div className="flex-1 min-w-0">
              <div className="text-slate-300 text-xs font-semibold truncate">Admin</div>
              <div className="text-slate-500 text-[10px]">mediora.fit</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 flex-shrink-0">
          <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <a
            href="https://mediora.fit"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-green-600 transition-colors hidden sm:block"
          >
            ↗ View Store
          </a>
          <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <UserButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
