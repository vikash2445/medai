'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@lib/supabase-admin'
import {
  Button, Badge, Card, Table, Tr, Td, PageHeader, Spinner, EmptyState,
} from '../../../components/admin/ui'
import { Star, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}
    </span>
  )
}

interface Review {
  id: string;
  product_id: number;
  user_id: string;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export default function ReviewsPage() {
  const supabase = createBrowserClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (filter === 'pending') q = q.eq('approved', false)
    if (filter === 'approved') q = q.eq('approved', true)
    const { data } = await q
    setReviews((data ?? []) as Review[])
    setLoading(false)
  }, [filter, supabase])

  useEffect(() => { fetch() }, [fetch])

  async function approve(id: string) {
    const { error } = await supabase.from('reviews').update({ approved: true }).eq('id', id)
    if (!error) { toast.success('Review approved'); fetch() }
  }

  async function remove(id: string) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) { toast.success('Review deleted'); fetch() }
  }

  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate product reviews" />

      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={<Star size={40} />} title="No reviews" desc={filter === 'pending' ? 'All caught up!' : 'No reviews found.'} />
        ) : (
          <Table headers={['Product', 'Customer', 'Rating', 'Review', 'Status', 'Actions']}>
            {reviews.map(r => (
              <Tr key={r.id}>
                <Td><span className="font-semibold text-sm">{r.product_id}</span></Td>
                <Td>
                  <div className="text-sm font-medium">{r.user_name}</div>
                  <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                </Td>
                <Td><Stars n={r.rating} /></Td>
                <Td className="max-w-xs">
                  <p className="text-sm text-slate-600 line-clamp-2">{r.comment}</p>
                </Td>
                <Td>
                  <Badge variant={r.status === 'approved' ? 'green' : 'amber'}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    {r.status === 'pending' && (
                      <Button size="sm" variant="primary" icon={<CheckCircle size={12} />} onClick={() => approve(r.id)}>
                        Approve
                      </Button>
                    )}
                    <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => remove(r.id)}>Del</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  )
}
