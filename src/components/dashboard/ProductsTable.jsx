import React, { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ProductsTable({ products = [], onEdit, onDelete, onAdd }) {
  const [sortBy, setSortBy] = useState("name");

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "stock") return a.stock - b.stock;
    return 0;
  });

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Products</h2>
        <button
          onClick={onAdd}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {["name", "price", "stock"].map((col) => (
          <button
            key={col}
            onClick={() => setSortBy(col)}
            className={`px-3 py-1 rounded text-sm font-bold ${
              sortBy === col
                ? "bg-pink-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {col.charAt(0).toUpperCase() + col.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-pink-200">
            <tr>
              <th className="text-left py-3 px-4 font-bold text-gray-700">Name</th>
              <th className="text-right py-3 px-4 font-bold text-gray-700">Price</th>
              <th className="text-right py-3 px-4 font-bold text-gray-700">Stock</th>
              <th className="text-center py-3 px-4 font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => (
              <tr key={product._id} className="border-b border-pink-100 hover:bg-pink-50">
                <td className="py-3 px-4">{product.name}</td>
                <td className="text-right py-3 px-4 font-bold text-pink-600">
                  ${product.price?.toFixed(2)}
                </td>
                <td className="text-right py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.stock < 5
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="text-center py-3 px-4 flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(product._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
