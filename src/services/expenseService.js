import {
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDocs,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

const COLLECTION_NAME = "expenses";
const BUDGETS_COLLECTION = "budgets";
const RECURRING_COLLECTION = "recurring_expenses";

// --- EXPENSES & SETTLEMENTS ---
export const addExpense = async (expenseData, currentUser, groupId, groupMembers = []) => {
  if (!db || !groupId) throw new Error("Database or Group ID missing");
  try {
    const amountNum = Math.round(Number(expenseData.amount) * 100) / 100;
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error("Invalid expense amount");
    }

    const splitMembers = (expenseData.splitMembers && expenseData.splitMembers.length > 0)
      ? expenseData.splitMembers.map(m => m.toLowerCase())
      : groupMembers.map(m => m.toLowerCase());

    const payload = {
      amount: amountNum,
      description: (expenseData.description || '').trim(),
      section: expenseData.section || 'General',
      type: expenseData.type || 'Expense', // 'Expense' | 'Savings' | 'Settlement'
      isShared: expenseData.isShared !== undefined ? expenseData.isShared : true,
      paidBy: currentUser.toLowerCase(),
      splitMembers: splitMembers,
      settleTo: expenseData.settleTo ? expenseData.settleTo.toLowerCase() : null,
      paymentMethod: expenseData.paymentMethod || 'UPI',
      tag: expenseData.tag || null,
      hasBillReceipt: Boolean(expenseData.hasBillReceipt),
      groupId: groupId,
      createdAt: expenseData.createdAt || new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Error adding expense document: ", error);
    throw error;
  }
};

export const subscribeToExpenses = (groupId, callback) => {
  if (!db || !groupId) return () => {};

  const q = query(
    collection(db, COLLECTION_NAME),
    where("groupId", "==", groupId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const expenses = [];
    querySnapshot.forEach((docSnap) => {
      expenses.push({ id: docSnap.id, ...docSnap.data() });
    });
    expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback(expenses);
  }, (error) => {
    console.error("Error listening to expenses:", error);
  });
};

export const deleteExpense = async (id) => {
  if (!db || !id) return;
  try {
    const expenseRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense: ", error);
    throw error;
  }
};

// --- BUDGETS ---
export const setBudget = async (section, amount, groupId) => {
  if (!db || !groupId || !section) return;
  try {
    const cleanAmount = Math.max(0, Math.round(Number(amount) * 100) / 100);
    const budgetId = `${groupId}_${section.replace(/\s+/g, '_')}`;
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);

    await setDoc(budgetRef, {
      section: section,
      amount: cleanAmount,
      groupId: groupId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error setting budget: ", error);
    throw error;
  }
};

export const deleteBudget = async (section, groupId) => {
  if (!db || !groupId || !section) return;
  try {
    const budgetId = `${groupId}_${section.replace(/\s+/g, '_')}`;
    await deleteDoc(doc(db, BUDGETS_COLLECTION, budgetId));
  } catch (error) {
    console.error("Error deleting budget:", error);
  }
};

export const subscribeToBudgets = (groupId, callback) => {
  if (!db || !groupId) return () => {};
  const q = query(
    collection(db, BUDGETS_COLLECTION),
    where("groupId", "==", groupId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const budgets = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      budgets[data.section] = data;
    });
    callback(budgets);
  }, (err) => {
    console.error("Error subscribing to budgets:", err);
  });
};

// --- RECURRING EXPENSES ---
export const addRecurringExpense = async (expenseData, currentUser, groupId, groupMembers = []) => {
  if (!db || !groupId || !currentUser) return;
  try {
    const splitMembers = (expenseData.splitMembers && expenseData.splitMembers.length > 0)
      ? expenseData.splitMembers.map(m => m.toLowerCase())
      : groupMembers.map(m => m.toLowerCase());

    await addDoc(collection(db, RECURRING_COLLECTION), {
      amount: Math.round(Number(expenseData.amount) * 100) / 100,
      description: (expenseData.description || '').trim(),
      section: expenseData.section || 'General',
      type: expenseData.type || 'Expense',
      isShared: expenseData.isShared !== undefined ? expenseData.isShared : true,
      paidBy: currentUser.toLowerCase(),
      splitMembers: splitMembers,
      groupId: groupId,
      lastProcessedMonth: format(new Date(), 'yyyy-MM'),
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding recurring expense: ", error);
    throw error;
  }
};

export const processRecurringExpenses = async (groupIds = [], currentUserEmail = '') => {
  if (!db || !groupIds || groupIds.length === 0 || !currentUserEmail) return;
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const userLower = currentUserEmail.toLowerCase();

  try {
    for (const groupId of groupIds) {
      const q = query(
        collection(db, RECURRING_COLLECTION),
        where("groupId", "==", groupId),
        where("paidBy", "==", userLower)
      );
      const snapshot = await getDocs(q);

      for (const documentSnap of snapshot.docs) {
        const data = documentSnap.data();
        if (data.lastProcessedMonth !== currentMonthStr) {
          const recurringRef = doc(db, RECURRING_COLLECTION, documentSnap.id);
          const newExpenseRef = doc(collection(db, COLLECTION_NAME));

          await runTransaction(db, async (transaction) => {
            const currentRec = await transaction.get(recurringRef);
            if (!currentRec.exists() || currentRec.data().lastProcessedMonth === currentMonthStr) {
              return;
            }

            transaction.set(newExpenseRef, {
              amount: data.amount,
              description: `${data.description} (Auto Recurring)`,
              section: data.section,
              type: data.type,
              isShared: data.isShared,
              paidBy: data.paidBy,
              splitMembers: data.splitMembers || [],
              groupId: data.groupId,
              createdAt: new Date().toISOString()
            });

            transaction.update(recurringRef, {
              lastProcessedMonth: currentMonthStr
            });
          });
        }
      }
    }
  } catch (err) {
    console.error("Error processing recurring expenses", err);
  }
};
