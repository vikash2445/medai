'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@lib/supabase-admin'
import {
  Button, Badge, Card, Modal, Input, Select, Toggle,
  PageHeader, Spinner, EmptyState,
} from '../../../components/admin/ui'
import ImageUpload from '../../../components/admin/ImageUpload'
import { Plus, Image as ImageIcon, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

// Banner interface
interface Banner {
  id: string
  title: string
  subtitle?: string
  image_url: string
  link?: string
  position: string
  active: boolean
  created_at?: string
  updated_at?: string
}

const POSITIONS = ['hero', 'offer_1', 'offer_2', 'category_top', 'sidebar', 'popup']
const EMPTY: Partial<Banner> = { title: '', subtitle: '', image_url: '', link: '', position: 'hero', active: true }

export default function BannersPage() {
  const supabase = createBrowserClient()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Banner>>(EMPTY)
  const [isEditing, setIsEditing] = useState(false)

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false })
    setBanners((data ?? []) as Banner[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchBanners() }, [fetchBanners])

  function set(k: keyof Banner, v: unknown) { setForm(prev => ({ ...prev, [k]: v })) }
  function openAdd() { setForm(EMPTY); setIsEditing(false); setModalOpen(true) }
  function openEdit(b: Banner) { setForm({ ...b }); setIsEditing(true); setModalOpen(true) }

  async function save() {
    if (!form.title || !form.image_url) { toast.error('Title and image are required'); return }
    setSaving(true)
    const { error } = isEditing
      ? await supabase.from('banners').update(form).eq('id', form.id!)
      : await supabase.from('banners').insert([form])
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(isEditing ? 'Banner updated!' : 'Banner added!')
    setModalOpen(false)
    fetchBanners()
  }

  async function remove(id: string) {
    await supabase.from('banners').delete().eq('id', id)
    toast.success('Deleted')
    fetchBanners()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('banners').update({ active: !active }).eq('id', id)
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !active } : b))
  }

  return (
    <>
      <PageHeader
        title="Banners"
        subtitle="Manage homepage and promotional banners"
        action={<Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Add Banner</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : banners.length === 0 ? (
        <EmptyState icon={<ImageIcon size={40} />} title="No banners yet" desc="Create your first banner to display on the store." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map(b => (
            <Card key={b.id}>
              <div className="relative rounded-lg overflow-hidden bg-slate-100 mb-3" style={{ height: 140 }}>
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <ImageIcon size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={b.active ? 'green' : 'gray'}>{b.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant="blue">{b.position}</Badge>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{b.title}</div>
                  {b.subtitle && <div className="text-sm text-slate-500">{b.subtitle}</div>}
                  {b.link && <div className="text-xs text-green-600 truncate">{b.link}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <Toggle checked={b.active} onChange={() => toggleActive(b.id, b.active)} />
                  <Button size="sm" variant="outline" icon={<Edit size={12} />} onClick={() => openEdit(b)} />
                  <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => remove(b.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Banner' : 'Add Banner'} width="max-w-xl">
        <div className="space-y-3">
          {/* Single image upload for banners (using values prop with single item array) */}
          <ImageUpload
            values={form.image_url ? [form.image_url] : []}
            onChange={(urls) => set('image_url', urls && urls.length > 0 ? urls[0] : '')}
            bucket="banners"
            folder="banners"
            label="Banner Image"
            maxImages={1}
          />
          <Input label="Title *" value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Sale" />
          <Input label="Subtitle" value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} placeholder="Optional tagline" />
          <Input label="Link URL" value={form.link || ''} onChange={e => set('link', e.target.value)} placeholder="https://mediora.fit/store?cat=..." />
          <Select label="Position" value={form.position || 'hero'} onChange={e => set('position', e.target.value)}>
            {POSITIONS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
          </Select>
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
            <span className="text-sm font-medium">Active (visible on store)</span>
            <Toggle checked={form.active ?? true} onChange={v => set('active', v)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-[2]" loading={saving} onClick={save}>
              {isEditing ? 'Update Banner' : 'Add Banner'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}