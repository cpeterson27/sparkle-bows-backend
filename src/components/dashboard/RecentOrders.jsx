import React from "react";
import { format } from "date-fns";

export default function RecentOrders({ orders = [] }) {
  const recent = orders.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Orders</h2>

      {recent.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {recent.map((order) => (
            <div
              key={order._id}
              className="border border-pink-100 rounded-lg p-4 hover:bg-pink-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">Order #{order._id?.slice(-6)}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {order.createdAt
                      ? format(new Date(order.createdAt), "MMM dd, yyyy")
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pink-600">
                    ${(order.total || 0).toFixed(2)}
                  </p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
                    Paid
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
