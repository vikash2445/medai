import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
}

export default async function OrdersPage() {
  // Get the user ID from Clerk
  const { userId } = await auth();
  
  // If not logged in, show sign in message
  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
        <p className="text-gray-600 mb-4">Please sign in to view your orders</p>
        <a href="/" className="text-mint hover:underline">← Back to Home</a>
      </div>
    );
  }

  // Initialize Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch orders for this user
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
        <p className="text-red-600">Error loading orders. Please try again later.</p>
        <Link href="/" className="text-mint hover:underline mt-4 inline-block">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        <Link href="/" className="text-mint hover:underline">
          ← Continue Shopping
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No orders yet</p>
          <Link href="/" className="text-mint hover:underline">
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: Order) => (
            <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Total: ₹{(order.total / 100).toFixed(2)}</p>
                <p>Shipping to: {order.shipping_address}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}