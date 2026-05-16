import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", userRouter);
app.get('/', (req, res) => {
    res.send('Api is working!');
});
app.use("/api/income", incomeRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/dashboard", dashboardRouter);

// Connect DB
connectDB();

// Export for Vercel
export default app;

// Local development server logic
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✓ Local server running on http://localhost:${PORT}`);
    });
}