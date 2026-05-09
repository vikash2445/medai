import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function OrderTrackingPage({
  params,
}: Props) {

  const { id } = await params;

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!order) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold">
          Order not found
        </h1>

        <Link
          href="/orders"
          className="mt-6 inline-block bg-black text-white px-6 py-3 rounded-xl"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 border border-gray-100">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                📦 Live Order Tracking
              </div>

              <h1 className="text-4xl font-bold text-gray-900">
                Track Your Order
              </h1>

              <p className="text-gray-500 mt-2 break-all">
                Order ID: {order.id}
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl px-6 py-5 border border-green-100">
              <div className="text-sm text-gray-500">
                Total Amount
              </div>

              <div className="text-3xl font-bold text-green-600 mt-1">
                ₹{(order.total / 100).toFixed(2)}
              </div>
            </div>

          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 border border-gray-100">

          <h2 className="text-2xl font-bold mb-10">
            Delivery Progress
          </h2>

          <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-6">

            {steps.map((step, index) => {

              const completed = index <= currentStep;

              return (
                <div
                  key={step}
                  className="flex-1 min-w-[120px] text-center relative"
                >

                  {/* Line */}
                  {index !== steps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-6 left-[60%] w-full h-1 ${
                        completed
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}

                  {/* Circle */}
                  <div
                    className={`relative z-10 w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                      completed
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    {completed ? '✓' : index + 1}
                  </div>

                  {/* Text */}
                  <div className="mt-4">

                    <div className="font-semibold capitalize text-sm">
                      {step.replaceAll('_', ' ')}
                    </div>

                    <div
                      className={`text-xs mt-1 ${
                        completed
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {completed
                        ? 'Completed'
                        : 'Pending'}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Status */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 border border-gray-100">

          <h2 className="text-2xl font-bold mb-6">
            Live Delivery Status
          </h2>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl">
                🚚
              </div>

              <div>
                <h3 className="font-bold text-lg text-green-700">
                  Your order is on the way
                </h3>

                <p className="text-gray-600 mt-1">
                  Estimated delivery in 25-35 minutes
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Customer */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">

            <h2 className="text-2xl font-bold mb-6">
              Customer Details
            </h2>

            <div className="space-y-5">

              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Name
                </div>

                <div className="font-semibold text-lg">
                  {order.customer_name}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Phone
                </div>

                <div className="font-semibold text-lg">
                  {order.customer_phone}
                </div>
              </div>

              {order.customer_email && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Email
                  </div>

                  <div className="font-semibold text-lg break-all">
                    {order.customer_email}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">

            <h2 className="text-2xl font-bold mb-6">
              Delivery Address
            </h2>

            <div className="flex gap-4">

              <div className="text-3xl">
                📍
              </div>

              <div className="text-gray-700 leading-8 text-lg">
                {order.shipping_address}
              </div>

            </div>
          </div>

        </div>

        {/* Google Map */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">

          <h2 className="text-2xl font-bold mb-6">
            Delivery Location
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-200">

            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                order.shipping_address
              )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
            />

          </div>

          <div className="mt-8 flex flex-wrap gap-4">

            <Link
              href="/orders"
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              ← Back to Orders
            </Link>

            <Link
              href="/store"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Shop Again
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}