<div align="center">
  <h1>💰 Expense Tracker</h1>
  <p>A full-stack expense management application built with the MERN stack</p>
  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#api-endpoints">API Endpoints</a> •
    <a href="#environment-variables">Environment Variables</a>
  </p>
</div>

---

## 📋 Overview

Expense Tracker is a full-stack web application that helps users track their personal finances. It allows users to record incomes and expenses, categorize transactions, and visualize their financial data through an interactive dashboard.

## ✨ Features

- **User Authentication** — Secure registration and login with JWT-based authentication
- **Income Management** — Add, edit, delete and view income entries with categories
- **Expense Tracking** — Record and manage expenses with detailed categorization
- **Dashboard Analytics** — Visual summary of financial data with charts and statistics
- **Profile Management** — Update profile information and change password
- **Data Export** — Download income/expense data in Excel format
- **Responsive Design** — Optimized for both desktop and mobile devices

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication |
| **bcryptjs** | Password hashing |
| **validator** | Input validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React** | UI library |
| **Vite** | Build tool |
| **React Router** | Client-side routing |
| **CSS/Tailwind** | Styling |

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DeshanE404/Expense-Tracker.git
   cd Expense-Tracker
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials (see [Environment Variables](#environment-variables) section).

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:4000`.

5. **Frontend setup** (in a separate terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## ☁️ Deployment

### Deploy Backend on Vercel

This project is configured for Vercel deployment. Follow these steps:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com) and create an account
   - Click **Add New → Project**
   - Import your GitHub repository
   - Set the **Root Directory** to `backend`
   - Under **Environment Variables**, add the following:

3. **Configure Environment Variables in Vercel**
   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | Your MongoDB connection string |
   | `JWT_SECRET` | A strong random secret string |
   | `FRONTEND_URL` | Your frontend Vercel URL (e.g., `https://your-frontend.vercel.app`) |

4. **Deploy**
   - Click **Deploy**
   - Vercel will automatically build and deploy your backend

### Deploy Frontend on Vercel
1. Create a new Vercel project
2. Set **Root Directory** to `frontend`
3. Set environment variable `VITE_API_URL` to your backend URL
4. Deploy

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/user/register` | Register a new user | No |
| POST | `/api/user/login` | Login | No |
| GET | `/api/user/me` | Get current user | Yes |
| PUT | `/api/user/profile` | Update profile | Yes |
| PUT | `/api/user/password` | Change password | Yes |

### Income
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/income` | Get all incomes | Yes |
| POST | `/api/income` | Add new income | Yes |
| PUT | `/api/income/:id` | Update income | Yes |
| DELETE | `/api/income/:id` | Delete income | Yes |

### Expenses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/expenses` | Get all expenses | Yes |
| POST | `/api/expenses` | Add new expense | Yes |
| PUT | `/api/expenses/:id` | Update expense | Yes |
| DELETE | `/api/expenses/:id` | Delete expense | Yes |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get dashboard data | Yes |

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your_random_secret_string` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.vercel.app` |
| `PORT` | Server port (optional) | `4000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.vercel.app` |

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── dashboardController.js
│   │   ├── expenseController.js
│   │   ├── incomeController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── expenseModel.js
│   │   ├── incomeModel.js
│   │   └── userModels.js
│   ├── routes/
│   │   ├── dashboardRoute.js
│   │   ├── expenseRoute.js
│   │   ├── incomeRoute.js
│   │   └── userRoute.js
│   ├── utils/
│   │   └── dataFilter.js
│   ├── .env.example
│   ├── package.json
│   ├── server.js              # Entry point
│   └── vercel.json            # Vercel configuration
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── vercel.json                # Root Vercel config
└── README.md
```

## ✅ Backend Deployment Checklist

- [x] `vercel.json` configured for serverless deployment
- [x] Server exports `app` (Express app) for Vercel
- [x] Local-only `app.listen()` wrapped in production check
- [x] ES modules enabled (`"type": "module"`)
- [x] Environment variables separated between local and production
- [x] CORS configured with `FRONTEND_URL`
- [x] JWT secret reads from `process.env.JWT_SECRET`
- [x] Sensitive files in `.gitignore`

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">
  Built with ❤️ using the MERN stack
</div>