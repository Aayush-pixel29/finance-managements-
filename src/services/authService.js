import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const syncUserProfile = async (user) => {
  if (!user || !user.email) return;
  const emailLower = user.email.toLowerCase();
  const userRef = doc(db, "users", emailLower);
  try {
    await setDoc(userRef, {
      uid: user.uid,
      email: emailLower,
      displayName: user.displayName || emailLower.split('@')[0],
      photoURL: user.photoURL || null,
      lastSeen: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Failed to sync user profile to Firestore:", err);
  }
};

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  await syncUserProfile(userCredential.user);
  return userCredential.user;
};

export const registerWithEmail = async (email, password, displayName = '') => {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  await syncUserProfile(userCredential.user);
  return userCredential.user;
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

export const logoutUser = async () => {
  await signOut(auth);
};
