import React from 'react'

const Helpers = () => {
  return (
    <div>

    </div>
  )
}




export const getTimeFrameRange = (timeFrame) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (timeFrame === "daily") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "Today" };
  }

  if (timeFrame === "weekly") {
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start: startOfWeek, end, label: "This Week" };
  }

  if (timeFrame === "monthly") {
    const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start: startOfMonth, end, label: "This Month" };
  }

  // yearly
  if (timeFrame === "yearly") {
    const startOfYear = new Date(start.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start: startOfYear, end, label: "This Year" };
  }

  // default -> monthly
  const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  return { start: startOfMonth, end: new Date(now), label: "This Month" };
};

export const getPreviousTimeFrameRange = (timeFrame) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (timeFrame === "daily") {
    const yesterday = new Date(start);
    yesterday.setDate(start.getDate() - 1);
    const end = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
      999
    );
    return {
      start: yesterday,
      end,
      label: "Yesterday",
    };
  }

  if (timeFrame === "weekly") {
    const startOfLastWeek = new Date(start);
    startOfLastWeek.setDate(start.getDate() - start.getDay() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);
    return { start: startOfLastWeek, end: endOfLastWeek, label: "Last Week" };
  }

  if (timeFrame === "monthly") {
    const startOfLastMonth = new Date(
      start.getFullYear(),
      start.getMonth() - 1,
      1
    );
    startOfLastMonth.setHours(0, 0, 0, 0);
    const endOfLastMonth = new Date(start.getFullYear(), start.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);
    return {
      start: startOfLastMonth,
      end: endOfLastMonth,
      label: "Last Month",
    };
  }

  if (timeFrame === "yearly") {
    const startOfLastYear = new Date(start.getFullYear() - 1, 0, 1);
    startOfLastYear.setHours(0, 0, 0, 0);
    const endOfLastYear = new Date(
      start.getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );
    return { start: startOfLastYear, end: endOfLastYear, label: "Last Year" };
  }

  // default -> last month
  const startOfLastMonth = new Date(
    start.getFullYear(),
    start.getMonth() - 1,
    1
  );
  startOfLastMonth.setHours(0, 0, 0, 0);
  const endOfLastMonth = new Date(start.getFullYear(), start.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);
  return { start: startOfLastMonth, end: endOfLastMonth, label: "Last Month" };
};

export const calculateData = (transactions) => {
  const totals = transactions.reduce(
    (data, t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") {
        data.income += amt;
      } else {
        data.expenses += amt;
      }
      return data;
    },
    { income: 0, expenses: 0 }
  );

  return { ...totals, savings: totals.income - totals.expenses };
};

export const generateChartPoints = (timeFrame, timeFrameRange) => {
  const now = new Date();
  const points = [];

  const baseDate = timeFrameRange?.start || now;

  if (timeFrame === "daily") {
    // Generate 24 hours for daily view
    for (let i = 0; i < 24; i++) {
      const hour = new Date(baseDate);
      hour.setHours(i, 0, 0, 0);
      points.push({
        date: hour,
        label: hour.toLocaleTimeString([], { hour: "2-digit" }),
        hour: i,
        isCurrent:
          i === now.getHours() && baseDate.toDateString() === now.toDateString(),
      });
    }
  } else if (timeFrame === "weekly") {
    // Generate 7 days for weekly view
    for (let i = 0; i < 7; i++) {
      const day = new Date(baseDate);
      day.setDate(baseDate.getDate() + i);
      points.push({
        date: day,
        label: day.toLocaleDateString([], { weekday: "short" }),
        isCurrent: day.toDateString() === now.toDateString(),
      });
    }
  } else if (timeFrame === "monthly") {
    // Generate days of the month
    const daysInMonth = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() + 1,
      0
    ).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(baseDate.getFullYear(), baseDate.getMonth(), i);
      points.push({
        date: day,
        label: i.toString(),
        isCurrent: day.toDateString() === now.toDateString(),
      });
    }
  } else if (timeFrame === "yearly") {
    // Generate 12 months for yearly view
    for (let i = 0; i < 12; i++) {
      const month = new Date(baseDate.getFullYear(), i, 1);
      points.push({
        date: month,
        label: month.toLocaleDateString([], { month: "short" }),
        isCurrent:
          month.getMonth() === now.getMonth() &&
          month.getFullYear() === now.getFullYear(),
      });
    }
  }

  return points;
};

export const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default Helpers;
// helper to filter data