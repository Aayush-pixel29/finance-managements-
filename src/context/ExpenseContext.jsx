/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGroup } from './GroupContext';
import {
  subscribeToExpenses,
  subscribeToBudgets,
  addExpense as apiAddExpense,
  deleteExpense as apiDeleteExpense,
  setBudget as apiSetBudget,
  deleteBudget as apiDeleteBudget,
  addRecurringExpense as apiAddRecurringExpense
} from '../services/expenseService';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { currentGroupId, groupMembers } = useGroup();

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  useEffect(() => {
    if (!currentGroupId) {
      setExpenses([]);
      setBudgets({});
      setLoadingExpenses(false);
      return;
    }

    setLoadingExpenses(true);
    const unsubExpenses = subscribeToExpenses(currentGroupId, (data) => {
      setExpenses(data);
      setLoadingExpenses(false);
    });

    const unsubBudgets = subscribeToBudgets(currentGroupId, (data) => {
      setBudgets(data);
    });

    return () => {
      unsubExpenses();
      unsubBudgets();
    };
  }, [currentGroupId]);

  const addExpense = async (expenseData, isRecurring = false) => {
    if (!currentUser || !currentGroupId) return;
    if (isRecurring) {
      await apiAddRecurringExpense(expenseData, currentUser, currentGroupId, groupMembers);
    }
    return await apiAddExpense(expenseData, currentUser, currentGroupId, groupMembers);
  };

  // Fixed: Strictly guarantees that the payer is the authenticated currentUser
  const recordSettlement = async (toUser, amount) => {
    if (!currentUser || !currentGroupId || !toUser) return;
    const cleanTo = toUser.toLowerCase().trim();
    if (cleanTo === currentUser.toLowerCase()) {
      throw new Error("Cannot settle debt with yourself");
    }

    const expenseData = {
      amount: Number(amount),
      description: `Settlement payment to ${cleanTo.split('@')[0]}`,
      section: 'Settlement',
      type: 'Settlement',
      isShared: true,
      paidBy: currentUser.toLowerCase(),
      settleTo: cleanTo,
      splitMembers: [currentUser.toLowerCase(), cleanTo]
    };
    return await apiAddExpense(expenseData, currentUser, currentGroupId, groupMembers);
  };

  const deleteExpense = async (id) => {
    await apiDeleteExpense(id);
  };

  const saveBudget = async (section, amount) => {
    if (!currentGroupId) return;
    await apiSetBudget(section, amount, currentGroupId);
  };

  const removeBudget = async (section) => {
    if (!currentGroupId) return;
    await apiDeleteBudget(section, currentGroupId);
  };

  const calculateBalances = () => {
    const members = Array.from(new Set(groupMembers.length > 0 ? groupMembers : [currentUser])).filter(Boolean);
    const netBalances = {};
    members.forEach((m) => (netBalances[m] = 0));

    expenses.forEach((exp) => {
      const amount = Number(exp.amount) || 0;
      const payer = exp.paidBy?.toLowerCase();

      // Case 1: Direct Settlement
      if (exp.type === 'Settlement' && exp.settleTo) {
        const receiver = exp.settleTo.toLowerCase();
        if (netBalances[payer] !== undefined) netBalances[payer] += amount;
        if (netBalances[receiver] !== undefined) netBalances[receiver] -= amount;
        return;
      }

      // Case 2: Shared Expense
      if (exp.isShared && exp.type === 'Expense') {
        const participants = (exp.splitMembers && exp.splitMembers.length > 0)
          ? exp.splitMembers.map((m) => m.toLowerCase())
          : members;

        const count = participants.length || 1;
        const splitAmount = amount / count;

        if (netBalances[payer] !== undefined) {
          netBalances[payer] += amount;
        }

        participants.forEach((p) => {
          if (netBalances[p] !== undefined) {
            netBalances[p] -= splitAmount;
          }
        });
      }
    });

    const debtors = [];
    const creditors = [];

    Object.entries(netBalances).forEach(([member, bal]) => {
      const rounded = Math.round(bal * 100) / 100;
      if (rounded < -0.5) debtors.push({ member, amount: -rounded });
      else if (rounded > 0.5) creditors.push({ member, amount: rounded });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
      const debtor = debtors[d];
      const creditor = creditors[c];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.1) {
        transactions.push({
          from: debtor.member,
          to: creditor.member,
          amount: Math.round(settleAmount * 100) / 100
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount < 0.1) d++;
      if (creditor.amount < 0.1) c++;
    }

    return {
      netBalances,
      settlementTransactions: transactions,
      memberCount: members.length
    };
  };

  const value = {
    expenses,
    budgets,
    loadingExpenses,
    addExpense,
    recordSettlement,
    deleteExpense,
    saveBudget,
    removeBudget,
    calculateBalances
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error("useExpenses must be used within an ExpenseProvider");
  return context;
};
