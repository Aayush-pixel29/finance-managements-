import React from 'react';
import { Users, ArrowRightLeft } from 'lucide-react';

export default function Balances({ expenses = [], currentUser, familyMembers = [] }) {
  if (!currentUser) return null;

  // Find all unique users
  // Prioritize the centralized familyMembers list. 
  // If not available (e.g. legacy data), fallback to inferring from expenses.
  const uniqueUsers = new Set(familyMembers.length > 0 ? familyMembers : []);
  
  if (uniqueUsers.size === 0) {
    expenses.forEach(e => {
      if (e.paidBy) uniqueUsers.add(e.paidBy);
    });
  }
  uniqueUsers.add(currentUser);
  
  const userCount = uniqueUsers.size || 1;
  const sharedExpenses = expenses.filter(e => e.isShared);
  
  const balances = {};
  Array.from(uniqueUsers).forEach(u => balances[u] = 0);

  sharedExpenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    const splitAmount = amount / userCount;
    
    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += amount;
    }
    
    Array.from(uniqueUsers).forEach(u => {
      balances[u] -= splitAmount;
    });
  });

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
          <Users size={24} color="var(--primary)" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Family Balances</h2>
          <p className="text-muted text-sm">Who owes who (Split equally)</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {Object.entries(balances).map(([user, balance]) => {
          const isMe = user === currentUser;
          const displayUser = isMe ? "You" : user.split('@')[0];
          
          let statusText = "Settled up";
          let color = "var(--text-muted)";
          
          // Use 0.5 threshold to match Math.round/toFixed(0) behavior
          if (balance > 0.5) {
            statusText = "Family owes";
            color = "var(--success)";
          } else if (balance < -0.5) {
            statusText = "Owes family";
            color = "var(--danger)";
          }

          return (
            <div key={user} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: isMe ? '1px solid var(--primary)' : 'none' }}>
              <div>
                <h3 className="font-bold text-lg">{displayUser}</h3>
                <p style={{ color, fontSize: '0.9rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {balance !== 0 && <ArrowRightLeft size={14} />} {statusText}
                </p>
              </div>
              <h2 className="text-2xl font-bold" style={{ color }}>
                ₹{Math.abs(balance).toFixed(0)}
              </h2>
            </div>
          );
        })}
      </div>
      
      <div className="glass-card mt-6 p-4" style={{ background: 'rgba(0,0,0,0.02)' }}>
        <p className="text-muted text-sm text-center">
          Balances are automatically calculated by dividing all "Shared" expenses equally among the {userCount} family members who use the app.
        </p>
      </div>
    </div>
  );
}
