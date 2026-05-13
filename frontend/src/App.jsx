import { useState, useEffect } from "react";
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

const API_URL = "http://localhost:4000/api";

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
  const persistAuth = (userObj, tokenStr, remember = false) => {
    try {
      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;

      if (userObj) storage.setItem("user", JSON.stringify(userObj));
      if (tokenStr) storage.setItem("token", tokenStr);

      otherStorage.removeItem("user");
      otherStorage.removeItem("token");

      setUser(userObj || null);
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };

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

        if (storedToken) {
          try {
            const res = await axios.get(`${API_URL}/user/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            const profile = res.data;
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
  }, []);

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
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" /> : <Signup onSignup={handleSignup} />
          }
        />

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
          <Route
            path="/"
            element={<Dashboard />}
          />
        </Route>

        {/* Fallback for unauthenticated users */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
