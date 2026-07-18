import React from "react";

export default function ProductProfitTable({ analytics = {} }) {
  const stats = analytics.productProfitStats || [];

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Profit by Product</h2>

      {stats.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No profit data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-pink-200">
              <tr>
                <th className="text-left py-3 px-4 font-bold text-gray-700">
                  Product
                </th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">
                  Cost
                </th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">
                  Profit
                </th>
                <th className="text-right py-3 px-4 font-bold text-gray-700">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((item) => {
                const margin =
                  item.totalRevenue > 0
                    ? ((item.profit / item.totalRevenue) * 100).toFixed(1)
                    : 0;
                return (
                  <tr key={item.name} className="border-b border-pink-100 hover:bg-pink-50">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.name}
                    </td>
                    <td className="text-right py-3 px-4 text-pink-600 font-bold">
                      ${item.totalRevenue?.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${item.totalMaterialCost?.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600 font-bold">
                      ${item.profit?.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-xs">
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
