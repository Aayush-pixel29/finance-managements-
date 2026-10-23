/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToUserGroups,
  createGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup as apiDeleteGroup
} from '../services/groupService';
import { processRecurringExpenses } from '../services/expenseService';

const GroupContext = createContext(null);

export const GroupProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userGroups, setUserGroups] = useState([]);
  const [currentGroupId, setCurrentGroupIdState] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const getStorageKey = (user) => `family_finance_active_group_${(user || '').toLowerCase()}`;

  const setCurrentGroupId = useCallback((groupId) => {
    setCurrentGroupIdState(groupId);
    if (currentUser && groupId) {
      try {
        localStorage.setItem(getStorageKey(currentUser), groupId);
      } catch (err) {
        console.error("Failed to persist active group:", err);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setUserGroups([]);
      setCurrentGroupIdState(null);
      setLoadingGroups(false);
      return;
    }

    setLoadingGroups(true);
    const unsub = subscribeToUserGroups(currentUser, async (groups) => {
      setUserGroups(groups);

      if (groups.length === 0) {
        // Automatically create a starting group for truly new users
        try {
          const defaultGroup = await createGroup("Personal & Family", currentUser);
          if (defaultGroup) {
            setCurrentGroupId(defaultGroup.id);
          }
        } catch (e) {
          console.error("Error creating default group:", e);
        }
      } else {
        // Read saved active group from localStorage
        let savedId = null;
        try {
          savedId = localStorage.getItem(getStorageKey(currentUser));
        } catch {
          // ignore storage error
        }

        if (savedId && groups.some((g) => g.id === savedId)) {
          setCurrentGroupIdState(savedId);
        } else {
          setCurrentGroupIdState((prevId) => {
            if (prevId && groups.some((g) => g.id === prevId)) {
              return prevId;
            }
            return groups[0].id;
          });
        }
      }
      setLoadingGroups(false);
    });

    return () => unsub();
  }, [currentUser, setCurrentGroupId]);

  // Run recurring expenses check whenever active group or user changes
  useEffect(() => {
    if (currentGroupId && currentUser) {
      processRecurringExpenses([currentGroupId], currentUser);
    }
  }, [currentGroupId, currentUser]);

  const currentGroup = userGroups.find((g) => g.id === currentGroupId) || null;
  const groupMembers = currentGroup ? currentGroup.members : (currentUser ? [currentUser] : []);

  const handleCreateGroup = async (name, initialMembers = []) => {
    if (!currentUser || !name.trim()) return null;
    const newGroup = await createGroup(name.trim(), currentUser, initialMembers);
    if (newGroup) {
      setCurrentGroupId(newGroup.id);
    }
    return newGroup;
  };

  const handleAddMember = async (email) => {
    if (!currentGroupId || !email.trim()) return;
    await addMemberToGroup(currentGroupId, email.trim());
  };

  const handleRemoveMember = async (targetGroupId, email) => {
    const targetId = targetGroupId || currentGroupId;
    if (!targetId || !email.trim()) return;
    await removeMemberFromGroup(targetId, email.trim());
    if (email.toLowerCase() === currentUser.toLowerCase() && targetId === currentGroupId) {
      const remaining = userGroups.filter((g) => g.id !== currentGroupId);
      if (remaining.length > 0) {
        setCurrentGroupId(remaining[0].id);
      }
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!groupId || !currentUser) return;
    await apiDeleteGroup(groupId);
    const remaining = userGroups.filter((g) => g.id !== groupId);
    if (groupId === currentGroupId) {
      if (remaining.length > 0) {
        setCurrentGroupId(remaining[0].id);
      } else {
        setCurrentGroupId(null);
      }
    }
  };

  const value = {
    userGroups,
    currentGroupId,
    currentGroup,
    groupMembers,
    loadingGroups,
    setCurrentGroupId,
    createGroup: handleCreateGroup,
    addMember: handleAddMember,
    removeMember: handleRemoveMember,
    deleteGroup: handleDeleteGroup
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroup must be used within a GroupProvider");
  return context;
};
