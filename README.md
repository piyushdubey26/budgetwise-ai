# BudgetWise AI – Smart Budget Tracker & Personal Finance Manager

BudgetWise AI is an advanced, premium-design smart budget tracker and personal finance manager built using a Node.js + Express backend and a React + Tailwind CSS frontend.

## Key Features

1. **Dual-Mode Database**: Fallback file-based database that stores arrays inside `server/data/` if MongoDB is not running locally. If a `MONGO_URI` is supplied in `.env`, it connects using standard Mongoose.
2. **Auto-Billing & Recurring Scheduler**: Scheduler running at server launch (and periodic intervals) checking due schedules for EMIs, Bills, and Subscriptions, deducting balances from wallets, and triggering notification center alerts.
3. **Receipt Scanner (OCR)**: Upload receipt images to parse Merchant name, totals, GST numbers, and invoice dates utilizing `Tesseract.js` OCR and Google Gemini text parsing.
4. **AI Financial Advisor**: Directly prompts the `gemini-1.5-flash` model (or fallback mock parser) to inspect your spending heatmap, wallets, and budgets, offering actionable recommendations.
5. **Gamification Board**: Earn Coins and XP for logging transactions and achieving saving targets. Level up your profile rank.
6. **Premium plan Simulation**: Razorpay trusted checkout widget simulator supporting UPI, Cards, Netbanking success and failure verification loops.
7. **Excel & PDF Statements**: Standard report builders utilizing `xlsx` and `pdfkit`.

---

## Getting Started

### Prerequisites
- Node.js installed on your Mac.

### Installation & Launch

1. **Start the Backend Server**:
   ```bash
   cd server
   # Create a .env file and add keys if you want to use MongoDB and Gemini (optional)
   npm install
   npm start
   ```

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Open the browser**:
   Navigate to the dev server port outputted by Vite (typically `http://localhost:3000` or `http://localhost:5173`).
