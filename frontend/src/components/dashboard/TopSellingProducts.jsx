import React from "react";

export default function TopSellingProducts({ products = [] }) {
  const topSelling = [...products]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Top Selling Products</h2>

      {topSelling.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No sales yet</p>
      ) : (
        <div className="space-y-4">
          {topSelling.map((product, idx) => (
            <div key={product._id} className="border border-pink-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-2xl text-pink-300">#{idx + 1}</span>
                  <div>
                    <p className="font-bold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      ${product.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-pink-600">
                    {product.sold || 0}
                  </p>
                  <p className="text-xs text-gray-500">units sold</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
