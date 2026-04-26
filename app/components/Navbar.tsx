'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

export default function Navbar({ cartCount, resetAll }: { cartCount: number; resetAll: () => void }) {
  const { isSignedIn } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="nav">
      {/* Logo */}
      <div className="nav-logo" onClick={resetAll}>
        ✚ <span>Medi<b style={{ color: "var(--mint)" }}>Ora</b></span>
      </div>

      {/* Desktop Navigation - Full display */}
      <div className="hidden md:flex items-center gap-3">
        {!isSignedIn ? (
          <SignInButton mode="modal">
            <button className="cart-btn">Sign In</button>
          </SignInButton>
        ) : (
          <>
            <Link href="/dashboard" className="cart-btn">👤 Dashboard</Link>
            <Link href="/orders" className="cart-btn">📦 Orders</Link>
            <Link href="/store" className="cart-btn">🏪 Store</Link>
            <UserButton />
          </>
        )}
        <button 
          className="cart-btn" 
          onClick={() => window.dispatchEvent(new CustomEvent('openCart'))}
        >
          🛒 Cart {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
      </div>

      {/* Mobile Three-Dot Menu */}
      <div className="md:hidden menu-container relative">
        {/* Three Dots Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
        >
          <svg className="w-6 h-6 text-ink" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="18" r="2" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-12 right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  🔐 Sign In
                </button>
              </SignInButton>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  👤 Dashboard
                </Link>
                <Link
                  href="/orders"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  📦 Orders
                </Link>
                <Link
                  href="/store"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🏪 Store
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <div className="px-4 py-2">
                  <UserButton />
                </div>
              </>
            )}
            <div className="border-t border-gray-100 my-1"></div>
            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openCart'));
                setIsMenuOpen(false);
              }}
            >
              🛒 Cart {cartCount > 0 && <span className="ml-auto bg-mint text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Always visible cart icon for mobile */}
      <button
        className="md:hidden cart-btn !px-3 ml-auto mr-2"
        onClick={() => window.dispatchEvent(new CustomEvent('openCart'))}
      >
        🛒 {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
      </button>
    </nav>
  );
}