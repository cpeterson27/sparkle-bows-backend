// routes/admin.js - PROFESSIONAL ANALYTICS ENDPOINT
const express = require("express");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/User");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

// Protect all admin routes - CRITICAL SECURITY
router.use(verifyToken, verifyAdmin);

// GET /api/analytics
// GET /api/admin/analytics
router.get("/analytics", async (req, res) => {
  try {
    const { start, end } = req.query;

    // Build date filter if provided
    let dateFilter = {};
    if (start || end) {
      dateFilter.createdAt = {};
      if (start) dateFilter.createdAt.$gte = new Date(start);
      if (end) dateFilter.createdAt.$lte = new Date(end);
    }

    // Total orders
    const totalOrders = await Order.countDocuments(dateFilter);

    // Total revenue
    const revenueResult = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Unique customers
    const totalCustomers = await Order.distinct("customerEmail", dateFilter).then(
      (arr) => arr.length
    );

    // Sales by product
    const salesByProduct = await Order.aggregate([
      { $match: dateFilter },
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

    // Product profit stats
    const productProfitStats = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalUnitsSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productId: "$_id",
          name: "$productDetails.name",
          totalUnitsSold: 1,
          totalRevenue: 1,
          totalMaterialCost: { $multiply: ["$totalUnitsSold", "$productDetails.materialCost"] },
          profit: {
            $subtract: ["$totalRevenue", { $multiply: ["$totalUnitsSold", "$productDetails.materialCost"] }],
          },
        },
      },
      { $sort: { profit: -1 } },
    ]);

    // Top 5 products by profit
    const topProducts = productProfitStats.slice(0, 5);

    // Recent 5 orders
    const recentOrders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.productId");

    // Sales by day (last 30 days) with profit
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders30Days = await Order.find({
      ...dateFilter,
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

      order.items.forEach((item) => {
        if (item.productId && item.productId.materialCost != null) {
          salesByDayObj[dateKey].profit +=
            (item.price - item.productId.materialCost) * item.quantity;
        }
      });
    });

    const salesByDay = Object.values(salesByDayObj).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      totalOrders,
      totalRevenue,
      totalCustomers,
      salesByProduct,
      productProfitStats,
      topProducts,
      recentOrders,
      salesByDay,
      totalMaterialCost: productProfitStats.reduce((sum, p) => sum + p.totalMaterialCost, 0),
      totalProfit: productProfitStats.reduce((sum, p) => sum + p.profit, 0),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});


// GET /api/admin/stats - High level site stats
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

// Export sales data for tax reporting

router.get("/export/sales", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate("items.productId")
      .populate("userId", "name email");

    // Format for CSV export
    const csvData = orders.map((order) => ({
      OrderID: order._id,
      Date: order.createdAt.toISOString().split("T")[0],
      Customer: order.userId?.name || "Guest",
      Email: order.userId?.email || "",
      Items: order.items.length,
      Total: order.total.toFixed(2),
      Status: order.status,
    }));

    res.json(csvData);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
});

// Export product performance data

router.get("/export/products", async (req, res) => {
  try {
    const products = await Product.find();

    const csvData = products.map((p) => ({
      ProductID: p._id,
      Name: p.name,
      Price: p.price.toFixed(2),
      MaterialCost: p.materialCost.toFixed(2),
      Profit: (p.price - p.materialCost).toFixed(2),
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

//tax reporting - monthly breakdown

router.get("/reports/monthly", async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear}-12-31`);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("items.productId");

    // Group by month
    const monthlyData = {};

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(targetYear, month).toLocaleString("default", {
        month: "long",
      });
      monthlyData[monthName] = {
        month: monthName,
        revenue: 0,
        profit: 0,
        orders: 0,
        itemsSold: 0,
      };
    }

    orders.forEach((order) => {
      const month = new Date(order.createdAt).toLocaleString("default", {
        month: "long",
      });

      monthlyData[month].revenue += order.total;
      monthlyData[month].orders += 1;

      order.items.forEach((item) => {
        monthlyData[month].itemsSold += item.quantity;
        if (item.productId) {
          const profit =
            (item.price - (item.productId.materialCost || 0)) * item.quantity;
          monthlyData[month].profit += profit;
        }
      });
    });

    res.json(Object.values(monthlyData));
  } catch (err) {
    res.status(500).json({ error: "Report failed" });
  }
});

module.exports = router;
