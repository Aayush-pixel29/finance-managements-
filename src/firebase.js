import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  projectId: "family-expenseapp",
  appId: "1:246130158919:web:5d0ec552d96b8622b57062",
  storageBucket: "family-expenseapp.firebasestorage.app",
  apiKey: "AIzaSyC5UqfExl81HZdUZ9rIrSeC5Oni1Mxx7dE",
  authDomain: "family-expenseapp.firebaseapp.com",
  messagingSenderId: "246130158919",
  measurementId: "G-VG14J4Y684",
  projectNumber: "246130158919",
  version: "2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
