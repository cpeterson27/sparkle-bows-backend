import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50/50">
      <h1 className="text-6xl font-extrabold text-pink-600 mb-4">404</h1>
      <p className="text-2xl text-gray-600 mb-6">Oops! Page not found.</p>
      <Link to="/admin/products" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-all">
        Go Back to Products
      </Link>
    </div>
  );
}
