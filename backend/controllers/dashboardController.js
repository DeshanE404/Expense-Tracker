import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";

export async function getDashboardData(req, res) {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const totalIncome = await incomeModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now }
        }).lean();

        const totalExpense = await expenseModel.find({
            userId,
            date: { $gte: startOfMonth, $lte: now }
        }).lean();


    const monthlyIncome = totalIncome.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const monthlyExpense = totalExpense.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const savings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

    const recentTransactions = [
      ...totalIncome.map((i) => ({ ...i, type: "income" })),
      ...totalExpense.map((e) => ({ ...e, type: "expense" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const spendByCategory = {};
    for (const exp of totalExpense) {
      const cat = exp.category || "Other";
      spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
    }

    const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
      category,
      amount,
      percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
    }));
return res.json({
    success: true,
    data: {monthlyIncome, monthlyExpense, savings, savingsRate, recentTransactions, expenseDistribution},
});


    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
