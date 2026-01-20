import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.config";

export default function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <p className="text-center my-8">Loading order…</p>;
  if (!order) return <p className="text-center my-8 text-red-500">Order not found.</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/orders" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Orders
      </Link>

      <h2 className="text-3xl font-bold text-pink-600 mb-4">Order #{order._id}</h2>
      <p className="text-gray-600 mb-6">
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        {order.items.map((item) => (
          <div key={item.productId._id} className="flex items-center gap-4">
            <img
              src={item.productId.images?.[0]?.url}
              alt={item.productId.name}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-semibold">{item.productId.name}</p>
              <p className="text-sm text-gray-600">
                Quantity: {item.quantity}
              </p>
            </div>
            <p className="font-bold">${(item.productId.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 text-right font-bold text-xl text-pink-600">
        Total: ${order.total.toFixed(2)}
      </div>
    </div>
  );
}
