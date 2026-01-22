const express = require("express");
const router = express.Router();
const Expense = require("../models/expenseModel");
const Order = require("../models/orderModel");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// All expense routes require admin
router.use(verifyToken, verifyAdmin);

// Create expense
router.post("/", async (req, res) => {
  try {
    const { type, amount, description, date, vendor, orderId } = req.body;

    const expense = await Expense.create({
      type,
      amount,
      description,
      date: date || new Date(),
      vendor,
      orderId,
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Could not create expense" });
  }
});

// Get all expenses
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type) query.type = type;

    const expenses = await Expense.find(query)
      .populate("orderId")
      .sort({ date: -1 });
      
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Could not get expenses" });
  }
});

// Get expense summary
router.get("/summary", async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let startDate, endDate;
    if (year && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else if (year) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      // Current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      total: 0,
      byType: {},
    };

    expenses.forEach(exp => {
      summary.total += exp.amount;
      if (!summary.byType[exp.type]) {
        summary.byType[exp.type] = 0;
      }
      summary.byType[exp.type] += exp.amount;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Could not get summary" });
  }
});

// Update expense
router.put("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: "Could not update expense" });
  }
});

// Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not delete expense" });
  }
});

// AUTO-CREATE stripe fees when order is placed
async function createStripeExpense(orderId, orderTotal) {
  try {
    const stripeFee = orderTotal * 0.029 + 0.30;
    
    await Expense.create({
      type: "stripe_fee",
      amount: stripeFee,
      description: `Stripe processing fee for order ${orderId}`,
      vendor: "Stripe",
      orderId: orderId,
    });
  } catch (err) {
    console.error("Failed to create Stripe expense:", err);
  }
}

module.exports = { router, createStripeExpense };