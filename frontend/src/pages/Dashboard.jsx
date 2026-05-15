import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  dashboardStyles,
  trendStyles,
  chartStyles,
} from "../assets/dummyStyles";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  GAUGE_COLORS,
  COLORS,
  INCOME_COLORS,
  EXPENSE_CATEGORY_ICONS,
  INCOME_CATEGORY_ICONS
} from "../assets/color";
import { useOutletContext } from "react-router-dom";
import { getTimeFrameRange, getPreviousTimeFrameRange, calculateData, getAuthHeader } from "../components/Helpers";
import {
  Plus,
  Wallet,
  TrendingDown,
  TrendingUp as ProfileIcon,
  PieChart as PieChartIcon,
  PiggyBank,
  CreditCard,
  ArrowRight,
  TrendingUp,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  ArrowDown,
  DollarSign,
  PieChart as PieIcon
} from "lucide-react";
import GaugeCard from "../components/GaugeCard";
import FinancialCard from "../components/FinancialCard";
import AddTransactionModal from "../components/Add";

const API_BASE = "http://localhost:4000/api";

//To convert date to ISO

const toIsoWithClientTime = (dateValue) => {
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
};

const Dashboard = () => {
  //get refresh Transactions from outlet context

  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => { },
    refreshTransactions,
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
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

  const isDateInRange = React.useCallback((date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  }, []);

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

  const gaugeData = useMemo(() => {
    const maxValues = {
      income: Math.max(currentTimeFrameData.income, 5000),
      expenses: Math.max(currentTimeFrameData.expenses, 3000),
      savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
    };

    return [
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
    ];
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

  const incomeChange = useMemo(() => {
    const prev = prevTimeFrameData.income;
    const curr = displayIncome;
    if (!prev) {
      if (!curr) return 0;
      return 100;
    }
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayIncome]);

  const savingsChange = useMemo(() => {
    const prev = prevTimeFrameData.savings;
    const curr = displaySavings;
    if (!prev) {
      if (!curr) return 0;
      return 100;
    }
    return Math.round(((curr - prev) / Math.abs(prev || 1)) * 100);
  }, [prevTimeFrameData, displaySavings]);

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

  //fetch data from the server

  const fetchDashboardOverview = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/dashboard`, {
        headers: getAuthHeader(),
      });

      if (res?.data?.success) {
        const data = res.data.data;
        const recent = (data.recentTransactions || []).map((item) => {
          const typeFromServer =
            item.type || (item.category ? "expense" : "income");
          const amountNum = Number(item.amount) || 0;

          const isoDate = item.date
            ? new Date(item.date).toISOString()
            : item.createdAt
              ? new Date(item.createdAt).toISOString()
              : new Date().toISOString();

          return {
            id: item._id || item.id || Date.now() + Math.random(),
            date: isoDate,
            description:
              item.description ||
              item.note ||
              item.title ||
              (typeFromServer === "income"
                ? item.source || "Income"
                : item.category || "Expense"),
            amount: amountNum,
            type: typeFromServer,
            category:
              item.category ||
              (typeFromServer === "income" ? "Salary" : "Other"),
            raw: item,
          };
        });

        setOverviewMeta((prev) => ({
          ...prev,
          monthlyIncome: Number(data.monthlyIncome || 0),
          monthlyExpense: Number(data.monthlyExpense || 0),
          savings:
            typeof data.savings !== "undefined"
              ? Number(data.savings)
              : Number(data.monthlyIncome || 0) -
              Number(data.monthlyExpense || 0),
          savingsRate:
            typeof data.savingsRate !== "undefined" ? data.savingsRate : null,
          spendByCategory: data.spendByCategory || {},
          expenseDistribution: data.expenseDistribution || [],
          recentTransactions: recent,
        }));
      } else {
        console.warn("Dashboard endpoint returned success:false", res?.data);
      }
    } catch (err) {
      console.error(
        "Failed to fetch dashboard overview:",
        err?.response || err.message || err,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  //add edit delete transaction

  const handleAddTransaction = React.useCallback(async () => {
    if (!newTransaction.description || !newTransaction.amount) return;
    const payload = {
      date: toIsoWithClientTime(newTransaction.date),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
    };

    try {
      setLoading(true);
      if (newTransaction.type === "income") {
        await axios.post(`${API_BASE}/income/add`, payload, {
          headers: getAuthHeader(),
        });
      } else {
        await axios.post(`${API_BASE}/expenses/add`, payload, { headers: getAuthHeader(), });
      }
      await refreshTransactions();
      await fetchDashboardOverview();

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
      }); setShowModal(false);
    }
    catch (err) {
      console.error("Faild to add Transaction:", err?.response || err.message || err);
    } finally {
      setLoading(false);
    }
  }, [newTransaction, fetchDashboardOverview, refreshTransactions]);
  return (
    <div className={dashboardStyles.container}>
      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={dashboardStyles.headerTitle}>Finance Dashboard</h1>
            <p className={dashboardStyles.headerSubtitle}>
              Track your Income and Expenses
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className={dashboardStyles.addButton}>
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>
      <div className={dashboardStyles.timeFrameContainer}>
        {["daily", "weekly", "monthly"].map((frame) => (
          <button key={frame} onClick={() => setTimeFrame(frame)}
            className={dashboardStyles.timeFrameButton(timeFrame === frame)}>
            {frame.charAt(0).toUpperCase() + frame.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className={dashboardStyles.summaryGrid}>
        <FinancialCard
          icon={<Wallet className="w-5 h-5 text-teal-600" />}
          label={`${timeFrameRange.label} Income`}
          value={`Rs ${displayIncome.toLocaleString()}`}
          borderColor="border-l-4 border-teal-500"
          additionalContent={
            <div className={`text-xs flex items-center gap-1 ${incomeChange >= 0 ? trendStyles.negative : trendStyles.positive}`}>
              {incomeChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {Math.abs(incomeChange)}%{" "}
                {incomeChange >= 0 ? "increase" : "decrease"} from {" "}
                {prevTimeFrameRange.label}
              </span>
            </div>
          }
        />
        <FinancialCard
          icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
          label={`${timeFrameRange.label} Expenses`}
          value={`Rs ${displayExpenses.toLocaleString()}`}
          borderColor="border-l-4 border-orange-500"
          additionalContent={
            <div className={`text-xs flex items-center gap-1 ${expenseChange >= 0 ? trendStyles.positive : trendStyles.negative}`}>
              {expenseChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {Math.abs(expenseChange)}%{" "}
                {expenseChange >= 0 ? "increase" : "decrease"} from {" "}
                {prevTimeFrameRange.label}
              </span>
            </div>
          }
        />
        <FinancialCard
          icon={<PiggyBank className="w-5 h-5 text-cyan-600" />}
          label={`${timeFrameRange.label} Savings`}
          value={`Rs ${displaySavings.toLocaleString()}`}
          borderColor="border-l-4 border-cyan-500"
          additionalContent={
            <div className="text-xs flex items-center gap-2">
              <div className="flex items-center gap-1">
                <BarChart2 className="w-4 h-5" />

                <span>
                  {displayIncome > 0 ? Math.round((displaySavings / displayIncome) * 100)
                    : 0}
                  % of income
                </span>
              </div>
              {typeof overviewMeta.savingsRate === "number" && (
                <span className={`px-2 py-2 rounded-full text-xs font-medium ${overviewMeta.savingsRate < 0
                  ? trendStyles.negative
                  : trendStyles.positive
                  }`}>
                  {overviewMeta.savingsRate}
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Gauges */}
      <div className={dashboardStyles.gaugeGrid}>
        {gaugeData.map((gauge, index) => (
          <GaugeCard
            key={gauge.name}
            gauge={gauge}
            colorInfo={GAUGE_COLORS[gauge.name]}
            timeFrameLabel={timeFrameRange.label}
            // timeFrameLabel={timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
            highlightNegative={gauge.name === "Savings"}
          />
        ))}
      </div>
      {/* Expense distribution pie - Hidden on mobile */}
      <div className={dashboardStyles.pieChartContainer}>
        <div className={dashboardStyles.pieChartHeader}>
          <h3 className={dashboardStyles.pieChartTitle}>
            <PieChartIcon className="w-6 h-6 text-teal-500" />
            Expense Distribution
            <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
          </h3>
        </div>

        <div className={dashboardStyles.pieChartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className={chartStyles.pieChart}>
              <Pie
                data={financialOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${Math.round(percent * 100)}%`
                }
                labelLine={false}
              >
                {financialOverviewData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`Rs ${Math.round(value).toLocaleString()}`, "Amount"]}
                contentStyle={dashboardStyles.tooltipContent}
                itemStyle={dashboardStyles.tooltipItem}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(v) => (
                  <span className={dashboardStyles.legendText}>{v}</span>
                )}
                iconSize={10}
                iconType="circle"
                wrapperStyle={dashboardStyles.legendWrapper}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={dashboardStyles.listsGrid}>
        {/* Income Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className={dashboardStyles.listTitle}>
              <ProfileIcon className="w-6 h-6 text-green-500" /> Recent Income{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.incomeCountBadge}>
              {incomeListForDisplay.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedIncome.map((transaction) => {
              const IconComponent = INCOME_CATEGORY_ICONS[transaction.category] || INCOME_CATEGORY_ICONS.Other;
              return (
                <div key={transaction.id} className={dashboardStyles.incomeTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.incomeIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.incomeAmount}>+Rs {Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {incomeListForDisplay.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-green-50")}>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No income transactions</p>
              </div>
            )}

            {incomeListForDisplay.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button
                  onClick={() => setShowAllIncome(!showAllIncome)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllIncome ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Income ({incomeListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className="text-lg md:text-xl lg:text-xl xl:text-xl font-bold text-gray-800 md:mt-3 mt-3 flex items-center gap-3">
              <ArrowDown className="w-6 h-6 text-orange-500" /> Recent Expenses{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.expenseCountBadge}>
              {expenseListForDisplay.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedExpense.map((transaction) => {
              const IconComponent = EXPENSE_CATEGORY_ICONS[transaction.category] || EXPENSE_CATEGORY_ICONS.Other;
              return (
                <div key={transaction.id} className={dashboardStyles.expenseTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.expenseIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.expenseAmount}>-Rs {Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {expenseListForDisplay.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-orange-50")}>
                  <ShoppingCart className="w-8 h-8 text-orange-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No expense transactions</p>
              </div>
            )}

            {expenseListForDisplay.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button
                  onClick={() => setShowAllExpense(!showAllExpense)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllExpense ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Expenses ({expenseListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        loading={loading}
      />
    </div>
  )
};

export default Dashboard;
