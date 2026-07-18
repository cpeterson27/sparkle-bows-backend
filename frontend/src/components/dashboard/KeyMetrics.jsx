import React from "react";
import { TrendingUp, ShoppingCart, DollarSign, Package } from "lucide-react";

export default function KeyMetrics({ analytics }) {
  const metrics = [
    {
      label: "Total Revenue",
      value: `$${(analytics?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      label: "Total Profit",
      value: `$${(analytics?.totalProfit || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Total Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingCart,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Products Sold",
      value: analytics?.totalProductsSold || 0,
      icon: Package,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {metric.value}
                </p>
              </div>
              <div className={`${metric.color} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${metric.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
