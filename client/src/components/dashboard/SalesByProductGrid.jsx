import React from "react";

export default function SalesByProductGrid({ products = [] }) {
  const topProducts = [...products]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Sales by Product</h2>

      {topProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No sales data</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topProducts.map((product) => {
            const totalSalesValue = (product.price || 0) * (product.sold || 0);
            return (
              <div
                key={product._id}
                className="border border-pink-100 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-900 flex-1">{product.name}</h3>
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-bold">
                    {product.sold || 0} sold
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Price: <span className="font-bold text-pink-600">${product.price?.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Sales:{" "}
                    <span className="font-bold text-green-600">
                      ${totalSalesValue.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
