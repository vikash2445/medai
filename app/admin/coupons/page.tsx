'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@lib/supabase-admin'
// Remove this line: import { Coupon } from '@/types'
import {
  Button, Badge, Card, Modal, Input, Select, Toggle,
  PageHeader, Spinner, EmptyState,
} from '../../../components/admin/ui'
import { Plus, Tag, Edit, Trash2, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

// ✅ Add Coupon interface here
interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order: number
  max_uses?: number
  used_count: number
  expires_at?: string
  active: boolean
  created_at?: string
  updated_at?: string
}

const EMPTY: Partial<Coupon> = {
  code: '', discount_type: 'percentage', discount_value: 0,
  min_order: 0, max_uses: undefined, active: true,
}

export default function CouponsPage() {
  const supabase = createBrowserClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Coupon>>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons((data ?? []) as Coupon[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])

  function openAdd() { setForm(EMPTY); setIsEditing(false); setModalOpen(true) }
  function openEdit(c: Coupon) { setForm({ ...c }); setIsEditing(true); setModalOpen(true) }
  function set(k: keyof Coupon, v: unknown) { setForm(prev => ({ ...prev, [k]: v })) }

  async function save() {
    if (!form.code || !form.discount_value) { toast.error('Code and value required'); return }
    setSaving(true)
    const payload = { ...form, code: form.code!.toUpperCase(), used_count: form.used_count ?? 0 }
    const { error } = isEditing
      ? await supabase.from('coupons').update(payload).eq('id', form.id!)
      : await supabase.from('coupons').insert([payload])
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(isEditing ? 'Coupon updated!' : 'Coupon created!')
    setModalOpen(false)
    fetch()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (!error) { toast.success('Deleted'); fetch() }
    else toast.error(error.message)
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from('coupons').update({ active: !active }).eq('id', id)
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  const isExpired = (c: Coupon) => c.expires_at ? new Date(c.expires_at) < new Date() : false

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Manage discount codes and promotions"
        action={<Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Create Coupon</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={<Tag size={40} />} title="No coupons yet" desc="Create your first discount code." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map(c => {
            const expired = isExpired(c)
            return (
              <Card key={c.id} className={`border-2 ${expired ? 'border-slate-200 opacity-70' : c.active ? 'border-green-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg tracking-wider text-green-700">{c.code}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!') }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                  <Badge variant={expired ? 'gray' : c.active ? 'green' : 'gray'}>
                    {expired ? 'Expired' : c.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="text-sm text-slate-600 mb-1 font-medium">
                  {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                  {c.min_order > 0 && ` · Min ₹${c.min_order}`}
                </div>

                <div className="text-xs text-slate-400 mb-3">
                  Used {c.used_count} {c.max_uses ? `/ ${c.max_uses}` : ''} times
                  {c.expires_at && ` · ${expired ? 'Expired' : 'Expires'} ${new Date(c.expires_at).toLocaleDateString('en-IN')}`}
                </div>

                <div className="flex items-center justify-between">
                  <Toggle checked={c.active && !expired} onChange={() => toggle(c.id, c.active)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" icon={<Edit size={12} />} onClick={() => openEdit(c)}>Edit</Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => remove(c.id)}>Del</Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Coupon' : 'Create Coupon'}>
        <div className="space-y-3">
          <Input
            label="Coupon Code *"
            value={form.code || ''}
            onChange={e => set('code', e.target.value.toUpperCase())}
            placeholder="e.g. SAVE20"
            className="font-mono font-bold text-base tracking-wider"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" value={form.discount_type} onChange={e => set('discount_type', e.target.value as 'percentage' | 'fixed')}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </Select>
            <Input
              label={form.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
              type="number"
              value={form.discount_value || ''}
              onChange={e => set('discount_value', Number(e.target.value))}
            />
            <Input
              label="Min Order (₹)"
              type="number"
              value={form.min_order || ''}
              onChange={e => set('min_order', Number(e.target.value))}
              placeholder="0 = no minimum"
            />
            <Input
              label="Max Uses"
              type="number"
              value={form.max_uses || ''}
              onChange={e => set('max_uses', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Leave blank = unlimited"
            />
            <div className="col-span-2">
              <Input
                label="Expiry Date"
                type="date"
                value={form.expires_at ? form.expires_at.split('T')[0] : ''}
                onChange={e => set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
            <span className="text-sm font-medium">Active</span>
            <Toggle checked={form.active ?? true} onChange={v => set('active', v)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-[2]" loading={saving} onClick={save}>
              {isEditing ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}