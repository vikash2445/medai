'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import {
  Button, Card, Input, PageHeader, Spinner, Badge, Toggle,
} from '@/components/admin/ui';
import { 
  Save, CreditCard, Wallet, Building, Smartphone, 
  Banknote, AlertCircle, CheckCircle, Eye, EyeOff,
  Plus, Trash2, Edit, Shield, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const paymentCss = `
  .payment-container { max-width: 1200px; margin: 0 auto; }
  
  .payment-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
  .payment-main { display: flex; flex-direction: column; gap: 24px; }
  .payment-sidebar { position: sticky; top: 80px; height: fit-content; }
  
  .payment-card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
  .payment-card-header { padding: 20px 24px; border-bottom: 1px solid #21262d; display: flex; justify-content: space-between; align-items: center; }
  .payment-card-title { font-size: 1rem; font-weight: 600; color: #e6edf3; display: flex; align-items: center; gap: 8px; }
  .payment-card-desc { font-size: 0.75rem; color: #8b949e; margin-top: 4px; }
  .payment-card-body { padding: 24px; }
  
  .payment-method-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #21262d; cursor: pointer; transition: background 0.2s; }
  .payment-method-item:hover { background: rgba(255, 255, 255, 0.02); }
  .payment-method-item:last-child { border-bottom: none; }
  .payment-method-info { display: flex; align-items: center; gap: 12px; }
  .payment-method-icon { width: 40px; height: 40px; border-radius: 8px; background: #0d1117; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
  .payment-method-name { font-weight: 600; color: #e6edf3; margin-bottom: 4px; }
  .payment-method-desc { font-size: 0.7rem; color: #8b949e; }
  
  .payment-config { margin-top: 20px; padding-top: 20px; border-top: 1px solid #21262d; }
  .payment-config-title { font-size: 0.85rem; font-weight: 600; color: #e6edf3; margin-bottom: 16px; }
  .payment-form-group { margin-bottom: 16px; }
  .payment-label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8b949e; margin-bottom: 6px; }
  .payment-input { width: 100%; padding: 10px 12px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .payment-input:focus { border-color: #0fa381; }
  .payment-input.readonly { background: rgba(13, 17, 23, 0.5); color: #8b949e; cursor: not-allowed; }
  
  .payment-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
  .payment-stat { background: #0d1117; border-radius: 8px; padding: 12px; text-align: center; }
  .payment-stat-value { font-size: 1.2rem; font-weight: 700; color: #0fa381; }
  .payment-stat-label { font-size: 0.65rem; color: #8b949e; margin-top: 4px; }
  
  .payment-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #21262d; }
  
  @media (max-width: 768px) {
    .payment-grid { grid-template-columns: 1fr; }
    .payment-sidebar { position: static; }
  }
`;

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  enabled: boolean;
  config: Record<string, any>;
  test_mode: boolean;
}

interface TransactionStats {
  total_transactions: number;
  total_amount: number;
  success_rate: number;
  pending_refunds: number;
}

export default function PaymentSettingsPage() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('razorpay');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'razorpay',
      name: 'Razorpay',
      code: 'razorpay',
      icon: '💳',
      description: 'Credit/Debit Cards, UPI, NetBanking, Wallets',
      enabled: true,
      config: {
        key_id: '',
        key_secret: '',
        webhook_secret: '',
      },
      test_mode: true,
    },
    {
      id: 'cashfree',
      name: 'Cashfree',
      code: 'cashfree',
      icon: '🏦',
      description: 'Payments through Cashfree gateway',
      enabled: false,
      config: {
        app_id: '',
        secret_key: '',
      },
      test_mode: true,
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      code: 'cod',
      icon: '💵',
      description: 'Pay when you receive the order',
      enabled: true,
      config: {
        additional_charge: 0,
        max_order_amount: 50000,
      },
      test_mode: false,
    },
    {
      id: 'upi',
      name: 'UPI QR',
      code: 'upi',
      icon: '📱',
      description: 'Pay using any UPI app',
      enabled: true,
      config: {
        upi_id: 'mediora@okhdfcbank',
        qr_image: '',
      },
      test_mode: false,
    },
    {
      id: 'wallet',
      name: 'Mediora Wallet',
      code: 'wallet',
      icon: '👛',
      description: 'Store credit and loyalty points',
      enabled: true,
      config: {
        min_recharge: 100,
        max_recharge: 10000,
        cashback_percentage: 5,
      },
      test_mode: false,
    },
  ]);

  const [stats, setStats] = useState<TransactionStats>({
    total_transactions: 0,
    total_amount: 0,
    success_rate: 0,
    pending_refunds: 0,
  });

  const fetchStats = useCallback(async () => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*');
    
    if (transactions) {
      const total = transactions.length;
      const successful = transactions.filter(t => t.status === 'success').length;
      const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const pendingRefunds = transactions.filter(t => t.status === 'refund_pending').length;
      
      setStats({
        total_transactions: total,
        total_amount: totalAmount,
        success_rate: total > 0 ? (successful / total) * 100 : 0,
        pending_refunds: pendingRefunds,
      });
    }
  }, [supabase]);

  const fetchPaymentSettings = useCallback(async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'payment_methods')
      .single();
    
    if (data?.setting_value) {
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        ...data.setting_value.find((s: any) => s.id === method.id),
      })));
    }
    
    await fetchStats();
    setLoading(false);
  }, [supabase, fetchStats]);

  useEffect(() => {
    fetchPaymentSettings();
  }, [fetchPaymentSettings]);

  const toggleMethod = (methodId: string) => {
    setPaymentMethods(prev => prev.map(method =>
      method.id === methodId ? { ...method, enabled: !method.enabled } : method
    ));
  };

  const updateConfig = (methodId: string, key: string, value: any) => {
    setPaymentMethods(prev => prev.map(method =>
      method.id === methodId 
        ? { ...method, config: { ...method.config, [key]: value } }
        : method
    ));
  };

  const toggleTestMode = (methodId: string) => {
    setPaymentMethods(prev => prev.map(method =>
      method.id === methodId ? { ...method, test_mode: !method.test_mode } : method
    ));
  };

  const toggleShowKey = (methodId: string, key: string) => {
    setShowKeys(prev => ({ ...prev, [`${methodId}_${key}`]: !prev[`${methodId}_${key}`] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('settings')
      .upsert({
        setting_key: 'payment_methods',
        setting_value: paymentMethods,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key',
      });
    
    setSaving(false);
    
    if (error) {
      toast.error('Failed to save payment settings');
    } else {
      toast.success('Payment settings saved successfully!');
    }
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  if (loading) {
    return (
      <div className="payment-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: paymentCss }} />
      
      <div className="payment-container">
        <PageHeader
          title="Payment Settings"
          subtitle="Configure payment gateways and transaction preferences"
        />

        <div className="payment-grid">
          <div className="payment-main">
            {/* Payment Methods List */}
            <div className="payment-card">
              <div className="payment-card-header">
                <div>
                  <div className="payment-card-title">
                    <CreditCard size={18} /> Payment Methods
                  </div>
                  <div className="payment-card-desc">Enable/disable payment options for customers</div>
                </div>
              </div>
              <div className="payment-card-body" style={{ padding: 0 }}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="payment-method-item">
                    <div className="payment-method-info">
                      <div className="payment-method-icon">{method.icon}</div>
                      <div>
                        <div className="payment-method-name">{method.name}</div>
                        <div className="payment-method-desc">{method.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {method.test_mode && (
                        <Badge variant="amber">Test Mode</Badge>
                      )}
                      <Toggle
                        checked={method.enabled}
                        onChange={() => toggleMethod(method.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Configuration */}
            {selectedMethodData && selectedMethodData.enabled && (
              <div className="payment-card">
                <div className="payment-card-header">
                  <div>
                    <div className="payment-card-title">
                      {selectedMethodData.icon} {selectedMethodData.name} Configuration
                    </div>
                    <div className="payment-card-desc">Configure API keys and settings for {selectedMethodData.name}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>Test Mode</span>
                    <Toggle
                      checked={selectedMethodData.test_mode}
                      onChange={() => toggleTestMode(selectedMethodData.id)}
                    />
                  </div>
                </div>
                <div className="payment-card-body">
                  {selectedMethodData.id === 'razorpay' && (
                    <>
                      <div className="payment-form-group">
                        <label className="payment-label">Key ID</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showKeys[`${selectedMethodData.id}_key_id`] ? 'text' : 'password'}
                            value={selectedMethodData.config.key_id || ''}
                            onChange={(e) => updateConfig(selectedMethodData.id, 'key_id', e.target.value)}
                            className="payment-input"
                            placeholder={selectedMethodData.test_mode ? 'rzp_test_xxxx' : 'rzp_live_xxxx'}
                          />
                          <button
                            onClick={() => toggleShowKey(selectedMethodData.id, 'key_id')}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                          >
                            {showKeys[`${selectedMethodData.id}_key_id`] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">Key Secret</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showKeys[`${selectedMethodData.id}_key_secret`] ? 'text' : 'password'}
                            value={selectedMethodData.config.key_secret || ''}
                            onChange={(e) => updateConfig(selectedMethodData.id, 'key_secret', e.target.value)}
                            className="payment-input"
                          />
                          <button
                            onClick={() => toggleShowKey(selectedMethodData.id, 'key_secret')}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                          >
                            {showKeys[`${selectedMethodData.id}_key_secret`] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">Webhook Secret</label>
                        <input
                          type="text"
                          value={selectedMethodData.config.webhook_secret || ''}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'webhook_secret', e.target.value)}
                          className="payment-input"
                        />
                      </div>
                    </>
                  )}

                  {selectedMethodData.id === 'cashfree' && (
                    <>
                      <div className="payment-form-group">
                        <label className="payment-label">App ID</label>
                        <input
                          type="text"
                          value={selectedMethodData.config.app_id || ''}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'app_id', e.target.value)}
                          className="payment-input"
                        />
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">Secret Key</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showKeys[`${selectedMethodData.id}_secret_key`] ? 'text' : 'password'}
                            value={selectedMethodData.config.secret_key || ''}
                            onChange={(e) => updateConfig(selectedMethodData.id, 'secret_key', e.target.value)}
                            className="payment-input"
                          />
                          <button
                            onClick={() => toggleShowKey(selectedMethodData.id, 'secret_key')}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                          >
                            {showKeys[`${selectedMethodData.id}_secret_key`] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMethodData.id === 'cod' && (
                    <>
                      <div className="payment-form-group">
                        <label className="payment-label">Additional Charge (₹)</label>
                        <input
                          type="number"
                          value={selectedMethodData.config.additional_charge || 0}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'additional_charge', Number(e.target.value))}
                          className="payment-input"
                        />
                        <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                          Extra fee for COD orders (default: ₹0)
                        </div>
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">Maximum Order Amount (₹)</label>
                        <input
                          type="number"
                          value={selectedMethodData.config.max_order_amount || 50000}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'max_order_amount', Number(e.target.value))}
                          className="payment-input"
                        />
                        <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                          Maximum order value allowed for COD
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMethodData.id === 'upi' && (
                    <>
                      <div className="payment-form-group">
                        <label className="payment-label">UPI ID</label>
                        <input
                          type="text"
                          value={selectedMethodData.config.upi_id || ''}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'upi_id', e.target.value)}
                          className="payment-input"
                          placeholder="store@okhdfcbank"
                        />
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">QR Code Image URL</label>
                        <input
                          type="text"
                          value={selectedMethodData.config.qr_image || ''}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'qr_image', e.target.value)}
                          className="payment-input"
                          placeholder="https://yourdomain.com/qr-code.png"
                        />
                      </div>
                    </>
                  )}

                  {selectedMethodData.id === 'wallet' && (
                    <>
                      <div className="payment-form-group">
                        <label className="payment-label">Minimum Recharge (₹)</label>
                        <input
                          type="number"
                          value={selectedMethodData.config.min_recharge || 100}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'min_recharge', Number(e.target.value))}
                          className="payment-input"
                        />
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">Maximum Recharge (₹)</label>
                        <input
                          type="number"
                          value={selectedMethodData.config.max_recharge || 10000}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'max_recharge', Number(e.target.value))}
                          className="payment-input"
                        />
                      </div>
                      <div className="payment-form-group">
                        <label className="payment-label">Cashback Percentage (%)</label>
                        <input
                          type="number"
                          value={selectedMethodData.config.cashback_percentage || 5}
                          onChange={(e) => updateConfig(selectedMethodData.id, 'cashback_percentage', Number(e.target.value))}
                          className="payment-input"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="payment-actions">
              <Button variant="primary" onClick={saveSettings} loading={saving}>
                <Save size={14} /> Save Payment Settings
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="payment-sidebar">
            <div className="payment-card">
              <div className="payment-card-header">
                <div className="payment-card-title">
                  <Wallet size={18} /> Transaction Stats
                </div>
              </div>
              <div className="payment-card-body">
                <div className="payment-stats">
                  <div className="payment-stat">
                    <div className="payment-stat-value">{stats.total_transactions}</div>
                    <div className="payment-stat-label">Transactions</div>
                  </div>
                  <div className="payment-stat">
                    <div className="payment-stat-value">₹{(stats.total_amount / 1000).toFixed(1)}K</div>
                    <div className="payment-stat-label">Total Volume</div>
                  </div>
                  <div className="payment-stat">
                    <div className="payment-stat-value">{stats.success_rate.toFixed(1)}%</div>
                    <div className="payment-stat-label">Success Rate</div>
                  </div>
                  <div className="payment-stat">
                    <div className="payment-stat-value">{stats.pending_refunds}</div>
                    <div className="payment-stat-label">Pending Refunds</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="payment-card">
              <div className="payment-card-header">
                <div className="payment-card-title">
                  <Shield size={18} /> Security Notes
                </div>
              </div>
              <div className="payment-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Lock size={14} style={{ color: '#0fa381' }} />
                  <span style={{ fontSize: '0.8rem', color: '#e6edf3' }}>PCI DSS Compliant</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: '1.5' }}>
                  All payment gateways are PCI DSS compliant. Never share your API keys publicly.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}