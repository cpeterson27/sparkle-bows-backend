import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.config";

function getStatusTone(status = "") {
  switch (status) {
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "shipped":
      return "bg-sky-100 text-sky-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getStatusLabel(status = "") {
  switch (status) {
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Payment pending";
  }
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log("Fetching orders from /api/orders/my...");
        const res = await api.get("/api/orders/my");
        console.log("Orders response:", res.data);
        setOrders(res.data);
      } catch (err) {
        console.error(
          "Error fetching orders:",
          err.response?.data || err.message,
        );
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-semibold">Order #{order._id}</span>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="mt-3 text-gray-700">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} —
              Total: ${order.total.toFixed(2)}
            </p>
            {order.status === "pending" && (
              <p className="mt-2 text-sm text-amber-700">
                This checkout was started, but payment has not been completed.
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
