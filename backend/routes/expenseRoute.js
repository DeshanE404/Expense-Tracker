import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
    addExpense,
    getAllExpenses,
    updateExpense,
    deleteExpense,
    downloadExpenseData,
    getExpenseOverview,
} from '../controllers/expenseController.js';


const expenseRouter = express.Router();

expenseRouter.post("/add", authMiddleware, addExpense);
expenseRouter.get("/get", authMiddleware, getAllExpenses);
expenseRouter.put("/update/:id", authMiddleware, updateExpense);
expenseRouter.delete("/delete/:id", authMiddleware, deleteExpense);
expenseRouter.get("/download", authMiddleware, downloadExpenseData);
expenseRouter.get("/overview", authMiddleware, getExpenseOverview);

export default expenseRouter;