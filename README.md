# 📊 BudgetWise AI – Smart Budget Tracker & Personal Finance Manager

[![React](https://img.shields.io/badge/Frontend-React%20(Vite)-61dafb?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2F%20LocalJSON-47a248?logo=mongodb)](https://www.mongodb.com/)
[![AI-Powered](https://img.shields.io/badge/AI--Powered-Google%20Gemini-4285f4?logo=google-gemini)](https://deepmind.google/technologies/gemini/)

BudgetWise AI is an enterprise-grade, gamified personal finance manager and smart budget tracker. It incorporates Gemini-powered financial audits, OCR receipt scanners, automatic cron billing schedules, Razorpay premium simulations, and a production-ready **System Admin Console** for complete operational control.

Designed with a sleek glassmorphic theme supporting seamless **Light & Dark mode** remapping, this project is built to demonstrate production-level full-stack architecture, clean code principles, and role-based access controls.

---

## 🌟 Key Features

### 👤 User Panel Modules
- **Gamified Financial Ledger**: Earn XP and Gold Coins dynamically by tracking expenses, updating wallets, and completing active savings milestones. Level up your finance rank from Level 1 upwards.
- **Smart Dual-Mode Database**: Operates using a custom file-based mock Mongoose database (`server/data/*.json`) when no `MONGO_URI` is provided, and automatically switches to high-availability MongoDB Atlas when connection keys are present.
- **Receipt OCR Parsing**: Drag and drop shopping invoices. Utilizes `Tesseract.js` + Google Gemini APIs to instantly parse Merchant Name, Invoice Date, total amounts, and tax breakdowns.
- **AI Financial Advisory**: Analyzes your monthly heatmaps, wallet trends, and budget warnings to give contextual, actionable suggestions via `gemini-1.5-flash`.
- **Payment & Premium Simulator**: Complete Razorpay-styled premium upgrade checkout widget simulation (UPI, netbanking, cards) with transaction log ledgers.
- **Auto-Billing Scheduler**: Startup cron job checks upcoming EMI cycles, subscription billings, and utility reminders, automatically deducting balances from wallets and logging notification cards.
- **Export Formats**: Generate detailed statements in PDF format (using `pdfkit`) or raw Excel spreadsheets (using `xlsx`).

### 👨💼 Admin Control Panel (System Console)
- **Interactive Analytics**: Monitor total registered users, active user ratios, monthly signup trends, and total premium subscription revenue charts.
- **User Operations Control**: Search, inspect, suspend, reactivate, manually grant/revoke PRO memberships, or wipe user accounts recursively.
- **System-Wide Auditing**: Tracks all user transactions with automated warning flags highlighting suspicious items (transactions exceeding ₹1,00,000).
- **Global Settings & Broadcaster**: Form to send broadcast banners (e.g., system updates, maintenance offers) to all active users' trays.
- **Feedback Hub**: Star ratings reviews hub with direct admin reply comments panel.
- **AI & Security Logs**: Telemetry monitoring of total Gemini requests, failed login records, blocked IPs, and API response speeds.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Vite), Redux Toolkit, React Router v6 | Single Page App architecture, global state store |
| **Styling** | Tailwind CSS v4, Framer Motion, Recharts | Glassmorphism, premium micro-animations, charts |
| **Backend** | Node.js, Express.js | REST API routing, cron scheduling, error handlers |
| **Database** | MongoDB Atlas / Local JSON Mock database | Dual-mode storage compatibility |
| **AI Integration** | Gemini API (`gemini-1.5-flash`) | Natural language parsing & advisory generation |
| **OCR Scanner** | Tesseract.js | In-browser client-side optical character recognition |
| **Security** | JWT, bcryptjs, Helmet, Mongo-Sanitize, CORS | Standard web security middlewares |

---

## ⚙️ Project Architecture

```text
BudgetTracker/
├── client/
│   ├── src/
│   │   ├── components/      # Common components (Layout, PrivateRoute)
│   │   ├── pages/           # Views (Dashboard, AdminDashboard, Settings, AIAdvisor)
│   │   ├── store/           # Redux state slices (authSlice, financeSlice)
│   │   └── index.css        # Tailwind styling & light/dark variables
│   └── vite.config.js       # Vite proxy & compile guidelines
├── server/
│   ├── config/              # Database adapter (db.js) & seed scripts (seed.js)
│   ├── controllers/         # REST handler controllers (auth, finance, admin)
│   ├── middleware/          # JWT check & admin RBAC middleware
│   ├── models/              # Schema blueprints (models.js)
│   └── routes/              # Express API routers (api.js, admin.js)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Backend Server Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install npm modules:
   ```bash
   npm install
   ```
3. Configure environment variables. Create a `.env` file in the root of the `/server` directory:
   ```env
   PORT=5005
   MONGO_URI=
   JWT_SECRET=super_secret_budget_key_12345
   JWT_REFRESH_SECRET=refresh_super_secret_budget_key_54321
   GEMINI_API_KEY=
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *Note: On boot, the server will automatically seed the default admin account and pre-populate mock data for visual charts.*

### 3. Frontend Client Setup
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at `http://localhost:3000`.

---

## 🔑 Demo & Test Credentials

On system startup, the local JSON database is pre-seeded with these test credentials for validation:

### 👨💼 System Administrator Account
- **Email**: `admin@budgetwise.com`
- **Password**: `adminpassword`
- *Accesses the complete System Admin Dashboard with User suspension toggles, suspicious transaction alerts, and broadcast forms.*

### 👤 Regular User Account
- **Email**: `piyush@gmail.com`
- **Password**: `password123`
- *Accesses the gamified dashboard, wallet logs, savings trackers, reports, and AI advisor.*
