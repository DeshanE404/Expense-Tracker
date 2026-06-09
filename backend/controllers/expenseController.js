import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dataFilter.js";
import XLSX from "xlsx";

//add expense

export async function addExpense(req, res) {
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        
              const newExpense = new expenseModel({
            userId,
            description,
            amount,
            category,
            date,
        });
        await newExpense.save();
        res.status(201).json({ success: true, message: "Expense added successfully", expense: newExpense });
    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// to get all expenses

export async function getAllExpenses(req, res) {
    const userId = req.user._id;
    try {
        const expenses = await expenseModel.find({ userId }).sort({ date: -1 });
        res.status(200).json({ success: true, expenses });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}    

//update an expense

export async function updateExpense(req, res) { 
    const { id } = req.params;
    const userId = req.user._id;
    const { description, amount } = req.body;
    try {
        const expenses = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            { description, amount },
            { new: true }
        );
        if (!expenses) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }
        res.status(200).json({ success: true, message: "Expense updated successfully", expense: expenses });
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//Delete an expense

export async function deleteExpense(req, res) {
    const { id } = req.params;
    const userId = req.user._id;    
    try {
        const expenses = await expenseModel.findOneAndDelete({ _id: id, userId });
        if (!expenses) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }
        res.status(200).json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// download expense data to excel

export async function downloadExpenseData(req, res) {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;
    try {
        const expenses = await expenseModel.find({ userId }).sort({ date: -1 });
        const plainData = expenses.map((exp) => ({
            description: exp.description,
            amount: exp.amount,
            category: exp.category,
            date: new Date(exp.date).toLocaleDateString(),
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(plainData);

        XLSX.utils.book_append_sheet(workbook, worksheet, "expenseModel");
        XLSX.writeFile(workbook, "expense_details.xlsx");
        res.download("expense_details.xlsx");

    } catch (error) {
        console.error("Error downloading expense data:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// to get expense overview

export async function getExpenseOverview(req, res) {
    const userId = req.user._id;
    const { range = "monthly" } = req.query;
    const { start, end } = getDateRange(range);
    try {
        const expenses = await expenseModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

    const totalExpense = expenses.reduce((acc, cur) => acc + cur.amount, 0);
    const averageExpense =
      expenses.length > 0 ? totalExpense / expenses.length : 0;
    const numberOfTransactions = expenses.length;

    const recentTransactions = expenses.slice(0, 7);

res.json({
    success: true,
    data: {
        totalExpense,
        averageExpense,
        numberOfTransactions,
        recentTransactions,
        range
    },
});
    } catch (error) {
        console.error("Error fetching expense overview:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

