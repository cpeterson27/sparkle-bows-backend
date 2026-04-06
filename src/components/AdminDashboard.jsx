import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PlusCircle,
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Receipt,
  Wallet,
  Landmark,
  Truck,
  PiggyBank,
  CalendarDays,
  Download,
  Globe,
} from "lucide-react";
import AdminForm from "./AdminForm";
import ConfirmModal from "./ConfirmModal";
import AnalyticsCharts from "./dashboard/AnalyticsCharts";
import api from "../api/axios.config";
import SiteSettingsForm from "./SiteSettingsForm";

// ─── Sidebar Navigation ───────────────────────────────────────────────────────

function Sidebar({ activeView, setActiveView, lowStockCount }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "products", label: "Products", icon: Package },
    { id: "add-product", label: "Add Product", icon: PlusCircle },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "finance", label: "Finance", icon: PiggyBank },
    { id: "site-settings", label: "Site Settings", icon: Globe },
  ];

  return (
    <div className="w-64 bg-slate-950 text-slate-100 min-h-screen flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
          Store Admin
        </div>
        <h1 className="mt-4 text-lg font-semibold flex items-center gap-2 text-white">
          Sparkle Bows
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Orders, inventory, and growth in one place
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={isActive ? { backgroundColor: "#db2777" } : {}}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-900 hover:text-rose-200"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.id === "products" && lowStockCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0">
            A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">Admin</p>
              <p className="text-xs text-slate-400">Store Owner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color,
}) {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color] || colorClasses.blue}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 mt-4 text-sm ${trendUp ? "text-green-600" : "text-red-600"}`}
        >
          <TrendingUp className={`w-4 h-4 ${!trendUp && "rotate-180"}`} />
          <span className="font-medium">{trend}</span>
        </div>
      )}
    </div>
  );
}

function FinancePulseCard({ title, value, subtitle, tone = "slate", icon: Icon }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            {title}
          </p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
          {subtitle ? <p className="mt-2 text-sm opacity-75">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-white/70 p-3 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function toInputDate(value) {
  return value.toISOString().split("T")[0];
}

function getDateRange(preset, customStart, customEnd) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (preset === "custom") {
    return {
      start: customStart || "",
      end: customEnd || "",
    };
  }

  if (preset === "all") {
    return { start: "", end: "" };
  }

  if (preset === "month") {
    start.setDate(1);
  } else if (preset === "quarter") {
    start.setMonth(start.getMonth() - 2);
    start.setDate(1);
  } else {
    start.setDate(start.getDate() - 29);
  }

  return {
    start: toInputDate(start),
    end: toInputDate(end),
  };
}

function isDateInRange(value, start, end) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  if (start) {
    const startDate = new Date(start);
    if (date < startDate) return false;
  }

  if (end) {
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    if (date > endDate) return false;
  }

  return true;
}

function downloadRowsAsCsv(rows, filename) {
  if (!rows?.length) return;

  const headers = Object.keys(rows[0]);
  const escapeValue = (value) => {
    const stringValue = String(value ?? "");
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ─── Search Input ─────────────────────────────────────────────────────────────
// Flexbox keeps icon perfectly vertically centered — no absolute positioning drift

function SearchInput({ placeholder, value, onChange }) {
  return (
    <div className="flex items-center gap-3 flex-1 border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
      <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
      />
    </div>
  );
}

// ─── Orders Table ─────────────────────────────────────────────────────────────

function OrdersTable({ orders, loading, onUpdateStatus, onBuyShippoLabel, shippoLoadingId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    shipped: "bg-purple-100 text-purple-700 border-purple-200",
    delivered: "bg-green-100 text-green-700 border-green-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const filteredOrders =
    orders?.filter((order) => {
      const matchesSearch =
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
        <SearchInput
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Order
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Date
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Customer
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Total
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Profit
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.slice(0, 20).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      #{order._id?.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items?.length || 0} items
                    </p>
                    {order.isGift ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
                        Gift
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {order.customerName || "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.customerEmail || ""}
                    </p>
                    {order.shippingAddress?.name &&
                    order.shippingAddress.name !== order.customerName ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Recipient: {order.shippingAddress.name}
                      </p>
                    ) : null}
                    {order.giftMessage ? (
                      <p className="mt-2 max-w-xs rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                        Note: {order.giftMessage}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${statusColors[order.status] || statusColors.pending}`}
                    >
                      {order.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ${order.total?.toFixed(2) || "0.00"}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatMoney(order.totalProfit ?? order.total ?? 0)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <select
                        value={order.status || "pending"}
                        onChange={(e) =>
                          onUpdateStatus(order._id, e.target.value)
                        }
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => onBuyShippoLabel(order._id)}
                        disabled={shippoLoadingId === order._id}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {shippoLoadingId === order._id ? "Buying label..." : "Buy Shippo Label"}
                      </button>
                      {order.shippingLabelUrl ? (
                        <a
                          href={order.shippingLabelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-rose-600 hover:text-rose-700"
                        >
                          Open label PDF
                        </a>
                      ) : null}
                      {order.trackingNumber ? (
                        <p className="text-xs text-slate-500">
                          Tracking: {order.trackingNumber}
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products Table (Inventory) ───────────────────────────────────────────────

function ProductsInventory({ bows, loading, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories =
    [...new Set(bows?.map((b) => b.category).filter(Boolean))] || [];

  const filteredProducts =
    bows?.filter((product) => {
      const matchesSearch = product.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }) || [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
        <SearchInput
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Product
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Category
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Price
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Cost
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Margin
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Stock
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const margin =
                  product.price > 0
                    ? (
                        ((product.price - product.materialCost) /
                          product.price) *
                        100
                      ).toFixed(1)
                    : "0.0";
                const isLowStock = product.inventory <= 5;
                const isOutOfStock = product.inventory === 0;

                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url || "/placeholder.png"}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.sales || 0} sold
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ${product.price?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      ${product.materialCost?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${parseFloat(margin) >= 50 ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {margin}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-gray-900"}`}
                      >
                        {product.inventory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseForm({ onSave, saving }) {
  const [form, setForm] = useState({
    type: "supplies",
    amount: "",
    description: "",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave({
      ...form,
      amount: Number(form.amount),
    });
    setForm({
      type: "supplies",
      amount: "",
      description: "",
      vendor: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-5">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Expense Type
        </span>
        <select
          value={form.type}
          onChange={(event) =>
            setForm((current) => ({ ...current, type: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
        >
          <option value="supplies">Supplies</option>
          <option value="shipping">Shipping</option>
          <option value="marketing">Marketing</option>
          <option value="hosting">Hosting</option>
          <option value="domain">Domain</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Amount
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={form.amount}
          onChange={(event) =>
            setForm((current) => ({ ...current, amount: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
          placeholder="49.99"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Vendor
        </span>
        <input
          value={form.vendor}
          onChange={(event) =>
            setForm((current) => ({ ...current, vendor: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
          placeholder="Michaels, USPS, Canva"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Date
        </span>
        <input
          type="date"
          value={form.date}
          onChange={(event) =>
            setForm((current) => ({ ...current, date: event.target.value }))
          }
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <label className="block xl:col-span-1">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Description
        </span>
        <input
          required
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
          placeholder="Ribbon restock or ad creative"
        />
      </label>

      <div className="md:col-span-2 xl:col-span-5 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          <Receipt className="h-4 w-4" />
          {saving ? "Saving..." : "Record Expense"}
        </button>
      </div>
    </form>
  );
}

function ExpenseTable({ expenses, loading, onDelete }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Loading expenses...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Vendor
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Description
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!expenses.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  No expenses recorded yet. Start with shipping, supplies, and marketing.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {expense.date
                      ? new Date(expense.date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                      {expense.type?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {expense.vendor || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-950">
                    {formatMoney(expense.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onDelete(expense)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard({ user, onRefresh }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [bows, setBows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBow, setEditingBow] = useState(null);
  const [confirmDeleteBow, setConfirmDeleteBow] = useState(null);

  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    recentOrders: [],
    topProducts: [],
    salesByDay: [],
    salesByProduct: [],
    productProfitStats: [],
    totalMaterialCost: 0,
    totalProfit: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [datePreset, setDatePreset] = useState("last30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState(toInputDate(new Date()));
  const [exporting, setExporting] = useState("");
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [shippoLoadingId, setShippoLoadingId] = useState("");

  const fetchBows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/products");
      setBows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const range = getDateRange(datePreset, customStart, customEnd);
      const params = {};
      if (range.start) params.start = range.start;
      if (range.end) params.end = range.end;
      const res = await api.get("/api/admin/analytics", { params });
      setAnalytics(res.data);
    } catch (err) {
      console.error(
        "Error fetching analytics:",
        err.response?.data || err.message,
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [customEnd, customStart, datePreset]);

  const fetchExpenses = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const res = await api.get("/api/expenses");
      setExpenses(res.data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  const fetchMonthlyReport = useCallback(async () => {
    try {
      const range = getDateRange(datePreset, customStart, customEnd);
      const reportYear = range.end
        ? new Date(range.end).getFullYear()
        : new Date().getFullYear();
      const res = await api.get("/api/admin/reports/monthly", {
        params: { year: reportYear },
      });
      setMonthlyReport(res.data || []);
    } catch (err) {
      console.error("Error fetching monthly report:", err);
    }
  }, [customEnd, customStart, datePreset]);

  useEffect(() => {
    fetchBows();
    fetchAnalytics();
    fetchExpenses();
    fetchMonthlyReport();
  }, [fetchBows, fetchAnalytics, fetchExpenses, fetchMonthlyReport]);

  const totalBows = bows.length;
  const totalInventory = bows.reduce((sum, b) => sum + b.inventory, 0);
  const lowStockItems = bows.filter((b) => b.inventory <= 5);
  const lowStockCount = lowStockItems.length;

  const handleDelete = async () => {
    if (!confirmDeleteBow) return;
    try {
      const id = confirmDeleteBow._id || confirmDeleteBow.id;
      await api.delete(`/api/products/${id}`);
      setBows((prev) => prev.filter((p) => p._id !== id && p.id !== id));
      setConfirmDeleteBow(null);
      fetchAnalytics();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchAnalytics();
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleBuyShippoLabel = async (orderId) => {
    try {
      setShippoLoadingId(orderId);
      await api.post(`/api/orders/${orderId}/shippo-label`);
      await fetchAnalytics();
    } catch (err) {
      console.error("Failed to buy Shippo label:", err);
      window.alert(
        err.response?.data?.error || "Could not buy a Shippo label for this order.",
      );
    } finally {
      setShippoLoadingId("");
    }
  };

  const handleFormSuccess = () => {
    setEditingBow(null);
    setActiveView("products");
    fetchBows();
    fetchAnalytics();
    if (onRefresh) onRefresh();
  };

  const handleExpenseSave = async (payload) => {
    try {
      setSavingExpense(true);
      await api.post("/api/expenses", payload);
      await Promise.all([fetchExpenses(), fetchAnalytics()]);
    } catch (err) {
      console.error("Failed to save expense:", err);
    } finally {
      setSavingExpense(false);
    }
  };

  const handleExpenseDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await api.delete(`/api/expenses/${expenseToDelete._id}`);
      setExpenseToDelete(null);
      await Promise.all([fetchExpenses(), fetchAnalytics()]);
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const activeRange = getDateRange(datePreset, customStart, customEnd);
  const filteredExpenses = expenses.filter((expense) =>
    isDateInRange(expense.date, activeRange.start, activeRange.end),
  );
  const currentReportYear = activeRange.end
    ? new Date(activeRange.end).getFullYear()
    : new Date().getFullYear();
  const currentMonthSnapshot = monthlyReport.find(
    (entry) =>
      entry.month ===
      new Date().toLocaleString("default", { month: "long" }),
  );

  const handleExport = async (type) => {
    try {
      setExporting(type);
      if (type === "sales") {
        const res = await api.get("/api/admin/export/sales", {
          params: {
            startDate: activeRange.start || undefined,
            endDate: activeRange.end || undefined,
          },
        });
        downloadRowsAsCsv(
          res.data || [],
          `sparkle-bows-sales-${activeRange.start || "all"}-${activeRange.end || "current"}.csv`,
        );
        return;
      }

      if (type === "products") {
        const res = await api.get("/api/admin/export/products");
        downloadRowsAsCsv(res.data || [], "sparkle-bows-products.csv");
        return;
      }

      const res = await api.get("/api/admin/reports/monthly", {
        params: { year: currentReportYear },
      });
      downloadRowsAsCsv(
        res.data || [],
        `sparkle-bows-monthly-report-${currentReportYear}.csv`,
      );
    } catch (err) {
      console.error(`Failed to export ${type}:`, err);
    } finally {
      setExporting("");
    }
  };

  // Calculate metrics
  const avgOrderValue =
    analytics.totalOrders > 0
      ? analytics.totalRevenue / analytics.totalOrders
      : 0;
  const taxReserve = Number(analytics.taxReserveRecommendation || 0);
  const operatingProfit = Number(analytics.estimatedOperatingProfit || 0);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Sparkle Bows Operations
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                  {activeView === "dashboard" && "Business Dashboard"}
                  {activeView === "orders" && "Order Management"}
                  {activeView === "products" && "Inventory Control"}
                  {activeView === "add-product" &&
                    (editingBow ? "Edit Product" : "Add Product")}
                  {activeView === "analytics" && "Sales Analytics"}
                  {activeView === "finance" && "Finance And Tax Control"}
                  {activeView === "site-settings" && "Site Settings"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {activeView === "dashboard" &&
                    "Track revenue, monitor inventory risk, and keep fulfillment moving without digging through raw data."}
                  {activeView === "orders" &&
                    "Review incoming orders, update fulfillment status, and stay on top of customer communication."}
                  {activeView === "products" &&
                    "Manage pricing, cost, margin, and stock so your catalog stays ready to sell."}
                  {activeView === "add-product" &&
                    (editingBow
                      ? "Update an existing product with current pricing, imagery, and inventory details."
                      : "Add a new product with the details your storefront needs to sell confidently.")}
                  {activeView === "analytics" &&
                    "See performance trends, profit signals, and product-level insights to guide growth."}
                  {activeView === "finance" &&
                    "Track expenses, protect cash, and keep clean records for bookkeeping, tax prep, and confident growth."}
                  {activeView === "site-settings" &&
                    "Manage the default SEO metadata, brand schema settings, and Google tracking IDs used across the storefront."}
                </p>
              </div>

              <div className="space-y-3 xl:min-w-[420px]">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Revenue
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      ${analytics.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Orders
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {analytics.totalOrders || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Low Stock
                    </p>
                    <p className="mt-2 text-xl font-semibold text-amber-600">
                      {lowStockCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customers
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {analytics.totalCustomers || 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Reporting window
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Filter analytics and exports by the date range you want to review.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleExport("sales")}
                          disabled={exporting !== ""}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {exporting === "sales" ? "Exporting..." : "Sales CSV"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport("products")}
                          disabled={exporting !== ""}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {exporting === "products" ? "Exporting..." : "Products CSV"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport("monthly")}
                          disabled={exporting !== ""}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" />
                          {exporting === "monthly" ? "Exporting..." : "Monthly Report"}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]">
                      <select
                        value={datePreset}
                        onChange={(event) => setDatePreset(event.target.value)}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
                      >
                        <option value="last30">Last 30 days</option>
                        <option value="month">This month</option>
                        <option value="quarter">This quarter</option>
                        <option value="all">All time</option>
                        <option value="custom">Custom range</option>
                      </select>
                      <input
                        type="date"
                        value={activeRange.start}
                        onChange={(event) => {
                          setDatePreset("custom");
                          setCustomStart(event.target.value);
                        }}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
                      />
                      <input
                        type="date"
                        value={activeRange.end}
                        onChange={(event) => {
                          setDatePreset("custom");
                          setCustomEnd(event.target.value);
                        }}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
	          </div>
	        </div>

	        <div className="p-6 lg:p-8">

        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Revenue"
                value={`$${analytics.totalRevenue?.toFixed(2) || "0.00"}`}
                subtitle={`${analytics.totalOrders} orders`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Orders"
                value={analytics.totalOrders}
                subtitle={`Avg $${avgOrderValue.toFixed(2)}/order`}
                icon={ShoppingBag}
                color="blue"
              />
              <StatCard
                title="Products"
                value={totalBows}
                subtitle={`${totalInventory} total stock`}
                icon={Package}
                color="purple"
              />
              <StatCard
                title="Customers"
                value={analytics.totalCustomers}
                subtitle="Total registered"
                icon={Users}
                color="pink"
              />
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Low Stock Alert</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {lowStockCount} product{lowStockCount !== 1 ? "s" : ""}{" "}
                    running low on inventory
                  </p>
                  <button
                    onClick={() => setActiveView("products")}
                    className="text-sm font-medium text-orange-800 underline mt-2 hover:text-orange-900"
                  >
                    View products →
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Owner Finance Snapshot
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FinancePulseCard
                    title="Operating Profit"
                    value={formatMoney(operatingProfit)}
                    subtitle="Profit after material and recorded operating expenses."
                    tone={operatingProfit >= 0 ? "emerald" : "rose"}
                    icon={Wallet}
                  />
                  <FinancePulseCard
                    title="Tax Reserve"
                    value={formatMoney(taxReserve)}
                    subtitle="Suggested 25% reserve from operating profit for tax planning."
                    tone="amber"
                    icon={Landmark}
                  />
                  <FinancePulseCard
                    title="Sales Tax Collected"
                    value={formatMoney(analytics.totalTaxCollected)}
                    subtitle="Amount collected on orders and not yours to spend."
                    tone="slate"
                    icon={Receipt}
                  />
                  <FinancePulseCard
                    title="Shipping Collected"
                    value={formatMoney(analytics.totalShippingCollected)}
                    subtitle="Customer shipping revenue collected through checkout."
                    tone="slate"
                    icon={Truck}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Cash Discipline
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">
                      What to watch this week
                    </h2>
                  </div>
                  <Landmark className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-600">
                      Recorded expenses
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {formatMoney(analytics.totalExpenses)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-600">
                      Stripe fees
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {formatMoney(analytics.totalStripeFees)}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    Keep your tax reserve separate, record every supply and
                    marketing expense, and review low-margin products before
                    scaling ad spend.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Orders
                </h2>
                <button
                  onClick={() => setActiveView("orders")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {analytics.recentOrders?.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    className="rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                        #{order._id?.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                        {order.customerName || "Unknown"} ·{" "}
                        {order.items?.length || 0} items
                        </p>
                        {order.isGift ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                            Gift order
                          </p>
                        ) : null}
                        {order.giftMessage ? (
                          <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                            Note: {order.giftMessage}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                        ${order.total?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                        {order.status || "pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">
                    No orders yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders View */}
        {activeView === "orders" && (
          <OrdersTable
            orders={analytics.recentOrders}
            loading={analyticsLoading}
            onUpdateStatus={handleOrderStatusUpdate}
            onBuyShippoLabel={handleBuyShippoLabel}
            shippoLoadingId={shippoLoadingId}
          />
        )}

        {/* Products/Inventory View */}
        {activeView === "products" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 font-medium">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalBows}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 font-medium">Total Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalInventory}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 font-medium">
                  Low Stock Items
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {lowStockCount}
                </p>
              </div>
            </div>

            <ProductsInventory
              bows={bows}
              loading={loading}
              onEdit={(bow) => {
                setEditingBow(bow);
                setActiveView("add-product");
              }}
              onDelete={setConfirmDeleteBow}
            />
          </div>
        )}

        {/* Add Product View - Full Width */}
        {activeView === "add-product" && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingBow ? "Edit Product" : "Add New Product"}
                </h2>
                {editingBow && (
                  <button
                    onClick={() => {
                      setEditingBow(null);
                      setActiveView("products");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    ← Back to products
                  </button>
                )}
              </div>
              <AdminForm
                productToEdit={editingBow}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setEditingBow(null);
                  setActiveView("products");
                }}
              />
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === "analytics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Revenue"
                value={`$${analytics.totalRevenue?.toFixed(2) || "0.00"}`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Total Orders"
                value={analytics.totalOrders}
                icon={ShoppingBag}
                color="blue"
              />
              <StatCard
                title="Total Profit"
                value={`$${analytics.totalProfit?.toFixed(2) || "0.00"}`}
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                title="Customers"
                value={analytics.totalCustomers}
                icon={Users}
                color="pink"
              />
            </div>

            {!analyticsLoading && <AnalyticsCharts analytics={analytics} />}

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Top customers
                </p>
                <div className="mt-5 space-y-3">
                  {(analytics.topCustomers || []).slice(0, 5).map((customer) => (
                    <div
                      key={customer._id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-950">
                          {customer.name || customer._id || "Customer"}
                        </p>
                        <p className="text-xs text-slate-500">{customer._id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-950">
                          {formatMoney(customer.totalSpent)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customer.orderCount} orders
                        </p>
                      </div>
                    </div>
                  ))}
                  {!analytics.topCustomers?.length && (
                    <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Top customer data will appear as orders build up.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {currentReportYear} monthly snapshot
                </p>
                <div className="mt-5 space-y-3">
                  {(monthlyReport || []).slice(0, 6).map((month) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-950">
                          {month.month}
                        </p>
                        <p className="text-xs text-slate-500">
                          {month.orders} orders · {month.itemsSold} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-950">
                          {formatMoney(month.revenue)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Profit {formatMoney(month.profit)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "site-settings" && (
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                SEO and Analytics
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Site Settings
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Manage default meta tags, the brand information used in structured data, and your Google Analytics or Tag Manager IDs from one place.
              </p>
            </div>
            <SiteSettingsForm />
          </div>
        )}

        {activeView === "finance" && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-4">
              <FinancePulseCard
                title="Recorded Expenses"
                value={formatMoney(analytics.totalExpenses)}
                subtitle="Everything logged through your finance center."
                tone="slate"
                icon={Receipt}
              />
              <FinancePulseCard
                title="Stripe Fees"
                value={formatMoney(analytics.totalStripeFees)}
                subtitle="Payment processing costs affecting margin."
                tone="rose"
                icon={Wallet}
              />
              <FinancePulseCard
                title="Operating Profit"
                value={formatMoney(operatingProfit)}
                subtitle="Revenue minus product cost and recorded expenses."
                tone={operatingProfit >= 0 ? "emerald" : "rose"}
                icon={PiggyBank}
              />
              <FinancePulseCard
                title="Tax Reserve"
                value={formatMoney(taxReserve)}
                subtitle="Suggested cash to hold back for taxes."
                tone="amber"
                icon={Landmark}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Finance Center
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        Record the money leaving the business
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        Log supplies, marketing, software, shipping, and other
                        costs so your dashboard reflects true operating profit.
                      </p>
                    </div>
                    <CalendarDays className="h-6 w-6 text-slate-500" />
                  </div>
                </div>

                <ExpenseForm onSave={handleExpenseSave} saving={savingExpense} />

                <ExpenseTable
                  expenses={filteredExpenses}
                  loading={expensesLoading}
                  onDelete={setExpenseToDelete}
                />
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tax Prep Checklist
                  </p>
                  <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                    <p>Separate collected sales tax from operating cash.</p>
                    <p>Record every expense with a clear vendor and description.</p>
                    <p>Review Stripe fees and shipping costs each month.</p>
                    <p>Keep receipts for marketing, packaging, software, and supplies.</p>
                    <p>Use the monthly reports endpoint later for accountant-ready exports.</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Expense Mix
                  </p>
                  <div className="mt-5 space-y-3">
                    {Object.entries(analytics.expensesByType || {}).length ? (
                      Object.entries(analytics.expensesByType || {}).map(
                        ([type, amount]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                          >
                            <span className="text-sm font-medium capitalize text-slate-700">
                              {type.replace("_", " ")}
                            </span>
                            <span className="text-sm font-semibold text-slate-950">
                              {formatMoney(amount)}
                            </span>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        No manual expenses recorded yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current month focus
                  </p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-600">
                        Revenue this month
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-950">
                        {formatMoney(currentMonthSnapshot?.revenue)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-600">
                        Profit this month
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-950">
                        {formatMoney(currentMonthSnapshot?.profit)}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Use the reporting window above to review a season, a launch,
                      or tax periods without losing visibility.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {confirmDeleteBow && (
        <ConfirmModal
          title="Delete Product?"
          message={`Are you sure you want to delete "${confirmDeleteBow.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteBow(null)}
        />
      )}

      {expenseToDelete && (
        <ConfirmModal
          title="Delete Expense?"
          message={`Remove "${expenseToDelete.description}" for ${formatMoney(expenseToDelete.amount)}?`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={handleExpenseDelete}
          onCancel={() => setExpenseToDelete(null)}
        />
      )}
    </div>
  );
}
