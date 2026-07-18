import React from "react";
import { AlertTriangle } from "lucide-react";

export default function LowStockAlert({ products = [] }) {
  const lowStockProducts = products.filter((p) => (p.stock || 0) < 5);

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h3 className="font-bold text-gray-900">Low Stock Alert</h3>
      </div>
      <div className="space-y-2">
        {lowStockProducts.map((product) => (
          <p key={product._id} className="text-sm text-gray-700">
            <span className="font-bold">{product.name}</span> - Only {product.stock}{" "}
            left in stock
          </p>
        ))}
      </div>
    </div>
  );
}
