import React from 'react';
import { ArrowLeft, User, Receipt, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export default function UserProfile({ profileUser, currentUser, globalExpenses, familyMembers, onBack }) {
  const isMe = profileUser === currentUser;
  const displayName = isMe ? "You" : profileUser.split('@')[0];
  const currentMonth = new Date().getMonth();
  
  // 1. Calculate Total Expenses this month by this user
  const userExpensesThisMonth = globalExpenses.filter(e => 
    e.paidBy === profileUser && 
    e.type === 'Expense' && 
    new Date(e.createdAt).getMonth() === currentMonth
  );
  
  const totalSpentThisMonth = userExpensesThisMonth.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 2. Calculate Splitwise Balance (global, not just this month)
  const uniqueUsers = new Set(familyMembers.length > 0 ? familyMembers : []);
  if (uniqueUsers.size === 0) {
    globalExpenses.forEach(e => {
      if (e.paidBy) uniqueUsers.add(e.paidBy);
    });
  }
  uniqueUsers.add(currentUser);
  
  const userCount = uniqueUsers.size || 1;
  const sharedExpenses = globalExpenses.filter(e => e.isShared);
  
  let balance = 0;
  sharedExpenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    const splitAmount = amount / userCount;
    
    if (exp.paidBy === profileUser) {
      balance += amount;
    }
    balance -= splitAmount;
  });

  let balanceText = "Settled up";
  let balanceColor = "var(--text-muted)";
  if (balance > 0.5) {
    balanceText = "Family owes";
    balanceColor = "var(--success)";
  } else if (balance < -0.5) {
    balanceText = "Owes family";
    balanceColor = "var(--danger)";
  }

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '80px', paddingTop: '16px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '24px' }}>
        <ArrowLeft size={20} /> Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={32} color="var(--primary)" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{displayName}</h2>
          <p className="text-muted">{profileUser}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <p className="text-muted text-sm font-medium flex items-center gap-2"><TrendingDown size={16} /> Spent This Month</p>
          <h3 className="text-2xl font-bold mt-2">₹{totalSpentThisMonth.toFixed(0)}</h3>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <p className="text-muted text-sm font-medium flex items-center gap-2"><ArrowRightLeft size={16} /> Splitwise Balance</p>
          <h3 className="text-2xl font-bold mt-2" style={{ color: balanceColor }}>₹{Math.abs(balance).toFixed(0)}</h3>
          <p style={{ fontSize: '0.8rem', color: balanceColor, marginTop: '4px' }}>{balanceText}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Receipt size={20} /> Recent Activity</h3>
      
      {userExpensesThisMonth.length === 0 ? (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
          <p className="text-muted">{displayName} hasn't recorded any expenses this month.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {userExpensesThisMonth.slice(0, 20).map(expense => (
            <div key={expense.id} className="glass-card expense-item" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="font-bold">{expense.description}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                    {expense.section}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(expense.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <p className="font-bold text-xl text-text">₹{Number(expense.amount).toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
