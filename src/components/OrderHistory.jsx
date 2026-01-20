import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.config";
import { AuthContext } from "../context/AuthContext";

export default function OrderHistory() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/api/orders/my");
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <p className="text-center my-8">Loading orders…</p>;
  }

  if (!orders.length) {
    return (
      <p className="text-center my-8 text-gray-600">
        You haven’t placed any orders yet!
      </p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h2 className="text-3xl font-bold text-pink-600 text-center">
        Your Orders
      </h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order._id}
            to={`/orders/${order._id}`}
            className="block bg-white p-4 rounded-lg border shadow-sm hover:shadow-lg transition"
          >
            <div className="flex justify-between">
              <span className="font-semibold">Order #{order._id}</span>
              <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-gray-700">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} — Total: ${order.total.toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
