// src/components/dashboard/AnalyticsCharts.jsx
import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  ShoppingCart,
} from "lucide-react";

const COLORS = ["#ec4899","#8b5cf6","#10b981","#f59e0b","#3b82f6","#ef4444"];

// ─── Shared styles ────────────────────────────────────────────────────────────
const card = "bg-white rounded-2xl border border-gray-200 shadow-sm p-6";

function ChartTitle({ children }) {
  return <p className="text-sm font-bold text-gray-700 mb-5">{children}</p>;
}

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center">
        <Icon className="w-4 h-4 text-pink-500" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Growth Metric Tile ───────────────────────────────────────────────────────
function MetricTile({ label, value, sub, color }) {
  const colors = {
    pink:   "bg-pink-50   border-pink-200   text-pink-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    green:  "bg-emerald-50 border-emerald-200 text-emerald-600",
    amber:  "bg-amber-50  border-amber-200  text-amber-600",
    blue:   "bg-blue-50   border-blue-200   text-blue-600",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || colors.pink}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">{label}</p>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      {sub && <p className="text-xs mt-1.5 opacity-60 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Chart components ─────────────────────────────────────────────────────────
function RevenueVsProfit({ data }) {
  return (
    <div className={card}>
      <ChartTitle>Revenue vs Profit by Product</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="totalRevenue" name="Revenue" fill="#8b5cf6" radius={[4,4,0,0]} />
          <Bar dataKey="profit"       name="Profit"  fill="#10b981" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueTrend({ data }) {
  return (
    <div className={card}>
      <ChartTitle>Revenue & Profit — Last 30 Days</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit"  name="Profit"  stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyRevenue({ data }) {
  return (
    <div className={card}>
      <ChartTitle>Monthly Revenue & Profit (This Year)</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="revenue" name="Revenue" fill="#ec4899" radius={[4,4,0,0]} />
          <Bar dataKey="profit"  name="Profit"  fill="#10b981" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProfitDistribution({ data }) {
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  return (
    <div className={card}>
      <ChartTitle>Profit Distribution by Product</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="profit" nameKey="name" cx="50%" cy="50%"
            outerRadius={90} innerRadius={45} labelLine={false} label={renderLabel}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProductRevenueCost({ data }) {
  return (
    <div className={card}>
      <ChartTitle>Product Revenue vs Cost</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="totalRevenue"      name="Revenue" fill="#ec4899" radius={[4,4,0,0]} />
          <Bar dataKey="totalMaterialCost" name="Cost"    fill="#f97316" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrdersByDayOfWeek({ data }) {
  return (
    <div className={card}>
      <ChartTitle>Orders by Day of Week</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(0,3)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="orders"  name="Orders"  fill="#8b5cf6" radius={[4,4,0,0]} />
          <Bar dataKey="revenue" name="Revenue" fill="#ec4899" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrderStatusBreakdown({ data }) {
  const statusColors = {
    pending:    "#f59e0b",
    processing: "#3b82f6",
    shipped:    "#8b5cf6",
    delivered:  "#10b981",
    cancelled:  "#ef4444",
  };
  const colored = data.map((d) => ({
    ...d,
    name: d.status,
    value: d.count,
    fill: statusColors[d.status] || "#6b7280",
  }));
  return (
    <div className={card}>
      <ChartTitle>Order Status Breakdown</ChartTitle>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={colored} dataKey="value" nameKey="name" cx="50%" cy="50%"
            outerRadius={90} innerRadius={45}>
            {colored.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopCustomers({ data }) {
  if (!data?.length) return null;
  return (
    <div className={card}>
      <ChartTitle>Top Customers by Lifetime Value</ChartTitle>
      <div className="space-y-3">
        {data.map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.name || "Guest"}</p>
                <p className="text-xs text-gray-400">{c.email} · {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-emerald-600">${c.totalSpent?.toFixed(2)}</p>
              <p className="text-xs text-gray-400">AOV ${c.avgOrderValue?.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsCharts({ analytics }) {
  const [tab, setTab] = useState("financial");

  const stats = analytics.productProfitStats?.length > 0
    ? analytics.productProfitStats
    : [{ name: "No data", totalRevenue: 0, profit: 0, totalMaterialCost: 0 }];

  const days = analytics.salesByDay?.length > 0
    ? analytics.salesByDay
    : [{ date: "—", revenue: 0, profit: 0 }];

  const monthly = analytics.monthlyRevenue?.length > 0
    ? analytics.monthlyRevenue
    : [];

  const dowData = analytics.ordersByDayOfWeek?.length > 0
    ? analytics.ordersByDayOfWeek
    : [];

  const statusData = analytics.orderStatusBreakdown?.length > 0
    ? analytics.orderStatusBreakdown
    : [];

  // Growth metric tiles
  const aov = analytics.aov || 0;
  const avgCLV = analytics.avgCLV || 0;
  const returningRate = analytics.returningCustomerRate || 0;
  const profitMargin = analytics.profitMargin || 0;
  const totalCustomers = analytics.totalCustomers || 0;

  return (
    <div className="space-y-10">

      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {[
          { id: "financial", label: "📊 Financial" },
          { id: "growth",    label: "🚀 Growth" },
          { id: "orders",    label: "📦 Orders" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Financial Tab ─────────────────────────────────────────────────── */}
      {tab === "financial" && (
        <div className="space-y-6">
          <SectionHeading icon={TrendingUp} title="Financial Analytics" subtitle="Revenue, profit, and cost breakdown" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
            <RevenueVsProfit data={stats} />
            <RevenueTrend data={days} />
            <ProfitDistribution data={stats} />
            <ProductRevenueCost data={stats} />
          </div>
          {monthly.length > 0 && (
            <MonthlyRevenue data={monthly} />
          )}
        </div>
      )}

      {/* ── Growth Tab ────────────────────────────────────────────────────── */}
      {tab === "growth" && (
        <div className="space-y-6">
          <SectionHeading icon={Users} title="Growth Metrics" subtitle="Customer behavior and business health" />

          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricTile
              label="Avg Order Value"
              value={`$${aov.toFixed(2)}`}
              sub="Per completed order"
              color="pink"
            />
            <MetricTile
              label="Avg Customer LTV"
              value={`$${avgCLV.toFixed(2)}`}
              sub="Lifetime spend per customer"
              color="purple"
            />
            <MetricTile
              label="Returning Customers"
              value={`${returningRate}%`}
              sub={`${analytics.returningCustomers || 0} of ${totalCustomers} customers`}
              color="green"
            />
            <MetricTile
              label="Profit Margin"
              value={`${profitMargin}%`}
              sub="Overall across all orders"
              color="amber"
            />
          </div>

          {/* Top customers */}
          <TopCustomers data={analytics.topCustomers} />

          {/* Day of week */}
          {dowData.length > 0 && <OrdersByDayOfWeek data={dowData} />}
        </div>
      )}

      {/* ── Orders Tab ────────────────────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="space-y-6">
          <SectionHeading icon={ShoppingCart} title="Order Analytics" subtitle="Status breakdown and trends" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {statusData.length > 0 && <OrderStatusBreakdown data={statusData} />}
            {dowData.length > 0 && <OrdersByDayOfWeek data={dowData} />}
          </div>
          {monthly.length > 0 && <MonthlyRevenue data={monthly} />}
        </div>
      )}

    </div>
  );
}
