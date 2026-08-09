import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Budgets from './components/Budgets';
import Balances from './components/Balances';
import Sidebar from './components/Sidebar';
import UserProfile from './components/UserProfile';
import { logoutUser } from './services/authService';
import { subscribeToExpenses, processRecurringExpenses, registerUser, migrateExistingDataToGroup } from './services/expenseService';
import { subscribeToUserGroups, createGroup } from './services/groupService';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from './firebase';
import { Home, Target, Users } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [userGroups, setUserGroups] = useState([]);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'budgets', 'balances'
  const [globalExpenses, setGlobalExpenses] = useState([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // 1. Auth Setup
  useEffect(() => {
    getRedirectResult(auth).catch((error) => console.error("Redirect auth error:", error));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user.email);
        registerUser(user.email);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch User Groups
  useEffect(() => {
    if (currentUser) {
      const unsubGroups = subscribeToUserGroups(currentUser, async (groups) => {
        setUserGroups(groups);
        
        // MIGRATION & DEFAULT GROUP LOGIC
        if (groups.length === 0) {
          // If the user has no groups, we create a default "My Family" group and run migration
          console.log("No groups found. Creating default and running migration...");
          const newGroup = await createGroup("My Family", currentUser);
          if (newGroup) {
            await migrateExistingDataToGroup(newGroup.id);
            setCurrentGroupId(newGroup.id);
          }
        } else {
          setCurrentGroupId(prevId => {
            if (!prevId || !groups.find(g => g.id === prevId)) {
              return groups[0].id;
            }
            return prevId;
          });
        }
      });
      return () => unsubGroups();
    }
  }, [currentUser]);

  // 3. Fetch Expenses & Process Recurring for Current Group
  useEffect(() => {
    if (currentUser && currentGroupId) {
      // Process recurring expenses for this group
      processRecurringExpenses([currentGroupId]);
      
      const unsubExpenses = subscribeToExpenses(currentGroupId, (data) => setGlobalExpenses(data));
      return () => unsubExpenses();
    }
  }, [currentUser, currentGroupId]);

  const handleLogout = async () => {
    await logoutUser();
  };
  
  const handleCreateGroup = async () => {
    if (newGroupName && currentUser) {
      const newGroup = await createGroup(newGroupName, currentUser);
      if (newGroup) {
        setCurrentGroupId(newGroup.id);
        setShowCreateGroup(false);
        setNewGroupName('');
      }
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text)' }}>Loading...</div>;
  if (!currentUser) return <Login />;

  const currentGroupObj = userGroups.find(g => g.id === currentGroupId);
  const familyMembers = currentGroupObj ? currentGroupObj.members : [];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        familyMembers={familyMembers}
        currentUser={currentUser}
        onSelectUser={(email) => {
          setSelectedProfileUser(email);
        }}
        onLogout={handleLogout}
        // Group props
        userGroups={userGroups}
        currentGroupId={currentGroupId}
        onSelectGroup={(id) => {
          setCurrentGroupId(id);
          setIsSidebarOpen(false);
        }}
        onCreateGroupClick={() => {
          setIsSidebarOpen(false);
          setShowCreateGroup(true);
        }}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {showCreateGroup ? (
           <div className="glass-card animate-slide-up" style={{ padding: '24px', margin: '16px' }}>
             <h2 className="text-xl font-bold mb-4">Create New Group</h2>
             <div className="input-group">
               <label>Group Name (e.g. Goa Trip 2026)</label>
               <input 
                 type="text" 
                 className="input-field" 
                 value={newGroupName} 
                 onChange={e => setNewGroupName(e.target.value)} 
                 autoFocus
               />
             </div>
             <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
               <button className="btn" onClick={handleCreateGroup}>Create</button>
               <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setShowCreateGroup(false)}>Cancel</button>
             </div>
           </div>
        ) : selectedProfileUser ? (
          <UserProfile 
            profileUser={selectedProfileUser}
            currentUser={currentUser}
            globalExpenses={globalExpenses}
            familyMembers={familyMembers}
            onBack={() => setSelectedProfileUser(null)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} onLogout={handleLogout} globalExpenses={globalExpenses} currentGroupId={currentGroupId} currentGroupName={currentGroupObj?.name || 'Loading...'} onOpenMenu={() => setIsSidebarOpen(true)} />}
            {activeTab === 'budgets' && <Budgets currentMonthExpenses={globalExpenses.filter(e => new Date(e.createdAt).getMonth() === new Date().getMonth())} currentGroupId={currentGroupId} />}
            {activeTab === 'balances' && <Balances expenses={globalExpenses} currentUser={currentUser} familyMembers={familyMembers} />}
          </>
        )}
      </div>

      {!selectedProfileUser && !showCreateGroup && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, 
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around', padding: '16px 8px', zIndex: 50,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.02)'
        }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '16px', backgroundColor: activeTab === 'dashboard' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', transition: 'all 0.2s ease' }}>
            <Home size={20} /> <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'dashboard' ? '600' : '500' }}>Home</span>
          </button>
          <button onClick={() => setActiveTab('budgets')} style={{ background: 'none', border: 'none', color: activeTab === 'budgets' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '16px', backgroundColor: activeTab === 'budgets' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', transition: 'all 0.2s ease' }}>
            <Target size={20} /> <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'budgets' ? '600' : '500' }}>Budgets</span>
          </button>
          <button onClick={() => setActiveTab('balances')} style={{ background: 'none', border: 'none', color: activeTab === 'balances' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: '16px', backgroundColor: activeTab === 'balances' ? 'rgba(37, 99, 235, 0.1)' : 'transparent', transition: 'all 0.2s ease' }}>
            <Users size={20} /> <span style={{ fontSize: '0.75rem', fontWeight: activeTab === 'balances' ? '600' : '500' }}>Balances</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
