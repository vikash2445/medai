'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Profile { 
  full_name: string; 
  email: string; 
  phone: string; 
}

interface Address {
  id: string; 
  address_line1: string; 
  address_line2: string;
  city: string; 
  state: string; 
  pincode: string; 
  phone: string; 
  is_default: boolean;
}

interface FavoriteMedicine {
  id: string; 
  medicine_id: number; 
  medicine_name: string;
  medicine_data: any; 
  created_at: string;
}

interface Prescription {
  id: string; 
  image_url: string; 
  extracted_text: string;
  medicines: any; 
  created_at: string;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mint: #0fa381;
    --mint-light: #e6f7f3;
    --mint-dark: #0a7860;
    --mint-mid: #12c49a;
    --cream: #faf9f6;
    --stone: #f0ede7;
    --ink: #1a1a2e;
    --ink-soft: #4a4a6a;
    --ink-muted: #8888a8;
    --white: #ffffff;
    --red: #e05c5c;
    --red-light: #fdf0f0;
    --border: #ebe8e2;
    --shadow-sm: 0 1px 3px rgba(26,26,46,.06), 0 1px 2px rgba(26,26,46,.04);
    --shadow-md: 0 4px 16px rgba(15,163,129,.10), 0 1px 4px rgba(26,26,46,.06);
    --shadow-lg: 0 12px 40px rgba(15,163,129,.15), 0 4px 12px rgba(26,26,46,.08);
    --radius: 16px;
    --radius-sm: 10px;
  }

  body { font-family: 'Outfit', sans-serif; background: var(--cream); color: var(--ink); }

  .dash-root { min-height: 100vh; background: var(--cream); }

  .topbar {
    position: sticky; top: 0; z-index: 50;
    background: rgba(250,249,246,.92); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 68px;
    box-shadow: var(--shadow-sm);
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .topbar-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, var(--mint), var(--mint-mid));
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; color: white; font-weight: 700;
    box-shadow: 0 2px 8px rgba(15,163,129,.35);
    flex-shrink: 0;
  }
  .topbar-title { font-family: 'DM Serif Display', serif; font-size: 1.3rem; color: var(--ink); }
  .topbar-sub { font-size: .78rem; color: var(--ink-muted); margin-top: 1px; }
  .topbar-back {
    display: flex; align-items: center; gap: 6px;
    color: var(--mint-dark); font-size: .9rem; font-weight: 600;
    text-decoration: none; padding: 8px 16px; border-radius: 40px;
    background: var(--mint-light); transition: all .2s;
  }
  .topbar-back:hover { background: var(--mint); color: white; }

  .dash-body { max-width: 1200px; margin: 0 auto; padding: 36px 40px 60px; display: flex; gap: 28px; }

  .sidebar { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
  .sidebar-card {
    background: white; border-radius: var(--radius);
    border: 1px solid var(--border); overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .sidebar-hero {
    padding: 24px 20px;
    background: linear-gradient(135deg, var(--mint) 0%, var(--mint-mid) 100%);
    position: relative; overflow: hidden;
  }
  .sidebar-hero::before {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(255,255,255,.12);
  }
  .sidebar-hero::after {
    content: ''; position: absolute; bottom: -20px; left: 10px;
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(255,255,255,.08);
  }
  .sidebar-user-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(255,255,255,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; color: white; margin-bottom: 12px;
    border: 2px solid rgba(255,255,255,.4);
    position: relative; z-index: 1;
  }
  .sidebar-user-name {
    font-family: 'DM Serif Display', serif; font-size: 1.1rem;
    color: white; margin-bottom: 3px; position: relative; z-index: 1;
  }
  .sidebar-user-email { font-size: .75rem; color: rgba(255,255,255,.75); position: relative; z-index: 1; }

  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; cursor: pointer;
    border: none; background: none; width: 100%;
    text-align: left; transition: all .18s;
    border-left: 3px solid transparent;
  }
  .nav-item:not(:last-child) { border-bottom: 1px solid #f5f3ef; }
  .nav-item.active {
    background: var(--mint-light);
    border-left-color: var(--mint);
  }
  .nav-item:hover:not(.active) { background: #faf8f4; }
  .nav-icon {
    width: 36px; height: 36px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; flex-shrink: 0;
  }
  .nav-item.active .nav-icon { background: var(--mint); }
  .nav-item:not(.active) .nav-icon { background: var(--stone); }
  .nav-label { font-weight: 600; font-size: .9rem; color: var(--ink); }
  .nav-item.active .nav-label { color: var(--mint-dark); }
  .nav-desc { font-size: .72rem; color: var(--ink-muted); margin-top: 1px; }
  .nav-badge {
    margin-left: auto; background: var(--mint); color: white;
    border-radius: 40px; font-size: .68rem; font-weight: 700;
    padding: 2px 8px; min-width: 22px; text-align: center;
  }

  .sidebar-stats { padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-pill {
    background: var(--stone); border-radius: var(--radius-sm);
    padding: 10px 12px; text-align: center;
  }
  .stat-num { font-family: 'DM Serif Display', serif; font-size: 1.4rem; color: var(--mint-dark); }
  .stat-lbl { font-size: .68rem; color: var(--ink-muted); margin-top: 2px; text-transform: uppercase; letter-spacing: .05em; }

  .main-content { flex: 1; min-width: 0; }

  .section-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border);
  }
  .section-title-wrap { display: flex; align-items: center; gap: 14px; }
  .section-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--mint-light); display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem;
  }
  .section-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: var(--ink); }
  .section-sub { font-size: .82rem; color: var(--ink-muted); margin-top: 3px; }

  .content-card {
    background: white; border-radius: var(--radius);
    border: 1px solid var(--border); padding: 28px;
    box-shadow: var(--shadow-sm);
  }

  .form-grid { display: grid; gap: 20px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label {
    font-size: .78rem; font-weight: 700; color: var(--ink-soft);
    text-transform: uppercase; letter-spacing: .07em;
  }
  .form-input {
    padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    font-family: 'Outfit', sans-serif; font-size: .95rem; color: var(--ink);
    background: var(--cream); outline: none; transition: border-color .2s, box-shadow .2s;
  }
  .form-input:focus { border-color: var(--mint); box-shadow: 0 0 0 3px rgba(15,163,129,.12); }
  .btn-save {
    background: var(--mint); color: white; border: none;
    border-radius: var(--radius-sm); padding: 12px 28px;
    font-family: 'Outfit', sans-serif; font-size: .95rem; font-weight: 700;
    cursor: pointer; transition: all .2s; margin-top: 4px;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-save:hover { background: var(--mint-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,163,129,.3); }

  .btn-add {
    background: var(--mint); color: white; border: none;
    border-radius: 40px; padding: 10px 20px;
    font-family: 'Outfit', sans-serif; font-size: .88rem; font-weight: 600;
    cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 6px;
  }
  .btn-add:hover { background: var(--mint-dark); }

  .address-grid { display: grid; gap: 14px; }
  .address-card {
    background: white; border-radius: var(--radius);
    border: 1.5px solid var(--border); padding: 20px 22px;
    transition: all .22s; position: relative; overflow: hidden;
  }
  .address-card::before {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
    background: transparent; transition: background .2s;
  }
  .address-card:hover { border-color: rgba(15,163,129,.4); box-shadow: var(--shadow-md); }
  .address-card:hover::before { background: var(--mint); }
  .address-card.default-card { border-color: rgba(15,163,129,.35); }
  .address-card.default-card::before { background: var(--mint); }

  .default-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--mint-light); color: var(--mint-dark);
    border-radius: 40px; padding: 2px 10px; font-size: .72rem; font-weight: 700;
    margin-bottom: 10px; text-transform: uppercase; letter-spacing: .05em;
  }
  .address-line1 { font-weight: 600; font-size: .95rem; color: var(--ink); margin-bottom: 4px; }
  .address-city { font-size: .88rem; color: var(--ink-soft); margin-bottom: 4px; }
  .address-phone { font-size: .8rem; color: var(--ink-muted); }
  .address-actions { display: flex; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--stone); }
  .btn-edit {
    background: var(--mint-light); color: var(--mint-dark); border: none;
    border-radius: 8px; padding: 6px 16px; font-family: 'Outfit', sans-serif;
    font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s;
  }
  .btn-edit:hover { background: var(--mint); color: white; }
  .btn-delete {
    background: var(--red-light); color: var(--red); border: none;
    border-radius: 8px; padding: 6px 16px; font-family: 'Outfit', sans-serif;
    font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s;
  }
  .btn-delete:hover { background: var(--red); color: white; }

  .empty-state {
    padding: 60px 40px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--stone); display: flex; align-items: center; justify-content: center;
    font-size: 2rem; margin-bottom: 4px;
  }
  .empty-title { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--ink); }
  .empty-sub { font-size: .88rem; color: var(--ink-muted); }
  .empty-link {
    color: var(--mint); text-decoration: none; font-weight: 600; font-size: .9rem;
    display: flex; align-items: center; gap: 4px; margin-top: 4px;
  }
  .empty-link:hover { color: var(--mint-dark); }

  .fav-grid { display: grid; gap: 12px; }
  .fav-card {
    background: white; border-radius: var(--radius);
    border: 1.5px solid var(--border); padding: 18px 22px;
    display: flex; align-items: center; gap: 16px;
    transition: all .22s;
  }
  .fav-card:hover { border-color: rgba(15,163,129,.3); box-shadow: var(--shadow-md); transform: translateX(3px); }
  .fav-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--mint-light); display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; flex-shrink: 0;
  }
  .fav-name { font-weight: 600; font-size: .95rem; color: var(--ink); }
  .fav-date { font-size: .78rem; color: var(--ink-muted); margin-top: 2px; }
  .btn-remove {
    margin-left: auto; background: var(--red-light); color: var(--red); border: none;
    border-radius: 8px; padding: 7px 14px; font-family: 'Outfit', sans-serif;
    font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s; flex-shrink: 0;
  }
  .btn-remove:hover { background: var(--red); color: white; }

  .rx-grid { display: grid; gap: 14px; }
  .rx-card {
    background: white; border-radius: var(--radius);
    border: 1.5px solid var(--border); padding: 20px 22px;
    display: flex; gap: 18px; transition: all .22s;
  }
  .rx-card:hover { border-color: rgba(15,163,129,.3); box-shadow: var(--shadow-md); }
  .rx-img {
    width: 88px; height: 88px; border-radius: 12px; object-fit: cover;
    border: 1px solid var(--border); flex-shrink: 0;
  }
  .rx-date { font-size: .78rem; color: var(--ink-muted); margin-bottom: 6px; }
  .rx-text { font-size: .85rem; color: var(--ink-soft); line-height: 1.55;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .rx-meds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .rx-med-tag {
    background: var(--mint-light); color: var(--mint-dark); border-radius: 40px;
    padding: 3px 10px; font-size: .73rem; font-weight: 600;
  }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(26,26,46,.5);
    z-index: 200; display: flex; align-items: center; justify-content: center;
    padding: 20px; backdrop-filter: blur(4px);
    animation: fadeIn .18s;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal-box {
    background: white; border-radius: 22px;
    width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
    box-shadow: var(--shadow-lg); animation: slideUp .22s;
  }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-header {
    padding: 24px 28px 0; display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .modal-title { font-family: 'DM Serif Display', serif; font-size: 1.35rem; color: var(--ink); }
  .modal-close {
    background: var(--stone); border: none; width: 32px; height: 32px;
    border-radius: 50%; cursor: pointer; font-size: .9rem; color: var(--ink-soft);
    display: flex; align-items: center; justify-content: center; transition: all .2s;
  }
  .modal-close:hover { background: var(--ink); color: white; }
  .modal-body { padding: 0 28px 28px; display: flex; flex-direction: column; gap: 14px; }
  .modal-input {
    width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
    font-family: 'Outfit', sans-serif; font-size: .92rem; color: var(--ink);
    background: var(--cream); outline: none; transition: border-color .2s;
  }
  .modal-input:focus { border-color: var(--mint); }
  .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-checkbox { display: flex; align-items: center; gap: 8px; font-size: .9rem; color: var(--ink-soft); cursor: pointer; }
  .btn-submit {
    width: 100%; background: var(--mint); color: white; border: none;
    border-radius: var(--radius-sm); padding: 13px;
    font-family: 'Outfit', sans-serif; font-size: .95rem; font-weight: 700;
    cursor: pointer; transition: all .2s; margin-top: 4px;
  }
  .btn-submit:hover { background: var(--mint-dark); }

  @media(max-width: 768px) {
    .topbar { padding: 0 20px; }
    .dash-body { flex-direction: column; padding: 20px; gap: 20px; }
    .sidebar { width: 100%; }
    .sidebar-stats { grid-template-columns: repeat(4, 1fr); }
    .modal-grid { grid-template-columns: 1fr; }
  }
`;

export default function DashboardPage() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile>({ full_name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMedicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (isSignedIn && userId) {
      fetchAll();
    }
  }, [isSignedIn, userId]);

  const fetchAll = async () => {
    await Promise.all([fetchProfile(), fetchAddresses(), fetchFavorites(), fetchPrescriptions()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setProfile({
          full_name: data.full_name || user?.fullName || '',
          email: data.email || user?.emailAddresses[0]?.emailAddress || '',
          phone: data.phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const updateProfile = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      setSaveStatus(res.ok ? 'saved' : 'idle');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      setSaveStatus('idle');
    }
  };

  const fetchAddresses = async () => {
    try { 
      const res = await fetch('/api/user/addresses'); 
      if (res.ok) setAddresses(await res.json()); 
    } catch (err) { console.error('Error fetching addresses:', err); }
  };
  
  const fetchFavorites = async () => {
    try { 
      const res = await fetch('/api/user/favorites'); 
      if (res.ok) setFavorites(await res.json()); 
    } catch (err) { console.error('Error fetching favorites:', err); }
  };
  
  const fetchPrescriptions = async () => {
    try { 
      const res = await fetch('/api/user/prescriptions'); 
      if (res.ok) setPrescriptions(await res.json()); 
    } catch (err) { console.error('Error fetching prescriptions:', err); }
  };

  const removeFromFavorites = async (id: string) => {
    try {
      await fetch(`/api/user/favorites?id=${id}`, { method: 'DELETE' });
      await fetchFavorites();
    } catch (err) { console.error('Error removing favorite:', err); }
  };

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.firstName?.[0] || '?');

  if (!isSignedIn) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
          <div className="content-card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '48px 36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', marginBottom: 10 }}>Sign In Required</h1>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 24, fontSize: '.95rem' }}>Please sign in to access your dashboard</p>
            <Link href="/" className="btn-save" style={{ display: 'inline-flex', textDecoration: 'none' }}>← Back to Home</Link>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '3px solid var(--mint-light)', borderTopColor: 'var(--mint)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--ink-muted)' }}>Loading your dashboard…</p>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  const navItems = [
    { id: 'profile', label: 'Profile', icon: '👤', desc: 'Personal information', count: null },
    { id: 'addresses', label: 'Addresses', icon: '📍', desc: 'Saved delivery spots', count: addresses.length },
    { id: 'favorites', label: 'Favourites', icon: '❤️', desc: 'Liked medicines', count: favorites.length },
    { id: 'prescriptions', label: 'Prescriptions', icon: '📄', desc: 'Uploaded prescriptions', count: prescriptions.length },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="dash-root">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-avatar">{initials}</div>
            <div>
              <div className="topbar-title">My Dashboard</div>
              <div className="topbar-sub">{profile.full_name || user?.fullName || 'Welcome back!'}</div>
            </div>
          </div>
          <Link href="/" className="topbar-back">← Back to Store</Link>
        </header>

        <div className="dash-body">
          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-hero">
                <div className="sidebar-user-avatar">{initials}</div>
                <div className="sidebar-user-name">{profile.full_name || user?.fullName || 'Your Account'}</div>
                <div className="sidebar-user-email">{profile.email || user?.emailAddresses[0]?.emailAddress || ''}</div>
              </div>

              <div className="sidebar-stats">
                {[
                  { num: addresses.length, lbl: 'Addresses' },
                  { num: favorites.length, lbl: 'Favourites' },
                  { num: prescriptions.length, lbl: 'Rx Uploads' },
                  { num: 0, lbl: 'Orders' },
                ].map(s => (
                  <div key={s.lbl} className="stat-pill">
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              <nav>
                {navItems.map(item => (
                  <button 
                    key={item.id} 
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div className="nav-icon">{item.icon}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div className="nav-label">{item.label}</div>
                      <div className="nav-desc">{item.desc}</div>
                    </div>
                    {item.count !== null && item.count > 0 && (
                      <span className="nav-badge">{item.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="main-content">
            {activeTab === 'profile' && (
              <div className="content-card">
                <div className="section-header" style={{ marginBottom: 28 }}>
                  <div className="section-title-wrap">
                    <div className="section-icon">👤</div>
                    <div>
                      <div className="section-title">Profile Information</div>
                      <div className="section-sub">Update your personal details</div>
                    </div>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="Enter your full name"
                      value={profile.full_name}
                      onChange={e => setProfile({ ...profile, full_name: e.target.value })} 
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email Address</label>
                    <input 
                      className="form-input" 
                      type="email" 
                      placeholder="your@email.com"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })} 
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Phone Number</label>
                    <input 
                      className="form-input" 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                    />
                  </div>
                  <div>
                    <button className="btn-save" onClick={updateProfile} disabled={saveStatus === 'saving'}>
                      {saveStatus === 'saving' ? '⏳ Saving…' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <>
                <div className="content-card" style={{ marginBottom: 20 }}>
                  <div className="section-header" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                    <div className="section-title-wrap">
                      <div className="section-icon">📍</div>
                      <div>
                        <div className="section-title">Saved Addresses</div>
                        <div className="section-sub">Manage your delivery locations</div>
                      </div>
                    </div>
                    <button className="btn-add" onClick={() => { setEditingAddress(null); setShowAddressModal(true); }}>
                      + Add New
                    </button>
                  </div>
                </div>

                {addresses.length === 0 ? (
                  <div className="content-card">
                    <div className="empty-state">
                      <div className="empty-icon">📍</div>
                      <div className="empty-title">No addresses yet</div>
                      <div className="empty-sub">Add a delivery address to speed up checkout</div>
                      <button className="btn-add" style={{ marginTop: 8 }} onClick={() => setShowAddressModal(true)}>
                        + Add First Address
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="address-grid">
                    {addresses.map(addr => (
                      <div key={addr.id} className={`address-card ${addr.is_default ? 'default-card' : ''}`}>
                        {addr.is_default && <div className="default-badge">✓ Default</div>}
                        <div className="address-line1">{addr.address_line1}</div>
                        {addr.address_line2 && <div className="address-city">{addr.address_line2}</div>}
                        <div className="address-city">{addr.city}, {addr.state} — {addr.pincode}</div>
                        <div className="address-phone">📞 {addr.phone}</div>
                        <div className="address-actions">
                          <button className="btn-edit" onClick={() => { setEditingAddress(addr); setShowAddressModal(true); }}>
                            ✏️ Edit
                          </button>
                          <button className="btn-delete" onClick={async () => {
                            if (confirm('Delete this address?')) {
                              await fetch(`/api/user/addresses?id=${addr.id}`, { method: 'DELETE' });
                              await fetchAddresses();
                            }
                          }}>
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'favorites' && (
              <div className="content-card">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <div className="section-icon">❤️</div>
                    <div>
                      <div className="section-title">Favourite Medicines</div>
                      <div className="section-sub">Quick access to your saved medicines</div>
                    </div>
                  </div>
                </div>
                {favorites.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">❤️</div>
                    <div className="empty-title">No favourites yet</div>
                    <div className="empty-sub">Heart any medicine to save it here for next time</div>
                    <Link href="/" className="empty-link">Browse medicines →</Link>
                  </div>
                ) : (
                  <div className="fav-grid">
                    {favorites.map(fav => (
                      <div key={fav.id} className="fav-card">
                        <div className="fav-icon">💊</div>
                        <div>
                          <div className="fav-name">{fav.medicine_name}</div>
                          <div className="fav-date">
                            Added {new Date(fav.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <button className="btn-remove" onClick={() => removeFromFavorites(fav.id)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="content-card">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <div className="section-icon">📄</div>
                    <div>
                      <div className="section-title">Prescription History</div>
                      <div className="section-sub">Your uploaded and processed prescriptions</div>
                    </div>
                  </div>
                </div>
                {prescriptions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <div className="empty-title">No prescriptions yet</div>
                    <div className="empty-sub">Upload a prescription from the main store page</div>
                    <Link href="/" className="empty-link">Go to store →</Link>
                  </div>
                ) : (
                  <div className="rx-grid">
                    {prescriptions.map(pres => (
                      <div key={pres.id} className="rx-card">
                        <img src={pres.image_url} alt="Prescription" className="rx-img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ flex: 1 }}>
                          <div className="rx-date">
                            {new Date(pres.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="rx-text">{pres.extracted_text}</div>
                          {pres.medicines?.length > 0 && (
                            <div className="rx-meds">
                              {pres.medicines.map((m: string, i: number) => (
                                <span key={i} className="rx-med-tag">{m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {showAddressModal && (
        <AddressModal
          address={editingAddress}
          onClose={() => setShowAddressModal(false)}
          onSave={() => { setShowAddressModal(false); fetchAddresses(); }}
        />
      )}
    </>
  );
}

function AddressModal({ address, onClose, onSave }: { address: Address | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    phone: address?.phone || '',
    is_default: address?.is_default || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/user/addresses', {
        method: address ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address ? { id: address.id, ...form } : form),
      });
      if (res.ok) onSave();
      else alert('Failed to save address. Please try again.');
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "modal-input";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{address ? '✏️ Edit Address' : '📍 Add New Address'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <input className={inputClass} placeholder="Address Line 1 *" required
            value={form.address_line1}
            onChange={e => setForm({ ...form, address_line1: e.target.value })} />
          <input className={inputClass} placeholder="Address Line 2 (optional)"
            value={form.address_line2}
            onChange={e => setForm({ ...form, address_line2: e.target.value })} />
          <div className="modal-grid">
            <input className={inputClass} placeholder="City *" required
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })} />
            <input className={inputClass} placeholder="State *" required
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="modal-grid">
            <input className={inputClass} placeholder="PIN Code *" required
              value={form.pincode}
              onChange={e => setForm({ ...form, pincode: e.target.value })} />
            <input className={inputClass} placeholder="Phone *" required type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <label className="modal-checkbox">
            <input type="checkbox" checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              style={{ accentColor: 'var(--mint)', width: 16, height: 16 }} />
            Set as default address
          </label>
          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? '⏳ Saving…' : address ? '✓ Update Address' : '+ Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
}