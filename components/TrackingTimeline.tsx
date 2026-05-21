'use client';

interface Props {
  tracking: any[];
}

export default function TrackingTimeline({
  tracking,
}: Props) {
  return (
    <div className="mt-4 border rounded-xl p-4 bg-gray-50">
      <h3 className="font-semibold mb-4">
        Order Tracking
      </h3>

      <div className="space-y-4">
        {tracking.map((item, index) => (
          <div
            key={item.id}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-green-600"></div>

              {index !== tracking.length - 1 && (
                <div className="w-1 h-10 bg-green-300"></div>
              )}
            </div>

            <div>
              <p className="font-medium">
                {item.status}
              </p>

              <p className="text-sm text-gray-500">
                {item.note}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {new Date(
                  item.created_at
                ).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}