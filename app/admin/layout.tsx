import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// ── Sidebar links ─────────────────────────────────────────────────────────────
const NAV = [
  { href: '/admin',             icon: '📊', label: 'Dashboard'  },
  { href: '/admin/orders',      icon: '📦', label: 'Orders'     },
  { href: '/admin/customers',   icon: '👥', label: 'Customers'  },  // ← ADD THIS
  { href: '/admin/categories',  icon: '📁', label: 'Categories' }, // ← ADD THIS
  { href: '/admin/settings',    icon: '⚙️', label: 'Settings'   },  // ← Add this
  { href: '/admin/medicines',   icon: '💊', label: 'Medicines'  },
  { href: '/admin/products',    icon: '🏪', label: 'Products'   },
    { href: '/admin/reviews',     icon: '⭐', label: 'Reviews'    },
    { href: '/admin/coupons',     icon: '🏷️', label: 'Coupons'    },
  { href: '/admin/banners',     icon: '🖼️', label: 'Banners'    },
  { href: '/admin/settings/payment',      icon: '💳', label: 'Payments'   },
  { href: '/admin/settings/shipping',     icon: '🚚', label: 'Shipping'   },
  { href: '/admin/prescriptions',icon:'📄', label: 'Prescriptions' },
];

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId || (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(userId))) {
    redirect('/');
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --admin-bg:      #0d1117;
          --admin-surface: #161b22;
          --admin-border:  #21262d;
          --admin-mint:    #0fa381;
          --admin-mint-lt: rgba(15,163,129,0.12);
          --admin-text:    #e6edf3;
          --admin-muted:   #8b949e;
          --admin-red:     #d64040;
          --admin-gold:    #f0b429;
          --admin-blue:    #3b82f6;
          --admin-purple:  #8b5cf6;
          --admin-w:       240px;
        }

        body { font-family: 'Outfit', sans-serif; background: var(--admin-bg); color: var(--admin-text); }

        .adm-root { display: flex; min-height: 100vh; }

        /* ── SIDEBAR ── */
        .adm-sidebar {
          width: var(--admin-w);
          background: var(--admin-surface);
          border-right: 1px solid var(--admin-border);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 100; overflow-y: auto;
        }
        .adm-sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--admin-border);
        }
        .adm-logo-wrap {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .adm-logo-box {
          width: 36px; height: 36px; border-radius: 9px;
          background: var(--admin-mint);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 1.1rem; font-weight: 900; flex-shrink: 0;
        }
        .adm-logo-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.25rem; color: var(--admin-text);
        }
        .adm-logo-badge {
          display: block; font-size: 0.6rem;
          color: var(--admin-mint); font-weight: 600;
          text-transform: uppercase; letter-spacing: 1.5px;
          margin-top: 2px;
        }

        .adm-nav { padding: 16px 12px; flex: 1; }
        .adm-nav-section {
          font-size: 0.62rem; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: var(--admin-muted);
          padding: 0 8px; margin-bottom: 6px; margin-top: 20px;
        }
        .adm-nav-section:first-child { margin-top: 0; }

        .adm-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          text-decoration: none; font-size: 0.875rem; font-weight: 500;
          color: var(--admin-muted); transition: all 0.18s;
          margin-bottom: 2px;
        }
        .adm-nav-link:hover { background: var(--admin-mint-lt); color: var(--admin-text); }
        .adm-nav-link.active {
          background: var(--admin-mint-lt);
          color: var(--admin-mint);
          font-weight: 600;
        }
        .adm-nav-icon { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }

        /* Bottom links */
        .adm-sidebar-footer {
          border-top: 1px solid var(--admin-border);
          padding: 16px 12px;
        }
        .adm-footer-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          text-decoration: none; font-size: 0.85rem;
          color: var(--admin-muted); transition: all 0.18s; margin-bottom: 2px;
        }
        .adm-footer-link:hover { background: rgba(255,255,255,0.05); color: var(--admin-text); }

        /* ── MAIN ── */
        .adm-main {
          margin-left: var(--admin-w);
          flex: 1; display: flex; flex-direction: column;
        }

        .adm-topbar {
          background: var(--admin-surface);
          border-bottom: 1px solid var(--admin-border);
          height: 56px; padding: 0 28px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
        }
        .adm-topbar-title {
          font-size: 0.92rem; font-weight: 600; color: var(--admin-text);
        }
        .adm-topbar-right { display: flex; align-items: center; gap: 12px; }
        .adm-topbar-pill {
          background: var(--admin-mint-lt);
          border: 1px solid rgba(15,163,129,0.25);
          color: var(--admin-mint);
          font-size: 0.72rem; font-weight: 700;
          padding: 4px 12px; border-radius: 50px; letter-spacing: 0.5px;
        }
        .adm-topbar-live {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.72rem; color: var(--admin-muted);
        }
        .adm-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--admin-mint);
          animation: admBlink 1.5s ease-in-out infinite;
        }
        @keyframes admBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .adm-content { flex: 1; padding: 28px; overflow-y: auto; }

        /* ── RESPONSIVE (collapse sidebar on mobile) ── */
        @media (max-width: 768px) {
          .adm-sidebar { transform: translateX(-100%); }
          .adm-main { margin-left: 0; }
          .adm-content { padding: 16px; }
        }
      `}</style>

      <div className="adm-root">
        {/* ── SIDEBAR ── */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-logo">
            <Link href="/admin" className="adm-logo-wrap">
              <div className="adm-logo-box">✚</div>
              <div>
                <div className="adm-logo-name">Mediora</div>
                <span className="adm-logo-badge">Admin Panel</span>
              </div>
            </Link>
          </div>

          <nav className="adm-nav">
            <div className="adm-nav-section">Main</div>
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="adm-nav-link">
                <span className="adm-nav-icon">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="adm-sidebar-footer">
            <Link href="/" className="adm-footer-link">
              <span className="adm-nav-icon">🏠</span> View Site
            </Link>
            <Link href="/store" className="adm-footer-link">
              <span className="adm-nav-icon">🏪</span> Visit Store
            </Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="adm-main">
          <div className="adm-topbar">
            <span className="adm-topbar-title">Mediora Admin</span>
            <div className="adm-topbar-right">
              <div className="adm-topbar-live">
                <div className="adm-live-dot" />
                Live
              </div>
              <span className="adm-topbar-pill">ADMIN</span>
            </div>
          </div>
          <div className="adm-content">{children}</div>
        </main>
      </div>
    </>
  );
}