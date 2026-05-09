import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

interface Props {
  params: {
    id: string;
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const steps = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

function getStepIndex(status: string) {
  return steps.indexOf(status);
}

export default async function OrderTrackingPage({ params }: Props) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!order) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                Track Order
              </h1>

              <p className="text-gray-500 mt-1">
                Order ID: {order.id}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">
                Total Amount
              </div>

              <div className="text-2xl font-bold text-green-600">
                ₹{(order.total / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold mb-8">
            Delivery Progress
          </h2>

          <div className="flex justify-between items-center overflow-x-auto gap-4">

            {steps.map((step, index) => {
              const completed = index <= currentStep;

              return (
                <div
                  key={step}
                  className="flex-1 min-w-[120px] text-center"
                >
                  <div
                    className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold
                    ${
                      completed
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="mt-3 text-sm font-medium capitalize">
                    {step.replaceAll('_', ' ')}
                  </div>

                  {completed && (
                    <div className="text-xs text-green-600 mt-1">
                      Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Delivery Address
          </h2>

          <p className="text-gray-700 leading-7">
            {order.shipping_address}
          </p>
        </div>

        {/* Fake Live Tracking */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Live Delivery Status
          </h2>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-medium">
              🚚 Your order is currently in Jaipur Hub
            </p>

            <p className="text-sm text-gray-600 mt-2">
              Estimated delivery in 25-35 minutes
            </p>
          </div>
        </div>

        {/* Google Map */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Delivery Location
          </h2>

          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              order.shipping_address
            )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="350"
            style={{ border: 0, borderRadius: '16px' }}
            loading="lazy"
          />

          <div className="mt-6">
            <Link
              href="/orders"
              className="bg-black text-white px-6 py-3 rounded-xl inline-block"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}