/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  syncUserProfile
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up any existing profile listener on auth state change
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (user && user.email) {
        const lowerEmail = user.email.toLowerCase();
        setCurrentUser(lowerEmail);
        await syncUserProfile(user);

        // Listen to user profile document in Firestore
        const userRef = doc(db, "users", lowerEmail);
        unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile({ email: lowerEmail, displayName: user.displayName || lowerEmail.split('@')[0] });
          }
        }, (err) => {
          console.error("Profile listener error:", err);
        });

        setLoading(false);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubscribeAuth();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login: loginWithEmail,
    register: registerWithEmail,
    loginGoogle: loginWithGoogle,
    resetPassword: resetPassword,
    logout: logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
