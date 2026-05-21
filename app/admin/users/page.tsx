'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@lib/supabase-admin'
import { UserProfile, Order } from '@/types'
import {
  Card, Badge, Modal, Table, Tr, Td, PageHeader, Spinner, EmptyState, Button,
} from '../../../components/admin/ui'
import { Users, Eye, Search, ShoppingBag, Download } from 'lucide-react'

export default function UsersPage() {
  const supabase = createBrowserClient()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userOrders, setUserOrders] = useState<Order[]>([])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    const { data } = await query
    setUsers((data ?? []) as UserProfile[])
    setLoading(false)
  }, [search, supabase])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function openUser(user: UserProfile) {
    setSelectedUser(user)
    const { data } = await supabase
      .from('orders').select('*').eq('user_id', user.user_id).order('created_at', { ascending: false })
    setUserOrders((data ?? []) as Order[])
  }

  const totalSpent = (orders: Order[]) =>
    orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0)

  function statusBadge(status: string) {
    const map: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'gray'> = {
      delivered: 'green', shipped: 'blue', processing: 'amber', pending: 'gray', cancelled: 'red',
    }
    return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${users.length} registered customers`}
        action={<Button variant="outline" size="sm" icon={<Download size={14} />}>Export</Button>}
      />

      <Card className="mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users size={40} />} title="No customers found" />
        ) : (
          <Table headers={['Customer', 'Phone', 'Joined', 'Actions']}>
            {users.map(u => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{u.full_name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-500">{u.phone ?? '—'}</Td>
                <Td className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</Td>
                <Td>
                  <Button size="sm" variant="outline" icon={<Eye size={12} />} onClick={() => openUser(u)}>View Orders</Button>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.full_name ?? 'Customer'}
        width="max-w-2xl"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Email</div>
                <div className="text-sm font-medium">{selectedUser.email}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Phone</div>
                <div className="text-sm font-medium">{selectedUser.phone ?? '—'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Total Spent</div>
                <div className="text-sm font-bold text-green-700">₹{totalSpent(userOrders).toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <ShoppingBag size={14} /> Orders ({userOrders.length})
              </div>
              {userOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No orders yet</div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Order ID</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Total</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.map(o => (
                        <tr key={o.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-green-700 font-bold text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-3 py-2 font-semibold">₹{o.total.toLocaleString()}</td>
                          <td className="px-3 py-2">{statusBadge(o.status)}</td>
                          <td className="px-3 py-2 text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
