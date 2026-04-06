// routes/admin.js
const express = require("express");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/User");
const Expense = require("../models/expenseModel");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

// Protect all admin routes
router.use(verifyToken, verifyAdmin);

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
router.get("/analytics", async (req, res) => {
  try {
    const { start, end } = req.query;

    let dateFilter = {};
    if (start || end) {
      dateFilter.createdAt = {};
      if (start) dateFilter.createdAt.$gte = new Date(start);
      if (end)   dateFilter.createdAt.$lte = new Date(end);
    }

    // ── Core metrics ──────────────────────────────────────────────────────────
    const completedOrderStatuses = ["processing", "shipped", "delivered"];

    const paidOrderFilter = {
      ...dateFilter,
      status: { $in: completedOrderStatuses },
    };

    const totalOrders = await Order.countDocuments(paidOrderFilter);

    const revenueResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const taxResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: null, total: { $sum: "$tax" } } },
    ]);
    const totalTaxCollected = taxResult[0]?.total || 0;

    const shippingResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: null, total: { $sum: "$shippingCost" } } },
    ]);
    const totalShippingCollected = shippingResult[0]?.total || 0;

    const shippingSpendResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: null, total: { $sum: "$actualShippingLabelCost" } } },
    ]);
    const totalShippingSpend = shippingSpendResult[0]?.total || 0;

    const stripeFeesResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: null, total: { $sum: "$stripeFee" } } },
    ]);
    const totalStripeFees = stripeFeesResult[0]?.total || 0;

    // Average Order Value
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Unique customers by email
    const totalCustomers = await Order.distinct("customerEmail", paidOrderFilter).then(
      (arr) => arr.length
    );

    const expenseDateFilter = {};
    if (start || end) {
      expenseDateFilter.date = {};
      if (start) expenseDateFilter.date.$gte = new Date(start);
      if (end) expenseDateFilter.date.$lte = new Date(end);
    }

    const expenses = await Expense.find(expenseDateFilter);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByType = expenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {});

    // ── Returning customers ───────────────────────────────────────────────────
    const customerOrderCounts = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: "$customerEmail", orderCount: { $sum: 1 } } },
    ]);
    const returningCustomers = customerOrderCounts.filter((c) => c.orderCount > 1).length;
    const returningCustomerRate =
      customerOrderCounts.length > 0
        ? ((returningCustomers / customerOrderCounts.length) * 100).toFixed(1)
        : 0;

    // ── Customer Lifetime Value (avg total spent per customer) ────────────────
    const clvResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: "$customerEmail", totalSpent: { $sum: "$total" } } },
      { $group: { _id: null, avgCLV: { $avg: "$totalSpent" } } },
    ]);
    const avgCLV = clvResult[0]?.avgCLV || 0;

    // ── Top customers by spend ────────────────────────────────────────────────
    const topCustomers = await Order.aggregate([
      { $match: paidOrderFilter },
      {
        $group: {
          _id: "$customerEmail",
          name: { $first: "$customerName" },
          totalSpent: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $project: {
          email: "$_id",
          name: 1,
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: { $divide: ["$totalSpent", "$orderCount"] },
        },
      },
    ]);

    // ── Sales by product ──────────────────────────────────────────────────────
    const salesByProduct = await Order.aggregate([
      { $match: paidOrderFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // ── Product profit stats ──────────────────────────────────────────────────
    const productProfitStats = await Order.aggregate([
      { $match: paidOrderFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalUnitsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          totalMaterialCost: {
            $sum: { $multiply: ["$items.quantity", { $ifNull: ["$items.cost", 0] }] },
          },
        },
      },
      {
        $project: {
          productId: "$_id",
          name: 1,
          totalUnitsSold: 1,
          totalRevenue: 1,
          totalMaterialCost: 1,
          profit: {
            $subtract: ["$totalRevenue", "$totalMaterialCost"],
          },
        },
      },
      { $sort: { profit: -1 } },
    ]);

    const topProducts = productProfitStats.slice(0, 5);

    // ── Recent 20 orders (increased from 5 so Orders tab is useful) ───────────
    const recentOrders = await Order.find(paidOrderFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("items.productId");

    // ── Sales by day (last 30 days) ───────────────────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders30Days = await Order.find({
      ...paidOrderFilter,
      createdAt: { $gte: thirtyDaysAgo },
    }).populate("items.productId");

    const salesByDayObj = {};
    recentOrders30Days.forEach((order) => {
      const dateKey = new Date(order.createdAt).toLocaleDateString();
      if (!salesByDayObj[dateKey]) {
        salesByDayObj[dateKey] = { date: dateKey, revenue: 0, orders: 0, profit: 0 };
      }
      salesByDayObj[dateKey].revenue += order.total;
      salesByDayObj[dateKey].orders += 1;
      salesByDayObj[dateKey].profit += Number(order.totalProfit || 0);
    });

    const salesByDay = Object.values(salesByDayObj).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // ── Orders by day of week (helps with scheduling/inventory) ──────────────
    const ordersByDayOfWeek = [
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ].map((day) => ({ day, orders: 0, revenue: 0 }));

    recentOrders30Days.forEach((order) => {
      const dow = new Date(order.createdAt).getDay();
      ordersByDayOfWeek[dow].orders += 1;
      ordersByDayOfWeek[dow].revenue += order.total;
    });

    // ── Monthly revenue vs profit (current year) ──────────────────────────────
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const allYearOrders = await Order.find({
      createdAt: { $gte: yearStart },
      status: { $in: completedOrderStatuses },
    }).populate("items.productId");

    const monthlyObj = {};
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    monthNames.forEach((m) => {
      monthlyObj[m] = { month: m, revenue: 0, profit: 0, orders: 0 };
    });

    allYearOrders.forEach((order) => {
      const m = monthNames[new Date(order.createdAt).getMonth()];
      monthlyObj[m].revenue += order.total;
      monthlyObj[m].orders += 1;
      monthlyObj[m].profit += Number(order.totalProfit || 0);
    });
    const monthlyRevenue = Object.values(monthlyObj);

    // ── Order status breakdown ────────────────────────────────────────────────
    const orderStatusBreakdown = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalMaterialCost = productProfitStats.reduce(
      (sum, p) => sum + p.totalMaterialCost, 0
    );
    const totalProfitResult = await Order.aggregate([
      { $match: paidOrderFilter },
      { $group: { _id: null, total: { $sum: "$totalProfit" } } },
    ]);
    const totalProfit = totalProfitResult[0]?.total || 0;
    const estimatedOperatingProfit = totalProfit - totalExpenses;
    const taxReserveRecommendation = estimatedOperatingProfit > 0
      ? estimatedOperatingProfit * 0.25
      : 0;
    const profitMargin = totalRevenue > 0
      ? ((totalProfit / totalRevenue) * 100).toFixed(1)
      : 0;

    res.json({
      // Core
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalTaxCollected,
      totalShippingCollected,
      totalShippingSpend,
      totalStripeFees,
      totalExpenses,
      totalMaterialCost,
      totalProfit,
      estimatedOperatingProfit,
      taxReserveRecommendation,
      profitMargin,
      expensesByType,

      // Growth metrics
      aov,
      avgCLV,
      returningCustomers,
      returningCustomerRate,
      topCustomers,

      // Charts
      salesByProduct,
      productProfitStats,
      topProducts,
      recentOrders,
      salesByDay,
      monthlyRevenue,
      ordersByDayOfWeek,
      orderStatusBreakdown,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const salesTotal = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);
    res.json({
      userCount,
      productCount,
      orderCount,
      salesTotal: salesTotal[0]?.total || 0,
    });
  } catch (err) {
    console.error("Error getting admin stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/admin/export/sales ──────────────────────────────────────────────
router.get("/export/sales", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }
    const orders = await Order.find(query)
      .populate("items.productId")
      .populate("userId", "name email");

    const csvData = orders.map((order) => ({
      OrderID: order._id,
      Date: order.createdAt.toISOString().split("T")[0],
      Customer: order.customerName || order.userId?.name || "Guest",
      Email: order.customerEmail || order.userId?.email || "",
      Items: order.items.length,
      Subtotal: order.subtotal?.toFixed(2) || order.total.toFixed(2),
      Shipping: order.shippingCost?.toFixed(2) || "0.00",
      ShippingLabelCost: order.actualShippingLabelCost?.toFixed(2) || "0.00",
      Tax: order.tax?.toFixed(2) || "0.00",
      Total: order.total.toFixed(2),
      Profit: order.totalProfit?.toFixed(2) || "0.00",
      Status: order.status,
    }));
    res.json(csvData);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

// ─── GET /api/admin/export/products ──────────────────────────────────────────
router.get("/export/products", async (req, res) => {
  try {
    const products = await Product.find();
    const csvData = products.map((p) => ({
      ProductID: p._id,
      Name: p.name,
      Category: p.category,
      Price: p.price.toFixed(2),
      MaterialCost: p.materialCost.toFixed(2),
      Profit: (p.price - p.materialCost).toFixed(2),
      Margin: p.price > 0
        ? (((p.price - p.materialCost) / p.price) * 100).toFixed(1) + "%"
        : "0%",
      Inventory: p.inventory,
      TotalSales: p.sales || 0,
      TotalRevenue: (p.price * (p.sales || 0)).toFixed(2),
      TotalProfit: ((p.price - p.materialCost) * (p.sales || 0)).toFixed(2),
    }));
    res.json(csvData);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

// ─── GET /api/admin/reports/monthly ──────────────────────────────────────────
router.get("/reports/monthly", async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const orders = await Order.find({
      createdAt: {
        $gte: new Date(`${targetYear}-01-01`),
        $lte: new Date(`${targetYear}-12-31`),
      },
      status: { $in: ["processing", "shipped", "delivered"] },
    }).populate("items.productId");

    const monthlyData = {};
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(targetYear, month).toLocaleString("default", { month: "long" });
      monthlyData[monthName] = { month: monthName, revenue: 0, profit: 0, orders: 0, itemsSold: 0 };
    }

    orders.forEach((order) => {
      const month = new Date(order.createdAt).toLocaleString("default", { month: "long" });
      monthlyData[month].revenue += order.total;
      monthlyData[month].orders += 1;
      monthlyData[month].profit += Number(order.totalProfit || 0);
      order.items.forEach((item) => {
        monthlyData[month].itemsSold += item.quantity;
      });
    });

    res.json(Object.values(monthlyData));
  } catch (err) {
    res.status(500).json({ error: "Report failed" });
  }
});

module.exports = router;
