'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import {
  Button, Card, Input, PageHeader, Spinner, Badge, Toggle,
} from '@/components/admin/ui';
import { 
  Save, Globe, DollarSign, Truck, Mail, Shield, 
  Bell, Clock, MapPin, Phone, Building, 
  Palette, Eye, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const settingsCss = `
  .settings-container { max-width: 1200px; margin: 0 auto; }
  
  .settings-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
  .settings-sidebar { position: sticky; top: 80px; height: fit-content; }
  .settings-sidebar-nav { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
  .settings-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; background: transparent; border: none; color: #8b949e; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; text-align: left; }
  .settings-nav-item:hover { background: rgba(15, 163, 129, 0.1); color: #e6edf3; }
  .settings-nav-item.active { background: rgba(15, 163, 129, 0.15); color: #0fa381; border-left: 3px solid #0fa381; }
  
  .settings-content { background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 24px; }
  .settings-section { display: none; }
  .settings-section.active { display: block; }
  .settings-section-title { font-size: 1.2rem; font-weight: 600; color: #e6edf3; margin-bottom: 8px; }
  .settings-section-desc { font-size: 0.8rem; color: #8b949e; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #21262d; }
  
  .settings-form-group { margin-bottom: 20px; }
  .settings-label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8b949e; margin-bottom: 8px; }
  .settings-input, .settings-select, .settings-textarea { width: 100%; padding: 10px 12px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .settings-input:focus, .settings-select:focus, .settings-textarea:focus { border-color: #0fa381; }
  .settings-textarea { resize: vertical; min-height: 100px; }
  
  .settings-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .settings-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #21262d; }
  
  .settings-card { background: #0d1117; border: 1px solid #21262d; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .settings-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .settings-card-title { font-weight: 600; color: #e6edf3; }
  .settings-card-desc { font-size: 0.75rem; color: #8b949e; }
  
  @media (max-width: 768px) {
    .settings-grid { grid-template-columns: 1fr; }
    .settings-sidebar { position: static; }
    .settings-row { grid-template-columns: 1fr; }
  }
`;

interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_state: string;
  store_pincode: string;
  currency: string;
  currency_symbol: string;
  tax_percentage: number;
  delivery_charge: number;
  free_delivery_min: number;
  timezone: string;
  date_format: string;
  primary_color: string;
  logo_url: string;
  favicon_url: string;
}

interface NotificationSettings {
  order_notifications: boolean;
  low_stock_alerts: boolean;
  customer_reviews: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

interface SystemSettings {
  site_maintenance: boolean;
  allow_registration: boolean;
  require_email_verification: boolean;
  guest_checkout: boolean;
  cache_duration: number;
}

export default function SettingsPage() {
  const supabase = createBrowserClient();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: 'Mediora',
    store_email: 'admin@mediora.com',
    store_phone: '+91 9876543210',
    store_address: '123 Healthcare Plaza',
    store_city: 'Mumbai',
    store_state: 'Maharashtra',
    store_pincode: '400001',
    currency: 'INR',
    currency_symbol: '₹',
    tax_percentage: 18,
    delivery_charge: 40,
    free_delivery_min: 499,
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    primary_color: '#0fa381',
    logo_url: '',
    favicon_url: '',
  });
  
  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    order_notifications: true,
    low_stock_alerts: true,
    customer_reviews: true,
    email_notifications: true,
    sms_notifications: false,
  });
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    site_maintenance: false,
    allow_registration: true,
    require_email_verification: false,
    guest_checkout: true,
    cache_duration: 3600,
  });

  // Business Hours
  const [businessHours, setBusinessHours] = useState({
    monday: { open: '09:00', close: '21:00', enabled: true },
    tuesday: { open: '09:00', close: '21:00', enabled: true },
    wednesday: { open: '09:00', close: '21:00', enabled: true },
    thursday: { open: '09:00', close: '21:00', enabled: true },
    friday: { open: '09:00', close: '21:00', enabled: true },
    saturday: { open: '10:00', close: '18:00', enabled: true },
    sunday: { open: '10:00', close: '14:00', enabled: false },
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    
    // Fetch store settings
    const { data: storeData } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'store')
      .single();
    
    if (storeData?.setting_value) {
      setStoreSettings(prev => ({ ...prev, ...storeData.setting_value }));
    }
    
    // Fetch notification settings
    const { data: notifData } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'notifications')
      .single();
    
    if (notifData?.setting_value) {
      setNotificationSettings(prev => ({ ...prev, ...notifData.setting_value }));
    }
    
    // Fetch system settings
    const { data: systemData } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'system')
      .single();
    
    if (systemData?.setting_value) {
      setSystemSettings(prev => ({ ...prev, ...systemData.setting_value }));
    }
    
    // Fetch business hours
    const { data: hoursData } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'business_hours')
      .single();
    
    if (hoursData?.setting_value) {
      setBusinessHours(prev => ({ ...prev, ...hoursData.setting_value }));
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (section: string, data: any) => {
    setSaving(true);
    
    const { error } = await supabase
      .from('settings')
      .upsert({
        setting_key: section,
        setting_value: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key',
      });
    
    setSaving(false);
    
    if (error) {
      toast.error(`Failed to save ${section} settings`);
    } else {
      toast.success(`${section} settings saved successfully!`);
    }
  };

  const handleSaveStore = () => saveSettings('store', storeSettings);
  const handleSaveNotifications = () => saveSettings('notifications', notificationSettings);
  const handleSaveSystem = () => saveSettings('system', systemSettings);
  const handleSaveHours = () => saveSettings('business_hours', businessHours);

  const tabs = [
    { id: 'general', label: 'General Store', icon: <Building size={16} /> },
    { id: 'payments', label: 'Payments & Tax', icon: <DollarSign size={16} /> },
    { id: 'shipping', label: 'Shipping', icon: <Truck size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'business', label: 'Business Hours', icon: <Clock size={16} /> },
    { id: 'system', label: 'System', icon: <Shield size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  ];

  if (loading) {
    return (
      <div className="settings-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: settingsCss }} />
      
      <div className="settings-container">
        <PageHeader
          title="Settings"
          subtitle="Manage your store configuration and preferences"
        />

        <div className="settings-grid">
          {/* Sidebar Navigation */}
          <div className="settings-sidebar">
            <div className="settings-sidebar-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="settings-content">
            {/* General Store Settings */}
            <div className={`settings-section ${activeTab === 'general' ? 'active' : ''}`}>
              <div className="settings-section-title">General Store Settings</div>
              <div className="settings-section-desc">Basic information about your store</div>
              
              <div className="settings-form-group">
                <label className="settings-label">Store Name</label>
                <input
                  type="text"
                  value={storeSettings.store_name}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, store_name: e.target.value }))}
                  className="settings-input"
                  placeholder="Your store name"
                />
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Store Email</label>
                  <input
                    type="email"
                    value={storeSettings.store_email}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_email: e.target.value }))}
                    className="settings-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Store Phone</label>
                  <input
                    type="tel"
                    value={storeSettings.store_phone}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                    className="settings-input"
                  />
                </div>
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Store Address</label>
                <textarea
                  value={storeSettings.store_address}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, store_address: e.target.value }))}
                  className="settings-textarea"
                  rows={2}
                />
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">City</label>
                  <input
                    type="text"
                    value={storeSettings.store_city}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_city: e.target.value }))}
                    className="settings-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">State</label>
                  <input
                    type="text"
                    value={storeSettings.store_state}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_state: e.target.value }))}
                    className="settings-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Pincode</label>
                  <input
                    type="text"
                    value={storeSettings.store_pincode}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, store_pincode: e.target.value }))}
                    className="settings-input"
                  />
                </div>
              </div>
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveStore} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>

            {/* Payments & Tax Settings */}
            <div className={`settings-section ${activeTab === 'payments' ? 'active' : ''}`}>
              <div className="settings-section-title">Payments & Tax Configuration</div>
              <div className="settings-section-desc">Manage currency, tax rates, and payment methods</div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Currency</label>
                  <select
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="settings-select"
                  >
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Currency Symbol</label>
                  <input
                    type="text"
                    value={storeSettings.currency_symbol}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, currency_symbol: e.target.value }))}
                    className="settings-input"
                    maxLength={3}
                  />
                </div>
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Tax Percentage (GST)</label>
                  <input
                    type="number"
                    value={storeSettings.tax_percentage}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, tax_percentage: Number(e.target.value) }))}
                    className="settings-input"
                    step="0.5"
                  />
                </div>
              </div>
              
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-title">Payment Methods</div>
                  <Badge variant="green">Active</Badge>
                </div>
                <div className="settings-card-desc">Configure payment gateways</div>
                <div className="settings-form-group" style={{ marginTop: '12px' }}>
                  <label className="settings-label">Razorpay Key ID</label>
                  <input type="text" placeholder="rzp_live_xxxx" className="settings-input" />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Razorpay Key Secret</label>
                  <input type="password" placeholder="••••••••" className="settings-input" />
                </div>
              </div>
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveStore} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>

            {/* Shipping Settings */}
            <div className={`settings-section ${activeTab === 'shipping' ? 'active' : ''}`}>
              <div className="settings-section-title">Shipping Configuration</div>
              <div className="settings-section-desc">Set delivery charges and free shipping thresholds</div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Standard Delivery Charge (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.delivery_charge}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, delivery_charge: Number(e.target.value) }))}
                    className="settings-input"
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label">Free Delivery Minimum (₹)</label>
                  <input
                    type="number"
                    value={storeSettings.free_delivery_min}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, free_delivery_min: Number(e.target.value) }))}
                    className="settings-input"
                  />
                  <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                    Orders above this amount get free delivery
                  </div>
                </div>
              </div>
              
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-title">Delivery Areas</div>
                </div>
                <div className="settings-card-desc">Define serviceable pincodes (comma-separated)</div>
                <textarea
                  className="settings-textarea"
                  rows={4}
                  placeholder="400001, 400002, 400003, ..."
                  style={{ marginTop: '12px' }}
                />
              </div>
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveStore} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className={`settings-section ${activeTab === 'notifications' ? 'active' : ''}`}>
              <div className="settings-section-title">Notification Preferences</div>
              <div className="settings-section-desc">Configure which notifications to send</div>
              
              <div className="settings-card">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #21262d' }}>
                    <div>
                      <div className="settings-card-title" style={{ marginBottom: '4px' }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="settings-card-desc">
                        {key === 'order_notifications' && 'Send notifications for order updates'}
                        {key === 'low_stock_alerts' && 'Alert when products are low in stock'}
                        {key === 'customer_reviews' && 'Notify when customers leave reviews'}
                        {key === 'email_notifications' && 'Send email notifications'}
                        {key === 'sms_notifications' && 'Send SMS notifications'}
                      </div>
                    </div>
                    <Toggle
                      checked={value}
                      onChange={() => setNotificationSettings(prev => ({ ...prev, [key]: !value }))}
                    />
                  </div>
                ))}
              </div>
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveNotifications} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>

            {/* Business Hours */}
            <div className={`settings-section ${activeTab === 'business' ? 'active' : ''}`}>
              <div className="settings-section-title">Business Hours</div>
              <div className="settings-section-desc">Set your store operating hours</div>
              
              {Object.entries(businessHours).map(([day, hours]) => (
                <div key={day} className="settings-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="settings-card-title" style={{ textTransform: 'capitalize' }}>{day}</div>
                    <Toggle
                      checked={hours.enabled}
                      onChange={() => setBusinessHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day as keyof typeof businessHours], enabled: !hours.enabled }
                      }))}
                    />
                  </div>
                  {hours.enabled && (
                    <div className="settings-row">
                      <div className="settings-form-group">
                        <label className="settings-label">Open Time</label>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setBusinessHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof businessHours], open: e.target.value }
                          }))}
                          className="settings-input"
                        />
                      </div>
                      <div className="settings-form-group">
                        <label className="settings-label">Close Time</label>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setBusinessHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof businessHours], close: e.target.value }
                          }))}
                          className="settings-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveHours} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>

            {/* System Settings */}
            <div className={`settings-section ${activeTab === 'system' ? 'active' : ''}`}>
              <div className="settings-section-title">System Configuration</div>
              <div className="settings-section-desc">Advanced system settings and preferences</div>
              
              <div className="settings-card">
                {Object.entries(systemSettings).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #21262d' }}>
                    <div>
                      <div className="settings-card-title" style={{ marginBottom: '4px' }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="settings-card-desc">
                        {key === 'site_maintenance' && 'Put site in maintenance mode'}
                        {key === 'allow_registration' && 'Allow new user registrations'}
                        {key === 'require_email_verification' && 'Require email verification for new accounts'}
                        {key === 'guest_checkout' && 'Allow checkout without account'}
                        {key === 'cache_duration' && 'Cache duration in seconds'}
                      </div>
                    </div>
                    {typeof value === 'boolean' ? (
                      <Toggle
                        checked={value}
                        onChange={() => setSystemSettings(prev => ({ ...prev, [key]: !value }))}
                      />
                    ) : (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="settings-input"
                        style={{ width: '120px' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveSystem} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className={`settings-section ${activeTab === 'appearance' ? 'active' : ''}`}>
              <div className="settings-section-title">Store Appearance</div>
              <div className="settings-section-desc">Customize your store's look and feel</div>
              
              <div className="settings-form-group">
                <label className="settings-label">Primary Color</label>
                <div className="settings-row">
                  <input
                    type="color"
                    value={storeSettings.primary_color}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="settings-input"
                    style={{ width: '80px', height: '40px', padding: '4px' }}
                  />
                  <input
                    type="text"
                    value={storeSettings.primary_color}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="settings-input"
                    placeholder="#0fa381"
                  />
                </div>
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Logo URL</label>
                <input
                  type="text"
                  value={storeSettings.logo_url}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                  className="settings-input"
                  placeholder="https://yourdomain.com/logo.png"
                />
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Favicon URL</label>
                <input
                  type="text"
                  value={storeSettings.favicon_url}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
                  className="settings-input"
                  placeholder="https://yourdomain.com/favicon.ico"
                />
              </div>
              
              <div className="settings-actions">
                <Button variant="primary" onClick={handleSaveStore} loading={saving}>
                  <Save size={14} /> Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}