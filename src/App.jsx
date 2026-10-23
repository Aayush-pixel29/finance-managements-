import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider, useGroup } from './context/GroupContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Budgets from './components/Budgets';
import Balances from './components/Balances';
import Sidebar from './components/Sidebar';
import UserProfile from './components/UserProfile';
import AddExpense from './components/AddExpense';

import {
  Home,
  Target,
  Users,
  Plus,
  WifiOff,
  X
} from 'lucide-react';

function MainAppContent() {
  const { currentUser, loading } = useAuth();
  const { createGroup } = useGroup();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'budgets' | 'balances'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);

  // Group creation modal state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Online / Offline monitor
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      await createGroup(newGroupName.trim());
      setNewGroupName('');
      setShowCreateGroup(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create group.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSwitchTab = (tab) => {
    setSelectedProfileUser(null);
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '14px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #efd3c7', borderTopColor: 'var(--yc-orange)', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 700 }}>Starting FinanceHub...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <>
      {/* Offline Status Pill */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--yc-orange)',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '6px 16px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 80,
          boxShadow: 'var(--yc-orange-glow)'
        }}>
          <WifiOff size={14} /> Offline Mode (IndexedDB Active)
        </div>
      )}

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectUser={(email) => setSelectedProfileUser(email)}
        onCreateGroupClick={() => setShowCreateGroup(true)}
      />

      {/* Main Content Area */}
      <main className="app-screen-scroll" aria-live="polite">
        <ErrorBoundary onReset={() => setSelectedProfileUser(null)}>
          {selectedProfileUser ? (
            <UserProfile
              profileEmail={selectedProfileUser}
              onBack={() => setSelectedProfileUser(null)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  onOpenMenu={() => setIsSidebarOpen(true)}
                  onAddTransaction={() => setShowAddModal(true)}
                  onSelectUser={(email) => setSelectedProfileUser(email)}
                />
              )}
              {activeTab === 'budgets' && <Budgets />}
              {activeTab === 'balances' && (
                <Balances onSelectUser={(email) => setSelectedProfileUser(email)} />
              )}
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Glowing YC Orange Floating Action Button */}
      {!selectedProfileUser && (
        <button
          onClick={() => setShowAddModal(true)}
          className="yc-fab"
          title="Add Transaction"
        >
          <Plus size={34} strokeWidth={3} />
        </button>
      )}

      {/* YC Bottom Dock Navigation */}
      <nav className="yc-dock">
        <button
          onClick={() => handleSwitchTab('dashboard')}
          className={`yc-dock-tab ${activeTab === 'dashboard' && !selectedProfileUser ? 'active' : ''}`}
        >
          <Home size={22} />
          <span className="yc-dock-label">Home</span>
        </button>

        <button
          onClick={() => handleSwitchTab('budgets')}
          className={`yc-dock-tab ${activeTab === 'budgets' && !selectedProfileUser ? 'active' : ''}`}
        >
          <Target size={22} />
          <span className="yc-dock-label">Budgets</span>
        </button>

        <button
          onClick={() => handleSwitchTab('balances')}
          className={`yc-dock-tab ${activeTab === 'balances' && !selectedProfileUser ? 'active' : ''}`}
        >
          <Users size={22} />
          <span className="yc-dock-label">Balances</span>
        </button>
      </nav>

      {/* Add Expense Modal Bottom Sheet */}
      {showAddModal && (
        <AddExpense onClose={() => setShowAddModal(false)} />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="yc-modal-backdrop" onClick={() => setShowCreateGroup(false)}>
          <div className="yc-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Create New Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="btn-yc-icon" style={{ width: '36px', height: '36px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <div className="input-block">
                <label className="input-caption">Group Name</label>
                <input
                  type="text"
                  className="input-yc"
                  placeholder="e.g. Family Home, Goa Trip 2026, Flatmates"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-yc-primary" disabled={creatingGroup} style={{ marginTop: '12px' }}>
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GroupProvider>
          <ExpenseProvider>
            <div className="mobile-app-shell">
              <MainAppContent />
            </div>
          </ExpenseProvider>
        </GroupProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
