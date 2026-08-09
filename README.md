# Family Expense Manager 💰

A premium, modern React web application for managing family and group finances. It features real-time synchronization, multi-group support, and a highly polished UI/UX aesthetic tailored for mobile devices.

## 🚀 Live Demo
**[https://family-expenseapp.web.app](https://family-expenseapp.web.app)**

## ✨ Features
* **Multi-Group Architecture:** Create isolated environments for different trips, events, or friend groups (e.g., "Family Finances", "Goa Trip 2026").
* **Smart Splitwise Logic:** Automatically tracks who paid for what and calculates precise debt balances between group members.
* **Recurring Expenses:** Automates monthly subscription and utility bills.
* **Premium UI/UX:** Built with a "visible easy" Light Mode aesthetic featuring glass-card diffusion, micro-animations, and modern Fintech Blue accents.
* **Real-time Sync:** Powered by Firebase Firestore for instant updates across all family members' devices.
* **Progressive Web App (PWA):** Can be installed directly to your phone's home screen for a native app-like experience.
* **Secure Authentication:** Passwordless Google Sign-In with iOS Safari compatibility.
* **PDF Export:** Generate monthly expenditure reports with one click.

## 🛠️ Technology Stack
* **Frontend:** React, Vite, CSS (Vanilla)
* **Backend:** Firebase (Firestore, Authentication, Hosting)
* **Charts:** Recharts
* **Icons:** Lucide React
* **Date Parsing:** date-fns

## 📦 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Aayush-pixel29/finance-managements-.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security & Privacy
All expense data is siloed strictly by `groupId` using secure Firestore rules. Users can only view and interact with data inside groups they are explicitly members of.
