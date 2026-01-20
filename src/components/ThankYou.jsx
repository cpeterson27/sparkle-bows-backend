import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.config";

export default function ThankYou() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return <p className="text-center my-8">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h2 className="text-4xl font-bold text-pink-600">Thank you for your order!</h2>
      <p className="text-gray-700 my-4">
        Your order <span className="font-semibold">{order._id}</span> has been placed successfully.
      </p>
      <p className="text-gray-600 mb-6">We’ll email you updates about your order status.</p>

      <Link
        to={`/orders/${order._id}`}
        className="bg-pink-500 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-600 transition"
      >
        View Order Details
      </Link>
    </div>
  );
}
