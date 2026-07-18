import React from "react";

export default function ProfitCost({ analytics = {} }) {
  const totalCost = analytics.totalMaterialCost || 0;
  const totalRevenue = analytics.totalRevenue || 0;
  const totalProfit = analytics.totalProfit || 0;

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <p className="text-gray-600 text-sm font-medium mb-2">Total Cost</p>
        <p className="text-3xl font-bold text-orange-600">${totalCost.toFixed(2)}</p>
      </div>

      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <p className="text-gray-600 text-sm font-medium mb-2">Total Revenue</p>
        <p className="text-3xl font-bold text-pink-600">${totalRevenue.toFixed(2)}</p>
      </div>

      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6">
        <p className="text-gray-600 text-sm font-medium mb-2">Profit Margin</p>
        <p className="text-3xl font-bold text-green-600">{profitMargin}%</p>
      </div>
    </div>
  );
}
