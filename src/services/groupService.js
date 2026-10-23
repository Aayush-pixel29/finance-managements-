import {
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

const GROUPS_COLLECTION = "groups";

export const createGroup = async (name, currentUser, initialMembers = []) => {
  if (!db || !currentUser) return null;
  try {
    const creator = currentUser.toLowerCase();
    const members = Array.from(new Set([creator, ...initialMembers.map(m => m.toLowerCase().trim())]));

    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
      name: name.trim(),
      members,
      createdBy: creator,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, name: name.trim(), members, createdBy: creator };
  } catch (error) {
    console.error("Error creating group: ", error);
    throw error;
  }
};

export const addMemberToGroup = async (groupId, email) => {
  if (!db || !groupId || !email) return;
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(email.trim().toLowerCase())
    });
  } catch (error) {
    console.error("Error adding member: ", error);
    throw error;
  }
};

export const removeMemberFromGroup = async (groupId, email) => {
  if (!db || !groupId || !email) return;
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(email.trim().toLowerCase())
    });
  } catch (error) {
    console.error("Error removing member: ", error);
    throw error;
  }
};

export const deleteGroup = async (groupId) => {
  if (!db || !groupId) return;
  try {
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    await deleteDoc(groupRef);
  } catch (error) {
    console.error("Error deleting group: ", error);
    throw error;
  }
};

export const subscribeToUserGroups = (currentUser, callback) => {
  if (!db || !currentUser) return () => {};
  const emailLower = currentUser.toLowerCase();
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where("members", "array-contains", emailLower)
  );

  return onSnapshot(q, (snapshot) => {
    const groups = [];
    snapshot.forEach((docSnap) => {
      groups.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort oldest first so initial created group stays primary, or sort by creation
    groups.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    callback(groups);
  }, (error) => {
    console.error("Error subscribing to groups: ", error);
  });
};
