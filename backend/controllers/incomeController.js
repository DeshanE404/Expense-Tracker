import incomeModel from "../models/incomeModel.js";
import XLSX from "xlsx";
import getDateRange from "../utils/dataFilter.js";
// add income

export async function addIncome(req, res) {
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({success: false, message: "All fields are required" });
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount,
            category,
            date,
        });
        await newIncome.save();
        res.status(201).json({ success: true, message: "Income added successfully", income: newIncome });
    } catch (error) {
        console.error("Error adding income:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// get all income

export async function getAllIncome(req, res) {
    const userId = req.user._id;
    try{
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        res.status(200).json({ success: true, income });

    }
    catch(error){
        console.error("Error fetching income:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//update an income

export async function updateIncome(req, res) {
    const {id} = req.params;
    const userId = req.user._id;
    const { description, amount } = req.body;
    try
    {const updatedIncome = await incomeModel.findOneAndUpdate(
        { _id: id, userId },
        { description, amount },
        { new: true }
    );
    if (!updatedIncome) {
        return res.status(404).json({ success: false, message: "Income not found" });
    }
    res.status(200).json({ success: true, message: "Income updated successfully", income: updatedIncome });
} catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ success: false, message: "Server error" });
}
}

// delete an income

export async function deleteIncome(req, res) {
    const {id} = req.params;
    const userId = req.user._id;
    try {
        const deletedIncome = await incomeModel.findByIdAndDelete({ _id: id, userId });
        if (!deletedIncome) {
            return res.status(404).json({ success: false, message: "Income not found" });
        }
        res.status(200).json({ success: true, message: "Income deleted successfully", income: deletedIncome });
    } catch (error) {
        console.error("Error deleting income:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// download data to an excel sheet

export async function downloadIncomeData(req, res) {
    const userId = req.user._id;
    try {
        const incomeData = await incomeModel.find({ userId }).sort({ date: -1 });
        const plainData = incomeData.map((income) => ({
            description: income.description,
            amount: income.amount,
            category: income.category,
            date: new Date(income.date).toLocaleDateString(),
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(plainData);

        XLSX.utils.book_append_sheet(workbook, worksheet, "incomeModel");
        XLSX.writeFile(workbook, "income_details.xlsx");
        res.download("income_details.xlsx");

    } catch (error) {
        console.error("Error downloading income data:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

//to get income overwiew

export async function getIncomeOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);
        const incomes = await incomeModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });
        

const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);
const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
const numberOfTransactions = incomes.length;

const recentTransactions = incomes.slice(0, 9);

res.json({
    success: true,
    data: {
        totalIncome,
        averageIncome,
        numberOfTransactions,
        recentTransactions,
        range
    },
});
    } catch (error) {
        console.error("Error fetching income overview:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}