// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import AdminForm from "./AdminForm";
import ConfirmModal from "./ConfirmModal";

export default function AdminDashboard({ user, onRefresh }) {
  const [bows, setBows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBow, setEditingBow] = useState(null);
  const [confirmDeleteBow, setConfirmDeleteBow] = useState(null);

  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Fetch products when component loads
   const fetchBows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/products`);
      const data = await res.json();
      setBows(data);
    } catch (err) {
      console.error("Error fetching bows:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchBows();
  }, [fetchBows]);


  const calculateTotalProfit = (bow) =>
    (bow.price - bow.materialCost) * (bow.sales || 0);
  const calculateRevenue = (bow) => bow.price * (bow.sales || 0);

  const totalBows = bows.length;
  const totalInventory = bows.reduce((sum, b) => sum + b.inventory, 0);
  const totalRevenue = bows.reduce((sum, b) => sum + calculateRevenue(b), 0);
  const totalProfit = bows.reduce((sum, b) => sum + calculateTotalProfit(b), 0);
  const lowStockCount = bows.filter((b) => b.inventory <= 5).length;

  const handleDelete = async () => {
    if (!confirmDeleteBow) return;

    try {
      const productId = confirmDeleteBow._id || confirmDeleteBow.id;
      const token = localStorage.getItem("accessToken");
      
      const response = await fetch(`${backendUrl}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBows((prev) =>
          prev.filter((p) => p._id !== productId && p.id !== productId)
        );
        setConfirmDeleteBow(null);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleFormSuccess = () => {
    setEditingBow(null);
    fetchBows();
    if (onRefresh) onRefresh();
  };

  const handleCancelEdit = () => {
    setEditingBow(null);
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-pink-300">
        {/* Title - No duplicate back button, header has it */}
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-8 text-center">
          Admin Dashboard
        </h1>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-6 rounded-2xl shadow-lg text-center border-2 border-pink-300">
            <p className="text-gray-600 font-semibold mb-2">Total Bows</p>
            <p className="text-3xl font-bold text-pink-600">{totalBows}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-2xl shadow-lg text-center border-2 border-purple-300">
            <p className="text-gray-600 font-semibold mb-2">Inventory</p>
            <p className="text-3xl font-bold text-purple-600">{totalInventory}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl shadow-lg text-center border-2 border-blue-300">
            <p className="text-gray-600 font-semibold mb-2">Revenue</p>
            <p className="text-3xl font-bold text-blue-600">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl shadow-lg text-center border-2 border-green-300">
            <p className="text-gray-600 font-semibold mb-2">Profit</p>
            <p className="text-3xl font-bold text-green-600">${totalProfit.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-2xl shadow-lg text-center border-2 border-red-300">
            <p className="text-gray-600 font-semibold mb-2">Low Stock</p>
            <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
          </div>
        </div>

        {/* Admin Form */}
        <div className="mb-8">
          {editingBow ? (
            <div className="mb-6">
              <button
                onClick={() => setEditingBow(null)}
                className="mb-4 cursor-pointer bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full font-bold transition-all"
              >
                Cancel Edit
              </button>
              <AdminForm
                productToEdit={editingBow}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelEdit}
              />
            </div>
          ) : (
            <AdminForm onSuccess={handleFormSuccess} />
          )}
        </div>

        {/* Bows Table */}
        <div className="overflow-x-auto rounded-2xl border-2 border-pink-300">
          <table className="w-full table-auto border-collapse bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-pink-200 to-purple-200">
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Name</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Price</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Material Cost</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Profit/Unit</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Inventory</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Sales</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Total Profit</th>
                <th className="border border-pink-300 px-4 py-3 text-left font-bold text-pink-700">Category</th>
                <th className="border border-pink-300 px-4 py-3 text-center font-bold text-pink-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-pink-600">
                    Loading bows...
                  </td>
                </tr>
              ) : bows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-600">
                    No bows found. Add your first bow above! 🎀
                  </td>
                </tr>
              ) : (
                bows.map((b) => (
                  <tr key={b._id} className="hover:bg-pink-50 transition-colors">
                    <td className="border border-pink-200 px-4 py-3">{b.name}</td>
                    <td className="border border-pink-200 px-4 py-3">${b.price.toFixed(2)}</td>
                    <td className="border border-pink-200 px-4 py-3">${b.materialCost.toFixed(2)}</td>
                    <td className="border border-pink-200 px-4 py-3 font-semibold text-green-600">
                      ${(b.price - b.materialCost).toFixed(2)}
                    </td>
                    <td className={`border border-pink-200 px-4 py-3 ${b.inventory <= 5 ? 'text-red-600 font-bold' : ''}`}>
                      {b.inventory}
                    </td>
                    <td className="border border-pink-200 px-4 py-3">{b.sales || 0}</td>
                    <td className="border border-pink-200 px-4 py-3 font-semibold text-blue-600">
                      ${calculateTotalProfit(b).toFixed(2)}
                    </td>
                    <td className="border border-pink-200 px-4 py-3 capitalize">{b.category}</td>
                    <td className="border border-pink-200 px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-blue-500 cursor-pointer text-black px-3 py-1 rounded-full hover:bg-blue-600 transition font-semibold text-sm"
                          onClick={() => setEditingBow(b)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition font-semibold text-sm cursor-pointer"
                          onClick={() => setConfirmDeleteBow(b)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDeleteBow && (
        <ConfirmModal
          productName={confirmDeleteBow.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteBow(null)}
        />
      )}
    </div>
  );
}