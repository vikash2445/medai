'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@lib/supabase-admin'
import {
  Button, Badge, Card, Modal, Input, Select, Textarea, Toggle,
  PageHeader, Spinner, EmptyState,
} from '../../../components/admin/ui'
import ImageUpload from '../../../components/admin/ImageUpload'
import { Plus, Package, Edit, Trash2, Search, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Medicine Interface
interface Medicine {
  id: number
  name: string
  generic: string
  category: string
  type: string
  price: number
  isAntibiotic: boolean
  tags: string[]
  image: string
  description: string
  stock: number
  prescription_required: boolean
  created_at?: string
}

const CATEGORIES = ['Medicines', 'Skincare', 'Supplements', 'Baby Care', 'Fitness', 'Immunity', 'Personal Care', 'Healthcare']
const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Injection', 'Powder', 'Gel', 'Lotion', 'Other']

const EMPTY_FORM: Partial<Medicine> = {
  name: '', generic: '', category: '', type: '', price: 0,
  isAntibiotic: false, tags: [], image: '', description: '', stock: 0, prescription_required: false,
}

export default function MedicinesPage() {
  const supabase = createBrowserClient()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Medicine>>(EMPTY_FORM)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [tagInput, setTagInput] = useState('')

  const fetchMedicines = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('medicines').select('*').order('created_at', { ascending: false })
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,generic.ilike.%${search}%`)
    }
    if (categoryFilter) {
      query = query.eq('category', categoryFilter)
    }
    
    const { data, error } = await query
    if (!error && data) {
      setMedicines(data as Medicine[])
    }
    setLoading(false)
  }, [search, categoryFilter, supabase])

  useEffect(() => {
    fetchMedicines()
  }, [fetchMedicines])

  function openAdd() {
    setForm(EMPTY_FORM)
    setIsEditing(false)
    setModalOpen(true)
  }

  function openEdit(med: Medicine) {
    setForm({ ...med })
    setIsEditing(true)
    setModalOpen(true)
  }

  function setField(k: keyof Medicine, v: unknown) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function addTag() {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      setField('tags', [...(form.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setField('tags', form.tags?.filter(t => t !== tag) || [])
  }

  async function saveMedicine() {
    if (!form.name || !form.price) {
      toast.error('Name and price are required')
      return
    }
    
    setSaving(true)
    const payload = {
      name: form.name,
      generic: form.generic || null,
      category: form.category || null,
      type: form.type || null,
      price: form.price,
      isAntibiotic: form.isAntibiotic || false,
      tags: form.tags || [],
      image: form.image || null,
      description: form.description || null,
      stock: form.stock || 0,
      prescription_required: form.prescription_required || false,
    }
    
    const { error } = isEditing
      ? await supabase.from('medicines').update(payload).eq('id', form.id!)
      : await supabase.from('medicines').insert([payload])
    
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(isEditing ? 'Medicine updated!' : 'Medicine added!')
    setModalOpen(false)
    fetchMedicines()
  }

  async function deleteMedicine(id: number) {
    const { error } = await supabase.from('medicines').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Medicine deleted')
      fetchMedicines()
    }
    setDeleteId(null)
  }

  return (
    <>
      <PageHeader
        title="Medicines"
        subtitle={`${medicines.length} medicines in catalog`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAdd}>
            Add Medicine
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or generic name..."
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-green-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      {/* Medicines Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : medicines.length === 0 ? (
        <EmptyState icon={<Package size={40} />} title="No medicines found" desc="Add your first medicine to the catalog." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map(med => (
            <Card key={med.id}>
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {med.image ? (
                    <img src={med.image} alt={med.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{med.name}</div>
                  <div className="text-xs text-slate-500">{med.generic || 'No generic name'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="blue">{med.category || 'Uncategorized'}</Badge>
                    <Badge variant="purple">{med.type || 'General'}</Badge>
                    {med.isAntibiotic && <Badge variant="red">Antibiotic</Badge>}
                    {med.prescription_required && <Badge variant="amber">Prescription Required</Badge>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-green-700">₹{med.price}</span>
                    <span className={`text-xs ${(med.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {med.stock > 0 ? `${med.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" icon={<Edit size={12} />} onClick={() => openEdit(med)}>Edit</Button>
                    <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => setDeleteId(med.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Edit Medicine' : 'Add Medicine'}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <ImageUpload
            value={form.image ?? null}
            onChange={url => setField('image', url || '')}
            label="Medicine Image"
          />
          <Input label="Medicine Name *" value={form.name || ''} onChange={e => setField('name', e.target.value)} />
          <Input label="Generic Name" value={form.generic || ''} onChange={e => setField('generic', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category || ''} onChange={e => setField('category', e.target.value)}>
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
            <Select label="Type" value={form.type || ''} onChange={e => setField('type', e.target.value)}>
              <option value="">Select Type</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹) *" type="number" value={form.price || ''} onChange={e => setField('price', Number(e.target.value))} />
            <Input label="Stock" type="number" value={form.stock || ''} onChange={e => setField('stock', Number(e.target.value))} />
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg">
              {form.tags?.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addTag()}
                placeholder="Type and press Enter"
                className="flex-1 min-w-[100px] outline-none text-sm"
              />
            </div>
          </div>
          
          <Textarea label="Description" value={form.description || ''} onChange={e => setField('description', e.target.value)} rows={3} />
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isAntibiotic} onChange={e => setField('isAntibiotic', e.target.checked)} />
              <span className="text-sm">Is Antibiotic</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.prescription_required} onChange={e => setField('prescription_required', e.target.checked)} />
              <span className="text-sm">Prescription Required</span>
            </label>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-[2]" loading={saving} onClick={saveMedicine}>
              {isEditing ? 'Update Medicine' : 'Add Medicine'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Medicine">
        <p className="text-slate-600 mb-5">Are you sure you want to delete this medicine?</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => deleteMedicine(deleteId!)}>Delete</Button>
        </div>
      </Modal>
    </>
  )
}