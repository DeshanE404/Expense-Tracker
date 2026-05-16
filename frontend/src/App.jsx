import React, { useState, useEffect } from "react";
import {
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";

import { API_URL } from "./config";

// get transaction from storage
const getTransactionsFromStorage = () => {
  try {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Error reading transactions from storage:", err);
    return [];
  }
};

// Scroll top every time after route change
const ScrollTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  return null;
};

// protect route
const ProtectedRoute = ({ user, children }) => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  const hasToken = localToken || sessionToken;

  // Sync check: we only consider a user "logged in" if we have both user object and token
  if (!user || !hasToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || sessionStorage.getItem("token"),
  );
  const [transactions, setTransactions] = useState(
    getTransactionsFromStorage(),
  );
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // to save the auth in the storage
  const persistAuth = React.useCallback((userObj, tokenStr, remember = false) => {
    try {
      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;

      if (userObj) storage.setItem("user", JSON.stringify(userObj));
      if (tokenStr) storage.setItem("token", tokenStr);

      otherStorage.removeItem("user");
      otherStorage.removeItem("token");

      setUser((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(userObj)) return prev;
        return userObj || null;
      });
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  }, []);

  const clearAuth = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    } catch (err) {
      console.error("Error clearing auth data:", err);
    }
    setUser(null);
    setToken(null);
  };

  // bootstrap auth and transactions
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        const storedToken =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");

        // If we have one but not the other, clear everything to avoid loop
        if ((storedToken && !storedUser) || (!storedToken && storedUser)) {
          clearAuth();
        } else if (storedToken) {
          try {
            const res = await axios.get(`${API_URL}/user/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            const profile = res.data.user || res.data;
            const isLocal = !!localStorage.getItem("token");
            persistAuth(profile, storedToken, isLocal);
          } catch (err) {
            console.warn("Could not fetch profile with stored token:", err);
            clearAuth();
          }
        }
      } catch (error) {
        console.error("Error bootstrapping auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [persistAuth]);

  // save transactions to storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    } catch (err) {
      console.error("Error saving transactions:", err);
    }
  }, [transactions]);

  const handleLogin = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/");
  };

  const handleSignup = (userData, remember = false, tokenFromApi = null) => {
    persistAuth(userData, tokenFromApi, remember);
    navigate("/");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const updateUserData = (newUserData) => {
    const isLocal = !!localStorage.getItem("token");
    persistAuth(newUserData, token, isLocal);
  };

  const addTransaction = (newTransaction) =>
    setTransactions((p) => [newTransaction, ...p]);
  const editTransaction = (id, updatedTransaction) =>
    setTransactions((p) =>
      p.map((t) => (t.id === id ? { ...updatedTransaction, id } : t)),
    );
  const deleteTransaction = (id) =>
    setTransactions((p) => p.filter((t) => t.id !== id));
  const refreshTransactions = () =>
    setTransactions(getTransactionsFromStorage());

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollTop />
      <Routes>
        <Route
          path="/login"
          element={
            user && (localStorage.getItem("token") || sessionStorage.getItem("token")) ? (
              <Navigate to="/" />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user && (localStorage.getItem("token") || sessionStorage.getItem("token")) ? (
              <Navigate to="/" />
            ) : (
              <Signup onSignup={handleSignup} />
            )
          }
        />

        {/* Pathless Layout Route: Always matches, providing the Layout to all children */}
        <Route
          element={
            <ProtectedRoute user={user}>
              <Layout
                user={user}
                onLogout={handleLogout}
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            </ProtectedRoute>
          }
        >
          {/* Use absolute paths for all child routes */}
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/income"
            element={
              <Income
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path="/expenses"
            element={
              <Expenses
                transactions={transactions}
                addTransaction={addTransaction}
                editTransaction={editTransaction}
                deleteTransaction={deleteTransaction}
                refreshTransactions={refreshTransactions}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                onUpdateProfile={updateUserData}
                onLogout={handleLogout}
              />
            }
          />
        </Route>

        {/* Fallback for unauthenticated users */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default App;
