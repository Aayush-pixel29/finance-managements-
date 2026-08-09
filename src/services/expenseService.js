import { collection, addDoc, query, onSnapshot, orderBy, deleteDoc, doc, setDoc, getDocs, updateDoc, runTransaction, where } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

const COLLECTION_NAME = "expenses";
const BUDGETS_COLLECTION = "budgets";
const RECURRING_COLLECTION = "recurring_expenses";
const USERS_COLLECTION = "users";

// --- USERS ---
export const registerUser = async (email) => {
  if (!db) return;
  try {
    await setDoc(doc(db, USERS_COLLECTION, email), {
      email,
      lastSeen: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Error registering user", err);
  }
};

export const subscribeToUsers = (callback) => {
  if (!db) return () => {};
  return onSnapshot(collection(db, USERS_COLLECTION), (snapshot) => {
    const users = [];
    snapshot.forEach((doc) => {
      users.push(doc.data().email);
    });
    callback(users);
  });
};

// --- EXPENSES ---
export const addExpense = async (expenseData, currentUser, groupId) => {
  if (!db) return;
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      amount: Number(expenseData.amount),
      description: expenseData.description,
      section: expenseData.section,
      type: expenseData.type,
      isShared: expenseData.isShared || false,
      paidBy: currentUser,
      groupId: groupId || "default", // legacy fallback
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const subscribeToExpenses = (groupId, callback) => {
  if (!db) return () => {};
  
  // To avoid requiring a Firestore Composite Index for (groupId + createdAt), 
  // we remove orderBy from the query and sort client-side instead.
  const q = groupId 
    ? query(collection(db, COLLECTION_NAME), where("groupId", "==", groupId))
    : collection(db, COLLECTION_NAME);
    
  return onSnapshot(q, (querySnapshot) => {
    const expenses = [];
    querySnapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    // Sort client-side (descending by createdAt)
    expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback(expenses);
  });
};

export const deleteExpense = async (id) => {
  if (db) {
    try {
      const expenseRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error("Error deleting expense: ", error);
      throw error;
    }
  }
};

// --- BUDGETS ---
export const setBudget = async (section, amount, groupId) => {
  if (!db) return;
  try {
    const budgetId = `${groupId || "default"}_${section}`;
    const budgetRef = doc(db, BUDGETS_COLLECTION, budgetId);
    await setDoc(budgetRef, {
      section: section,
      amount: Number(amount),
      groupId: groupId || "default",
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error setting budget: ", error);
  }
};

export const subscribeToBudgets = (groupId, callback) => {
  if (!db) return () => {};
  const q = groupId 
    ? query(collection(db, BUDGETS_COLLECTION), where("groupId", "==", groupId))
    : collection(db, BUDGETS_COLLECTION);
    
  return onSnapshot(q, (querySnapshot) => {
    const budgets = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      budgets[data.section] = data; // Keep it keyed by section for the frontend
    });
    callback(budgets);
  });
};

// --- RECURRING EXPENSES ---
export const addRecurringExpense = async (expenseData, currentUser, groupId) => {
  if (!db) return;
  try {
    await addDoc(collection(db, RECURRING_COLLECTION), {
      amount: Number(expenseData.amount),
      description: expenseData.description,
      section: expenseData.section,
      type: expenseData.type,
      isShared: expenseData.isShared || false,
      paidBy: currentUser,
      groupId: groupId || "default",
      lastProcessedMonth: "",
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding recurring expense: ", error);
  }
};

export const processRecurringExpenses = async (groupIds = []) => {
  if (!db || groupIds.length === 0) return;
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  
  try {
    // Process for each group the user belongs to
    for (const groupId of groupIds) {
      const q = query(collection(db, RECURRING_COLLECTION), where("groupId", "==", groupId));
      const snapshot = await getDocs(q);
      
      for (const document of snapshot.docs) {
        const data = document.data();
        if (data.lastProcessedMonth !== currentMonthStr) {
          
          const recurringRef = doc(db, RECURRING_COLLECTION, document.id);
          const newExpenseRef = doc(collection(db, COLLECTION_NAME));
          
          await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(recurringRef);
            if (!sfDoc.exists()) return;
            if (sfDoc.data().lastProcessedMonth === currentMonthStr) return; // Already processed
            
            transaction.set(newExpenseRef, {
              amount: data.amount,
              description: data.description + " (Recurring)",
              section: data.section,
              type: data.type,
              isShared: data.isShared,
              paidBy: data.paidBy,
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

// --- MIGRATION UTILITY ---
export const migrateExistingDataToGroup = async (groupId) => {
  if (!db) return;
  console.log("Starting migration to group:", groupId);
  try {
    // Migrate Expenses
    const expSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    let expCount = 0;
    expSnapshot.forEach(async (document) => {
      if (!document.data().groupId) {
        await updateDoc(doc(db, COLLECTION_NAME, document.id), { groupId });
        expCount++;
      }
    });

    // Migrate Budgets
    const budSnapshot = await getDocs(collection(db, BUDGETS_COLLECTION));
    let budCount = 0;
    budSnapshot.forEach(async (document) => {
      if (!document.data().groupId) {
        // Create new doc with proper ID, delete old one
        const data = document.data();
        const newId = `${groupId}_${data.section || document.id}`;
        await setDoc(doc(db, BUDGETS_COLLECTION, newId), { ...data, groupId });
        await deleteDoc(doc(db, BUDGETS_COLLECTION, document.id));
        budCount++;
      }
    });

    // Migrate Recurring
    const recSnapshot = await getDocs(collection(db, RECURRING_COLLECTION));
    let recCount = 0;
    recSnapshot.forEach(async (document) => {
      if (!document.data().groupId) {
        await updateDoc(doc(db, RECURRING_COLLECTION, document.id), { groupId });
        recCount++;
      }
    });
    
    console.log(`Migration complete. Moved ${expCount} expenses, ${budCount} budgets, ${recCount} recurring.`);
    return true;
  } catch (err) {
    console.error("Migration failed:", err);
    return false;
  }
};
