import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage({ onRefresh }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleBackToShop = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={handleBackToShop}
          className="mb-6 inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Shop
        </button>

        <AdminDashboard onRefresh={handleRefresh} />

        {loading && (
          <p className="mt-4 text-center text-pink-600 font-semibold">
            Syncing updates…
          </p>
        )}
      </div>
    </div>
  );
}
