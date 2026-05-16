import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { styles } from '../assets/dummyStyles';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { getAuthHeader } from './Helpers';
import {
  Activity,
  ArrowBigDown,
  ArrowUp,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Gift,
  Home,
  Info,
  PieChart,
  PiggyBank,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react';

import { API_URL as API_BASE } from '../config';

const CATEGORY_ICONS = {
  Food: <Utensils className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingCart className="w-4 h-4" />,
  Entertainment: <Gift className="w-4 h-4" />,
  Utilities: <Zap className="w-4 h-4" />,
  Healthcare: <Activity className="w-4 h-4" />,
  Salary: <ArrowUp className="w-4 h-4" />,
  Freelance: <CreditCard className="w-4 h-4" />,
  Savings: <PiggyBank className="w-4 h-4" />,
};

const filterTransactions = (transactions, frame) => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (frame) {
    case 'daily':
      return transactions.filter((t) => new Date(t.date) >= today);

    case 'weekly': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return transactions.filter((t) => new Date(t.date) >= startOfWeek);
    }

    case 'monthly':
      return transactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

    default:
      return transactions;
  }
};

const safeArrayFromResponse = (res) => {
  const body = res?.data;
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.incomes)) return body.incomes;
  if (Array.isArray(body.income)) return body.income;
  if (Array.isArray(body.expenses)) return body.expenses;
  if (Array.isArray(body.expense)) return body.expense;
  return [];
};

const Layout = ({ onLogout, user }) => {
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { name: username = 'User' } = user || {};

  // Check if we're on dashboard
  const isDashboard =
    location.pathname === '/' ||
    location.pathname === '/income' ||
    location.pathname === '/expenses';



  const fetchTransactions = React.useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeader();

      const [incomeRes, expenseRes] = await Promise.all([
        axios.get(`${API_BASE}/income/get`, { headers }),
        axios.get(`${API_BASE}/expenses/get`, { headers }),
      ]);

      const incomes = safeArrayFromResponse(incomeRes).map((i) => ({
        ...i,
        type: 'income',
      }));

      const expenses = safeArrayFromResponse(expenseRes).map((e) => ({
        ...e,
        type: 'expense',
      }));

      const allTransactions = [...incomes, ...expenses]
        .map((t) => ({
          id: t._id || t.id || t.id_str || Math.random().toString(36).slice(2),
          description: t.description || t.title || t.note || '',
          amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
          date: t.date || t.createdAt || new Date().toISOString(),
          category: t.category || 'Other',
          type: t.type,
          raw: t,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(allTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        'Failed to fetch transactions',
        err?.response || err.message || err
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = React.useCallback(
    async (transaction) => {
      try {
        const headers = getAuthHeader();
        const endpoint =
          transaction.type === 'income' ? 'income/add' : 'expenses/add';

        await axios.post(`${API_BASE}/${endpoint}`, transaction, { headers });
        await fetchTransactions();
        return true;
      } catch (err) {
        console.error(
          'Failed to add transaction',
          err?.response || err.message || err
        );
        throw err;
      }
    },
    [fetchTransactions]
  );

  const editTransaction = React.useCallback(
    async (id, transaction) => {
      try {
        const headers = getAuthHeader();
        const endpoint =
          transaction.type === 'income' ? 'income/update' : 'expenses/update';

        await axios.put(`${API_BASE}/${endpoint}/${id}`, transaction, {
          headers,
        });

        await fetchTransactions();
        return true;
      } catch (err) {
        console.error(
          'Failed to edit transaction',
          err?.response || err.message || err
        );
        throw err;
      }
    },
    [fetchTransactions]
  );

  const deleteTransaction = React.useCallback(
    async (id, type) => {
      try {
        const headers = getAuthHeader();
        const endpoint =
          type === 'income' ? 'income/delete' : 'expenses/delete';

        await axios.delete(`${API_BASE}/${endpoint}/${id}`, { headers });
        await fetchTransactions();
        return true;
      } catch (err) {
        console.error(
          'Failed to delete transaction',
          err?.response || err.message || err
        );
        throw err;
      }
    },
    [fetchTransactions]
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, timeFrame),
    [transactions, timeFrame]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const last30DaysTransactions = transactions.filter(
      (t) => new Date(t.date) >= thirtyDaysAgo
    );

    const last30DaysIncome = last30DaysTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const last30DaysExpenses = last30DaysTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate =
      last30DaysIncome > 0
        ? Math.round(
          ((last30DaysIncome - last30DaysExpenses) / last30DaysIncome) * 100
        )
        : 0;

    const last60DaysAgo = new Date(now);
    last60DaysAgo.setDate(now.getDate() - 60);

    const previous30DaysTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= last60DaysAgo && date < thirtyDaysAgo;
    });

    const previous30DaysExpenses = previous30DaysTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseChange =
      previous30DaysExpenses > 0
        ? Math.round(
          ((last30DaysExpenses - previous30DaysExpenses) /
            previous30DaysExpenses) *
          100
        )
        : 0;

    return {
      totalTransactions: transactions.length,
      last30DaysIncome,
      last30DaysExpenses,
      last30DaysSavings: last30DaysIncome - last30DaysExpenses,
      allTimeIncome,
      allTimeExpenses,
      allTimeSavings: allTimeIncome - allTimeExpenses,
      last30DaysCount: last30DaysTransactions.length,
      savingsRate,
      expenseChange,
    };
  }, [transactions]);

  const timeFrameLabel = useMemo(
    () =>
      timeFrame === 'daily'
        ? 'Today'
        : timeFrame === 'weekly'
          ? 'This Week'
          : 'This Month',
    [timeFrame]
  );

  const outletContext = useMemo(
    () => ({
      transactions: filteredTransactions,
      addTransaction,
      editTransaction,
      deleteTransaction,
      refreshTransactions: fetchTransactions,
      timeFrame,
      setTimeFrame,
      lastUpdated,
    }),
    [
      filteredTransactions,
      timeFrame,
      addTransaction,
      editTransaction,
      deleteTransaction,
      fetchTransactions,
      lastUpdated,
    ]
  );

  const getSavingsRating = (rate) =>
    rate > 30 ? 'Excellent' : rate > 20 ? 'Good' : 'Needs improvement';

  const topCategories = useMemo(
    () =>
      Object.entries(
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
          }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [transactions]
  );

  const viewAllTransactions = () => {
    setShowAllTransactions((prev) => !prev);
  };

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 4);

  return (
    <div className={styles.layout.root}>
      <Navbar user={user} onLogout={onLogout} />
      <Sidebar
        user={user}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        onLogout={onLogout}
      />

      <div className={styles.layout.mainContainer(sidebarCollapsed)}>
        {isDashboard ? (
          <div style={{ width: '100%' }}>
            <div className={styles.header.container}>
              <div>
                <h1 className={styles.header.title}>Dashboard</h1>
                <p className={styles.header.subtitle}>
                  Welcome back, {username}!
                </p>
              </div>
            </div>

            <div className={styles.statCards.grid}>
              <div className={styles.statCards.card}>
                <div className={styles.statCards.CardHeader}>
                  <div>
                    <p className={styles.statCards.CardTitle}>Total Savings</p>
                    <p className={styles.statCards.CardValue}>
                      Rs {stats.allTimeSavings.toLocaleString()}
                    </p>
                  </div>
                  <div className={styles.statCards.iconContainer('teal')}>
                    <PiggyBank className={styles.statCards.icon('teal')} />
                  </div>
                </div>
                <p className={styles.statCards.cardFooter}>
                  <span className="text-teal-500 font-semibold">
                    {stats.last30DaysSavings.toLocaleString()}
                  </span>{' '}
                  this month
                </p>
              </div>

              <div className={styles.statCards.card}>
                <div className={styles.statCards.CardHeader}>
                  <div>
                    <p className={styles.statCards.CardTitle}>Monthly Income</p>
                    <p className={styles.statCards.CardValue}>
                      Rs {stats.last30DaysIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className={styles.statCards.iconContainer('teal')}>
                    <ArrowUp className={styles.statCards.icon('teal')} />
                  </div>
                </div>
                <p className={styles.statCards.cardFooter}>
                  <span className="text-green-500 font-semibold">+12.5%</span>{' '}
                  from last month
                </p>
              </div>

              <div className={styles.statCards.card}>
                <div className={styles.statCards.CardHeader}>
                  <div>
                    <p className={styles.statCards.CardTitle}>Monthly Expense</p>
                    <p className={styles.statCards.CardValue}>
                      Rs {stats.last30DaysExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div className={styles.statCards.iconContainer('orange')}>
                    <ArrowBigDown className={styles.statCards.icon('orange')} />
                  </div>
                </div>
                <p className={styles.statCards.cardFooter}>
                  <span
                    className={`${styles.colors.expenseChange(
                      stats.expenseChange
                    )} font-semibold`}
                  >
                    {stats.expenseChange > 0 ? '+' : ''}
                    {stats.expenseChange}%
                  </span>{' '}
                  from last month
                </p>
              </div>

              <div className={styles.statCards.card}>
                <div className={styles.statCards.CardHeader}>
                  <div>
                    <p className={styles.statCards.CardTitle}>Saving Rate</p>
                    <p className={styles.statCards.CardValue}>
                      {stats.savingsRate}%
                    </p>
                  </div>
                  <div className={styles.statCards.iconContainer('blue')}>
                    <PiggyBank className={styles.statCards.icon('blue')} />
                  </div>
                </div>
                <p className={styles.statCards.cardFooter}>
                  {getSavingsRating(stats.savingsRate)}
                </p>
              </div>
            </div>

            <div className={styles.grid.main}>
              <div className={styles.grid.leftColumn}>
                <div className={styles.cards.base}>
                  <div className={styles.cards.header}>
                    <h3 className={styles.cards.title}>
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      Financial Overview
                      <span className="text-sm text-gray-500 font-normal ml-2">
                        {timeFrameLabel}
                      </span>
                    </h3>
                  </div>
                  <Outlet context={outletContext} />
                </div>
              </div>

              <div className={styles.grid.rightColumn}>
                <div className={styles.cards.base}>
                  <div className={styles.transactions.cardHeader}>
                    <h3 className={styles.transactions.cardTitle}>
                      <Clock className="w-4 h-4 text-purple-500" />
                      Recent Transactions
                    </h3>

                    <button
                      onClick={fetchTransactions}
                      disabled={loading}
                      className={styles.transactions.refreshButton}
                    >
                      <RefreshCw
                        className={styles.transactions.refreshIcon(loading)}
                      />
                    </button>
                  </div>

                  <div className={styles.transactions.dataStackingInfo}>
                    <Info className={styles.transactions.dataStackingIcon} />
                    <span>Transactions are stacked by date (newest first)</span>
                  </div>

                  <div className={styles.transactions.listContainer}>
                    {displayedTransactions.map((transaction) => {
                      const { id, description, amount, date, category, type } =
                        transaction;

                      return (
                        <div
                          key={id}
                          className={styles.transactions.transactionItem}
                        >
                          <div className="flex items-center gap-1 md:gap-4 lg:gap-3">
                            <div
                              className={`p-2 rounded-lg ${styles.colors.transaction.bg(
                                type
                              )}`}
                            >
                              {CATEGORY_ICONS[category] || (
                                <CreditCard
                                  className={styles.transactions.icon}
                                />
                              )}
                            </div>

                            <div>
                              <p>{description}</p>
                              <p>{category}</p>
                              <p>{new Date(date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div>
                            <p>
                              {type === 'expense' ? '-' : '+'}Rs{' '}
                              {Number(amount).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {transactions.length === 0 ? (
                      <div className={styles.transactions.emptyState}>
                        <div className={styles.transactions.emptyIconContainer}>
                          <Clock className={styles.transactions.emptyIcon} />
                        </div>
                        <p className={styles.transactions.emptyText}>
                          No transactions yet. Start adding your expenses and
                          incomes to see them here!
                        </p>
                      </div>
                    ) : (
                      <div className={styles.transactions.viewAllContainer}>
                        <button
                          onClick={viewAllTransactions}
                          className={styles.transactions.viewAllButton}
                        >
                          {showAllTransactions ? (
                            <>
                              <ChevronUp className="w-5 h-5" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-5 h-5" />
                              View All Transactions ({transactions.length})
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/*----- fixed */}
                <div className={styles.cards.base}>
                  <h3 className={styles.cards.title}>
                    <PieChart className={styles.categories.titleIcon} />
                    Spending by Category
                  </h3>

                  <div className={styles.categories.list}>
                    {topCategories.map(([category, amount]) => (
                      //----- fixed
                      <div key={category} className={styles.categories.item}>
                        <div className="flex items-center gap-3">
                          {/*----- fixed */}
                          <div className={styles.categories.categoryIcon}>
                            {CATEGORY_ICONS[category] || (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </div>
                          <span className={styles.categories.categoryName}>
                            {category}
                          </span>
                        </div>

                        <span className={styles.categories.categoryAmount}>
                          Rs {amount}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/*----- fixed */}
                  <div className={styles.categories.summaryContainer}>
                    <div className={styles.categories.summerGrid}>
                      <div className={styles.categories.summaryIncomeCard}>
                        <p className={styles.categories.summaryTitle}>
                          Total Income
                        </p>
                        <p className={styles.categories.summaryValue}>
                          Rs {stats.allTimeIncome.toLocaleString()}
                        </p>
                      </div>

                      <div className={styles.categories.summerExpenseCard}>
                        <p className={styles.categories.summaryTitle}>
                          Total Expenses
                        </p>
                        <p className={styles.categories.summaryValue}>
                          Rs {stats.allTimeExpenses.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/*----- fixed */}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.cards.base}>
            <Outlet context={outletContext} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;