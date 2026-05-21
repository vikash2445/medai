'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, ShoppingBag, Users, 
  FolderTree, CreditCard, Truck, Settings, 
  FileText, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Heart, Bell, Star, Menu, X
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  subItems?: NavItem[];
}

const navigation: NavItem[] = [
  {
    href: '/admin',
    icon: <LayoutDashboard size={18} />,
    label: 'Dashboard',
  },
  {
    href: '/admin/orders',
    icon: <ShoppingBag size={18} />,
    label: 'Orders',
    badge: 0, // Will be updated dynamically
  },
  {
    href: '/admin/customers',
    icon: <Users size={18} />,
    label: 'Customers',
  },
  {
    href: '/admin/products',
    icon: <Package size={18} />,
    label: 'Products',
  },
  {
    href: '/admin/categories',
    icon: <FolderTree size={18} />,
    label: 'Categories',
  },
  {
    href: '/admin/prescriptions',
    icon: <FileText size={18} />,
    label: 'Prescriptions',
    badge: 0,
  },
  {
    href: '/admin/settings',
    icon: <Settings size={18} />,
    label: 'Settings',
    subItems: [
      {
        href: '/admin/settings/payment',
        icon: <CreditCard size={16} />,
        label: 'Payments',
      },
      {
        href: '/admin/settings/shipping',
        icon: <Truck size={16} />,
        label: 'Shipping',
      },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ 
  isCollapsed = false, 
  onToggle,
  isMobileOpen = false,
  onMobileClose 
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [expandedItems, setExpandedItems] = useState<string[]>(['/admin/settings']);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingPrescriptionsCount, setPendingPrescriptionsCount] = useState(0);

  // Fetch pending counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        // Fetch pending orders count
        const ordersRes = await fetch('/api/admin/orders?status=pending&limit=1');
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setPendingOrdersCount(ordersData.pagination?.total || 0);
        }

        // Fetch pending prescriptions count
        const prescriptionsRes = await fetch('/api/admin/prescriptions?status=pending&limit=1');
        const prescriptionsData = await prescriptionsRes.json();
        if (prescriptionsData.success) {
          setPendingPrescriptionsCount(prescriptionsData.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    }

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update navigation badges
  const navWithBadges = navigation.map(item => {
    if (item.label === 'Orders') {
      return { ...item, badge: pendingOrdersCount };
    }
    if (item.label === 'Prescriptions') {
      return { ...item, badge: pendingPrescriptionsCount };
    }
    return item;
  });

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const toggleExpand = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.href);

    return (
      <div key={item.href}>
        <Link
          href={hasSubItems ? '#' : item.href}
          onClick={(e) => {
            if (hasSubItems) {
              e.preventDefault();
              toggleExpand(item.href);
            }
          }}
          className={`
            group flex items-center justify-between px-3 py-2.5 rounded-lg
            transition-all duration-200 cursor-pointer
            ${active 
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
            }
            ${depth > 0 ? 'ml-6' : ''}
          `}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <div className="flex items-center gap-3">
            <span className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs font-semibold
                  ${active 
                    ? 'bg-white text-green-600' 
                    : 'bg-green-600 text-white'
                  }
                `}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              
              {hasSubItems && (
                <ChevronRight 
                  size={14} 
                  className={`transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  } ${active ? 'text-white' : 'text-gray-500'}`}
                />
              )}
            </div>
          )}
        </Link>
        
        {hasSubItems && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.subItems!.map(subItem => renderNavItem(subItem, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Mobile sidebar overlay
  if (isMobileOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
        <aside className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 z-50
          transform transition-transform duration-300 lg:hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-white font-semibold">Mediora Admin</span>
              </div>
              <button
                onClick={onMobileClose}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navWithBadges.map(item => renderNavItem(item))}
            </nav>
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-white/5">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {session?.user?.email || 'admin@mediora.com'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <LogOut size={18} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-gray-900 shadow-xl
      transition-all duration-300 z-30 hidden lg:block
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`
          p-4 border-b border-gray-800 flex items-center
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            {!isCollapsed && (
              <span className="text-white font-semibold">Mediora Admin</span>
            )}
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navWithBadges.map(item => renderNavItem(item))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className={`
            flex items-center gap-3 mb-3 p-2 rounded-lg bg-white/5
            ${isCollapsed ? 'justify-center' : ''}
          `}>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {session?.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email || 'admin@mediora.com'}
                </p>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          )}
          
          {isCollapsed && (
            <button
              onClick={handleSignOut}
              className="w-full flex justify-center px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}