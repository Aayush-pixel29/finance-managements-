import { collection, addDoc, query, onSnapshot, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const GROUPS_COLLECTION = "groups";

export const createGroup = async (name, currentUser, initialMembers = []) => {
  if (!db) return null;
  try {
    const members = Array.from(new Set([currentUser, ...initialMembers])); // Ensure creator is included and unique
    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
      name,
      members,
      createdBy: currentUser,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, name, members };
  } catch (error) {
    console.error("Error creating group: ", error);
    throw error;
  }
};

export const addMemberToGroup = async (groupId, email) => {
  if (!db) return;
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    // Use arrayUnion to add without duplicates
    await updateDoc(groupRef, {
      members: arrayUnion(email.toLowerCase())
    });
  } catch (error) {
    console.error("Error adding member: ", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (groupId, email) => {
  if (!db) return;
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(email.toLowerCase())
    });
  } catch (error) {
    console.error("Error removing member: ", error);
    throw error;
  }
};

export const subscribeToUserGroups = (currentUser, callback) => {
  if (!db) return () => {};
  const q = query(collection(db, GROUPS_COLLECTION), where("members", "array-contains", currentUser));
  return onSnapshot(q, (snapshot) => {
    const groups = [];
    snapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    callback(groups);
  });
};

