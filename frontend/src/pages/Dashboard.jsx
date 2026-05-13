import React, { useMemo, useState } from "react";
import {
  dashboardStyles,
  trendStyles,
  chartStyles,
} from "../assets/dummyStyles";
import {
  GAUGE_COLORS,
  COLORS,
  INCOME_COLORS,
  EXPENSE_CATEGORY_ICONS,
} from "../assets/color";
import { useOutletContext } from "react-router-dom";

const API_BASE = "http://localhost:4000/api";

const getAuthHeadr = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

//To convert date to ISO

function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch (err) {
    return new Date().toISOString();
  }
}

const Dashboard = () => {
  //get refresh Transactions from outlet context

  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [showAllIncome, setShowAllIncome] = useState(false); // to toggle
  const [showAllExpense, setShowAllExpense] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame),
    [timeFrame],
  );
  const prevTimeFrameRange = useMemo(
    () => getPreviousTimeFrameRange(timeFrame),
    [timeFrame],
  );

  const isDateInRange = (date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  };

  const filteredTransactions = useMemo(
    () =>
      (outletTransactions || []).filter((t) =>
        isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end),
      ),
    [outletTransactions, timeFrameRange],
  );

  // filter by time
  const prevFilteredTransactions = useMemo(
    () =>
      (outletTransactions || []).filter((t) =>
        isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end),
      ),
    [outletTransactions, prevTimeFrameRange],
  );

  //calculate data

  const currentTimeFrameData = useMemo(() => {
    const data = calculateData(filteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [filteredTransactions]);

  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [prevFilteredTransactions]);

  //update the gauge when time frame changes

  useEffect(() => {
    const maxValues = {
      income: Math.max(currentTimeFrameData.income, 5000),
      expenses: Math.max(currentTimeFrameData.expenses, 3000),
      savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
    };

    setGaugeData([
      {
        name: "Income",
        value: currentTimeFrameData.income,
        max: maxValues.income,
      },
      {
        name: "Spent",
        value: currentTimeFrameData.expenses,
        max: maxValues.expenses,
      },
      {
        name: "Savings",
        value: currentTimeFrameData.savings,
        max: maxValues.savings,
      },
    ]);
  }, [currentTimeFrameData, timeFrame]);

  const displayIncome =
    timeFrame === "monthly" && typeof overviewMeta.monthlyIncome === "number"
      ? overviewMeta.monthlyIncome
      : currentTimeFrameData.income;

  const displayExpenses =
    timeFrame === "monthly" && typeof overviewMeta.monthlyExpense === "number"
      ? overviewMeta.monthlyExpense
      : currentTimeFrameData.expenses;

  const displaySavings =
    timeFrame === "monthly" && typeof overviewMeta.savings === "number"
      ? overviewMeta.savings
      : currentTimeFrameData.savings;

  //expense change

  const expenseChange = useMemo(() => {
    const prev = prevTimeFrameData.expenses;
    const curr = displayExpenses;
    if (!prev) {
      if (!curr) return 0;
      return 100;
    }
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  //expense destrabution pie chart

  const financialOverviewData = useMemo(() => {
    if (
      timeFrame === "monthly" &&
      overviewMeta.expenseDistribution &&
      Array.isArray(overviewMeta.expenseDistribution) &&
      overviewMeta.expenseDistribution.length > 0
    ) {
      return overviewMeta.expenseDistribution.map((d) => ({
        name: d.category,
        value: Math.round(Number(d.amount) || 0),
      }));
    }

    const categories = {};
    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        categories[transaction.category] =
          (categories[transaction.category] || 0) + transaction.amount;
      }
    });

    return Object.keys(categories).map((category) => ({
      name: category,
      value: Math.round(categories[category]),
    }));
  }, [filteredTransactions, overviewMeta, timeFrame]);

  //build server provide list
  const serverRecent = overviewMeta.recentTransactions || [];
  const serverRecentIncome = serverRecent
    .filter((t) => t.type === "income")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const serverRecentExpense = serverRecent
    .filter((t) => t.type === "expense")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const incomeTransactions = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions],
  );

  const expenseTransactions = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions],
  );

  const incomeListForDisplay =
    timeFrame === "monthly" && serverRecentIncome.length > 0
      ? serverRecentIncome
      : incomeTransactions;

  const expenseListForDisplay =
    timeFrame === "monthly" && serverRecentExpense.length > 0
      ? serverRecentExpense
      : expenseTransactions;

  const displayedIncome = showAllIncome
    ? incomeListForDisplay
    : incomeListForDisplay.slice(0, 3);

  const displayedExpense = showAllExpense
    ? expenseListForDisplay
    : expenseListForDisplay.slice(0, 3);

  return <div></div>;
};

export default Dashboard;
