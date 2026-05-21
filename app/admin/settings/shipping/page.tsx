'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import {
  Button, Card, Input, PageHeader, Spinner, Badge, Toggle,
} from '@/components/admin/ui';
import { 
  Save, Truck, MapPin, Clock, Package, Weight, 
  Ruler, Plus, Trash2, Edit, Globe, Navigation,
  AlertCircle, CheckCircle, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const shippingCss = `
  .shipping-container { max-width: 1200px; margin: 0 auto; }
  
  .shipping-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
  .shipping-main { display: flex; flex-direction: column; gap: 24px; }
  .shipping-sidebar { position: sticky; top: 80px; height: fit-content; }
  
  .shipping-card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
  .shipping-card-header { padding: 20px 24px; border-bottom: 1px solid #21262d; display: flex; justify-content: space-between; align-items: center; }
  .shipping-card-title { font-size: 1rem; font-weight: 600; color: #e6edf3; display: flex; align-items: center; gap: 8px; }
  .shipping-card-desc { font-size: 0.75rem; color: #8b949e; margin-top: 4px; }
  .shipping-card-body { padding: 24px; }
  
  .shipping-zone-item { border: 1px solid #21262d; border-radius: 10px; margin-bottom: 16px; overflow: hidden; }
  .shipping-zone-header { padding: 16px; background: #0d1117; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
  .shipping-zone-header:hover { background: rgba(255, 255, 255, 0.02); }
  .shipping-zone-name { font-weight: 600; color: #e6edf3; }
  .shipping-zone-body { padding: 16px; border-top: 1px solid #21262d; }
  
  .shipping-rule-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #0d1117; border-radius: 8px; margin-bottom: 8px; }
  .shipping-rule-details { flex: 1; }
  .shipping-rule-condition { font-size: 0.8rem; color: #e6edf3; margin-bottom: 4px; }
  .shipping-rule-price { font-size: 0.75rem; color: #0fa381; font-weight: 600; }
  
  .shipping-pincode-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .shipping-pincode-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #0d1117; border: 1px solid #21262d; border-radius: 20px; font-size: 0.7rem; color: #e6edf3; }
  .shipping-pincode-tag button { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 12px; padding: 0 2px; }
  .shipping-pincode-tag button:hover { color: #d64040; }
  
  .shipping-form-group { margin-bottom: 16px; }
  .shipping-label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8b949e; margin-bottom: 6px; }
  .shipping-input, .shipping-select { width: 100%; padding: 10px 12px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .shipping-input:focus, .shipping-select:focus { border-color: #0fa381; }
  
  .shipping-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #21262d; }
  
  .shipping-stat { background: #0d1117; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 12px; }
  .shipping-stat-value { font-size: 1.2rem; font-weight: 700; color: #0fa381; }
  .shipping-stat-label { font-size: 0.65rem; color: #8b949e; margin-top: 4px; }
  
  @media (max-width: 768px) {
    .shipping-grid { grid-template-columns: 1fr; }
    .shipping-sidebar { position: static; }
  }
`;

interface ShippingZone {
  id: string;
  name: string;
  type: 'domestic' | 'international';
  countries: string[];
  pincodes: string[];
  is_active: boolean;
  rules: ShippingRule[];
}

interface ShippingRule {
  id: string;
  condition_type: 'weight' | 'price' | 'quantity';
  min_value: number;
  max_value: number;
  charge: number;
  free_shipping: boolean;
}

interface ShippingStats {
  total_zones: number;
  active_zones: number;
  total_pincodes: number;
  avg_delivery_time: string;
}

export default function ShippingSettingsPage() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([
    {
      id: 'local',
      name: 'Local Delivery (Within City)',
      type: 'domestic',
      countries: ['India'],
      pincodes: ['400001', '400002', '400003', '400004', '400005'],
      is_active: true,
      rules: [
        {
          id: 'local_rule_1',
          condition_type: 'price',
          min_value: 0,
          max_value: 499,
          charge: 40,
          free_shipping: false,
        },
        {
          id: 'local_rule_2',
          condition_type: 'price',
          min_value: 500,
          max_value: 999999,
          charge: 0,
          free_shipping: true,
        },
      ],
    },
    {
      id: 'national',
      name: 'National Shipping',
      type: 'domestic',
      countries: ['India'],
      pincodes: [],
      is_active: true,
      rules: [
        {
          id: 'national_rule_1',
          condition_type: 'weight',
          min_value: 0,
          max_value: 5,
          charge: 80,
          free_shipping: false,
        },
        {
          id: 'national_rule_2',
          condition_type: 'weight',
          min_value: 5,
          max_value: 10,
          charge: 120,
          free_shipping: false,
        },
        {
          id: 'national_rule_3',
          condition_type: 'price',
          min_value: 1000,
          max_value: 999999,
          charge: 0,
          free_shipping: true,
        },
      ],
    },
  ]);

  const [stats, setStats] = useState<ShippingStats>({
    total_zones: 0,
    active_zones: 0,
    total_pincodes: 0,
    avg_delivery_time: '3-5 days',
  });

  const [newPincode, setNewPincode] = useState('');
  const [expandedZone, setExpandedZone] = useState<string | null>('local');

  const fetchShippingSettings = useCallback(async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', 'shipping_zones')
      .single();
    
    if (data?.setting_value) {
      setShippingZones(data.setting_value);
    }
    
    // Calculate stats
    const totalZones = shippingZones.length;
    const activeZones = shippingZones.filter(z => z.is_active).length;
    const totalPincodes = shippingZones.reduce((sum, zone) => sum + zone.pincodes.length, 0);
    
    setStats({
      total_zones: totalZones,
      active_zones: activeZones,
      total_pincodes: totalPincodes,
      avg_delivery_time: '3-5 days',
    });
    
    setLoading(false);
  }, [shippingZones.length]);

  useEffect(() => {
    fetchShippingSettings();
  }, [fetchShippingSettings]);

  const addPincode = (zoneId: string) => {
    if (newPincode && /^\d{6}$/.test(newPincode)) {
      setShippingZones(prev => prev.map(zone =>
        zone.id === zoneId && !zone.pincodes.includes(newPincode)
          ? { ...zone, pincodes: [...zone.pincodes, newPincode].sort() }
          : zone
      ));
      setNewPincode('');
      toast.success('Pincode added');
    } else {
      toast.error('Please enter a valid 6-digit pincode');
    }
  };

  const removePincode = (zoneId: string, pincode: string) => {
    setShippingZones(prev => prev.map(zone =>
      zone.id === zoneId
        ? { ...zone, pincodes: zone.pincodes.filter(p => p !== pincode) }
        : zone
    ));
    toast.success('Pincode removed');
  };

  const addRule = (zoneId: string) => {
    const newRule: ShippingRule = {
      id: `${zoneId}_rule_${Date.now()}`,
      condition_type: 'price',
      min_value: 0,
      max_value: 1000,
      charge: 50,
      free_shipping: false,
    };
    
    setShippingZones(prev => prev.map(zone =>
      zone.id === zoneId
        ? { ...zone, rules: [...zone.rules, newRule] }
        : zone
    ));
  };

  const updateRule = (zoneId: string, ruleId: string, updates: Partial<ShippingRule>) => {
    setShippingZones(prev => prev.map(zone =>
      zone.id === zoneId
        ? {
            ...zone,
            rules: zone.rules.map(rule =>
              rule.id === ruleId ? { ...rule, ...updates } : rule
            ),
          }
        : zone
    ));
  };

  const removeRule = (zoneId: string, ruleId: string) => {
    setShippingZones(prev => prev.map(zone =>
      zone.id === zoneId
        ? { ...zone, rules: zone.rules.filter(rule => rule.id !== ruleId) }
        : zone
    ));
  };

  const toggleZone = (zoneId: string) => {
    setShippingZones(prev => prev.map(zone =>
      zone.id === zoneId ? { ...zone, is_active: !zone.is_active } : zone
    ));
  };

  const addNewZone = () => {
    const newZone: ShippingZone = {
      id: `zone_${Date.now()}`,
      name: 'New Shipping Zone',
      type: 'domestic',
      countries: ['India'],
      pincodes: [],
      is_active: true,
      rules: [
        {
          id: `rule_${Date.now()}`,
          condition_type: 'price',
          min_value: 0,
          max_value: 500,
          charge: 50,
          free_shipping: false,
        },
      ],
    };
    
    setShippingZones(prev => [...prev, newZone]);
    setExpandedZone(newZone.id);
  };

  const deleteZone = (zoneId: string) => {
    if (confirm('Are you sure you want to delete this shipping zone?')) {
      setShippingZones(prev => prev.filter(zone => zone.id !== zoneId));
      toast.success('Shipping zone deleted');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    
    // Calculate updated stats
    const totalPincodes = shippingZones.reduce((sum, zone) => sum + zone.pincodes.length, 0);
    
    const { error } = await supabase
      .from('settings')
      .upsert({
        setting_key: 'shipping_zones',
        setting_value: shippingZones,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key',
      });
    
    setSaving(false);
    
    if (error) {
      toast.error('Failed to save shipping settings');
    } else {
      toast.success('Shipping settings saved successfully!');
      setStats(prev => ({ ...prev, total_pincodes: totalPincodes }));
    }
  };

  if (loading) {
    return (
      <div className="shipping-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shippingCss }} />
      
      <div className="shipping-container">
        <PageHeader
          title="Shipping Settings"
          subtitle="Configure shipping zones, rates, and delivery rules"
          action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={addNewZone}>
              Add Shipping Zone
            </Button>
          }
        />

        <div className="shipping-grid">
          <div className="shipping-main">
            {/* Shipping Zones */}
            {shippingZones.map((zone) => (
              <div key={zone.id} className="shipping-card">
                <div className="shipping-zone-item">
                  <div 
                    className="shipping-zone-header"
                    onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                  >
                    <div>
                      <div className="shipping-zone-name">
                        {zone.name}
                        {!zone.is_active && <Badge variant="gray">
    Disabled
  </Badge>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                        {zone.pincodes.length} pincodes • {zone.rules.length} shipping rules
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Toggle
      checked={zone.is_active}
      onChange={() => toggleZone(zone.id)}
      // Remove the onClick prop
    />
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }}
                        style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {expandedZone === zone.id && (
                    <div className="shipping-zone-body">
                      {/* Zone Name */}
                      <div className="shipping-form-group">
                        <label className="shipping-label">Zone Name</label>
                        <input
                          type="text"
                          value={zone.name}
                          onChange={(e) => setShippingZones(prev => prev.map(z =>
                            z.id === zone.id ? { ...z, name: e.target.value } : z
                          ))}
                          className="shipping-input"
                        />
                      </div>
                      
                      {/* Pincodes */}
                      <div className="shipping-form-group">
                        <label className="shipping-label">Serviceable Pincodes</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <input
                            type="text"
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value)}
                            placeholder="Enter 6-digit pincode"
                            className="shipping-input"
                            maxLength={6}
                            pattern="\d{6}"
                          />
                          <Button size="sm" onClick={() => addPincode(zone.id)}>Add</Button>
                        </div>
                        <div className="shipping-pincode-list">
                          {zone.pincodes.length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>No pincodes added. Add pincodes for this zone.</div>
                          ) : (
                            zone.pincodes.map(pincode => (
                              <div key={pincode} className="shipping-pincode-tag">
                                {pincode}
                                <button onClick={() => removePincode(zone.id, pincode)}>×</button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Shipping Rules */}
                      <div className="shipping-form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <label className="shipping-label">Shipping Rules</label>
                          <Button size="sm" variant="outline" onClick={() => addRule(zone.id)}>
                            <Plus size={12} /> Add Rule
                          </Button>
                        </div>
                        
                        {zone.rules.map((rule, idx) => (
                          <div key={rule.id} className="shipping-rule-item">
                            <div className="shipping-rule-details">
                              <div className="shipping-rule-condition">
                                <select
                                  value={rule.condition_type}
                                  onChange={(e) => updateRule(zone.id, rule.id, { condition_type: e.target.value as any })}
                                  className="shipping-select"
                                  style={{ width: 'auto', display: 'inline-block', marginRight: '8px' }}
                                >
                                  <option value="price">Order Price</option>
                                  <option value="weight">Weight (kg)</option>
                                  <option value="quantity">Quantity</option>
                                </select>
                                
                                <span style={{ margin: '0 8px' }}>from</span>
                                <input
                                  type="number"
                                  value={rule.min_value}
                                  onChange={(e) => updateRule(zone.id, rule.id, { min_value: Number(e.target.value) })}
                                  style={{ width: '100px', display: 'inline-block' }}
                                  className="shipping-input"
                                />
                                
                                <span style={{ margin: '0 8px' }}>to</span>
                                <input
                                  type="number"
                                  value={rule.max_value}
                                  onChange={(e) => updateRule(zone.id, rule.id, { max_value: Number(e.target.value) })}
                                  style={{ width: '100px', display: 'inline-block' }}
                                  className="shipping-input"
                                />
                              </div>
                              <div style={{ marginTop: '8px' }}>
                                <label style={{ marginRight: '16px' }}>
                                  <input
                                    type="checkbox"
                                    checked={rule.free_shipping}
                                    onChange={(e) => updateRule(zone.id, rule.id, { free_shipping: e.target.checked })}
                                    style={{ marginRight: '4px' }}
                                  />
                                  Free Shipping
                                </label>
                                
                                {!rule.free_shipping && (
                                  <>
                                    <span style={{ marginRight: '8px' }}>Charge: ₹</span>
                                    <input
                                      type="number"
                                      value={rule.charge}
                                      onChange={(e) => updateRule(zone.id, rule.id, { charge: Number(e.target.value) })}
                                      style={{ width: '100px', display: 'inline-block' }}
                                      className="shipping-input"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeRule(zone.id, rule.id)}
                              style={{ background: 'none', border: 'none', color: '#d64040', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="shipping-actions">
              <Button variant="primary" onClick={saveSettings} loading={saving}>
                <Save size={14} /> Save Shipping Settings
              </Button>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="shipping-sidebar">
            <div className="shipping-card">
              <div className="shipping-card-header">
                <div className="shipping-card-title">
                  <Truck size={18} /> Shipping Stats
                </div>
              </div>
              <div className="shipping-card-body">
                <div className="shipping-stat">
                  <div className="shipping-stat-value">{stats.total_zones}</div>
                  <div className="shipping-stat-label">Total Zones</div>
                </div>
                <div className="shipping-stat">
                  <div className="shipping-stat-value">{stats.active_zones}</div>
                  <div className="shipping-stat-label">Active Zones</div>
                </div>
                <div className="shipping-stat">
                  <div className="shipping-stat-value">{stats.total_pincodes}</div>
                  <div className="shipping-stat-label">Serviceable Pincodes</div>
                </div>
                <div className="shipping-stat">
                  <div className="shipping-stat-value">{stats.avg_delivery_time}</div>
                  <div className="shipping-stat-label">Avg. Delivery Time</div>
                </div>
              </div>
            </div>
            
            <div className="shipping-card">
              <div className="shipping-card-header">
                <div className="shipping-card-title">
                  <Navigation size={18} /> Delivery Partners
                </div>
              </div>
              <div className="shipping-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
                  <span style={{ fontSize: '0.85rem', color: '#e6edf3' }}>BlueDart</span>
                  <Badge variant="green">Active</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
                  <span style={{ fontSize: '0.85rem', color: '#e6edf3' }}>Delhivery</span>
                  <Badge variant="green">Active</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input type="checkbox" style={{ marginRight: '8px' }} />
                  <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>DTDC</span>
                  <Badge variant="gray">Inactive</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" style={{ marginRight: '8px' }} />
                  <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>Ecom Express</span>
                  <Badge variant="gray">Inactive</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}