import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import {
  ArrowLeft,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  CreditCard,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { safeParseDate } from '../services/utils';

export default function UserProfile({ profileEmail, onBack }) {
  const { currentUser, userProfile } = useAuth();
  const { expenses, calculateBalances } = useExpenses();

  const safeEmail = (profileEmail || currentUser || '').toLowerCase().trim();
  const isMe = safeEmail === (currentUser || '').toLowerCase().trim();
  const displayName = isMe
    ? (userProfile?.displayName || 'You')
    : (safeEmail.split('@')[0] || 'Member');
  const initials = safeEmail ? safeEmail.slice(0, 2).toUpperCase() : 'ME';
  const currentMonth = new Date();

  // Transactions paid by this user this month (safely handled)
  const userPaidThisMonth = expenses.filter(e => {
    const isPayer = (e.paidBy || '').toLowerCase() === safeEmail;
    if (!isPayer || e.type !== 'Expense') return false;
    const parsed = safeParseDate(e.createdAt);
    return parsed ? isSameMonth(parsed, currentMonth) : false;
  });

  const totalPaidThisMonth = userPaidThisMonth.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // All expenses where this user was a participant or payer
  const userActivity = expenses.filter(e => {
    const isPayer = (e.paidBy || '').toLowerCase() === safeEmail;
    const isSplit = Array.isArray(e.splitMembers) && e.splitMembers.map(m => (m || '').toLowerCase()).includes(safeEmail);
    return isPayer || isSplit;
  });

  // Net standing from calculation engine
  const { netBalances = {} } = calculateBalances ? calculateBalances() : {};
  const balance = netBalances[safeEmail] || 0;
  const isOwed = balance > 0.5;
  const isOwing = balance < -0.5;

  return (
    <div className="overview-page" style={{ animation: 'content-enter 0.3s ease-out' }}>

      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="btn-yc-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            fontSize: '0.82rem',
            fontWeight: 800
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="yc-card yc-card-glow" style={{ padding: '28px 20px', textAlign: 'center' }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'var(--yc-gradient)',
          color: '#FFFFFF',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: 900,
          boxShadow: 'var(--yc-orange-glow)',
          border: '3px solid #fff'
        }}>
          {initials}
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-pure)' }}>
          {displayName} {isMe && <span className="yc-badge yc-badge-orange" style={{ marginLeft: '6px', verticalAlign: 'middle' }}><UserCheck size={12} /> You</span>}
        </h2>
        <p className="text-muted" style={{ fontSize: '0.84rem', marginTop: '4px' }}>
          {safeEmail || 'No email provided'}
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '999px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} color="var(--emerald-green)" /> Verified Workspace Member
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div className="yc-card" style={{ padding: '16px', borderLeft: '4px solid var(--coral-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--coral-red)', marginBottom: '6px' }}>
            <TrendingDown size={17} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Spent This Month</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-pure)' }}>₹{totalPaidThisMonth.toFixed(0)}</h3>
          <p className="text-muted" style={{ fontSize: '0.74rem', marginTop: '4px' }}>
            {userPaidThisMonth.length} transactions
          </p>
        </div>

        <div className="yc-card" style={{ padding: '16px', borderLeft: `4px solid ${isOwed ? 'var(--emerald-green)' : isOwing ? 'var(--coral-red)' : 'var(--border-subtle)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOwed ? 'var(--emerald-green)' : isOwing ? 'var(--coral-red)' : 'var(--text-muted)', marginBottom: '6px' }}>
            <ArrowRightLeft size={17} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Net Standing</span>
          </div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: isOwed ? 'var(--emerald-green)' : isOwing ? 'var(--coral-red)' : 'var(--text-pure)'
          }}>
            {isOwed ? `+₹${balance.toFixed(0)}` : isOwing ? `-₹${Math.abs(balance).toFixed(0)}` : '₹0'}
          </h3>
          <p className="text-muted" style={{ fontSize: '0.74rem', marginTop: '4px' }}>
            {isOwed ? 'Gets back from group' : isOwing ? 'Owes to the group' : 'All square! No debts'}
          </p>
        </div>
      </div>

      {/* Activity History */}
      <div className="activity-section" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="eyebrow"><CreditCard size={13} /> Activity History</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Recent Transactions</h3>
          </div>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{userActivity.length} records</span>
        </div>

        {userActivity.length === 0 ? (
          <div className="empty-state" style={{ margin: '24px auto' }}>
            <Calendar size={28} />
            <h3>No recorded activity</h3>
            <p>Transactions involving {displayName} will show up here automatically.</p>
          </div>
        ) : (
          <div className="activity-list" style={{ marginTop: '10px' }}>
            {userActivity.slice(0, 15).map(exp => {
              const parsedDate = safeParseDate(exp.createdAt);
              const isPayer = (exp.paidBy || '').toLowerCase() === safeEmail;

              return (
                <div key={exp.id} className="transaction-row">
                  <div className={`transaction-mark ${exp.type === 'Savings' ? 'saving' : exp.type === 'Settlement' ? 'settlement' : 'expense'}`}>
                    <CreditCard size={18} />
                  </div>
                  <div className="transaction-main">
                    <strong>{exp.description || exp.section || 'Transaction'}</strong>
                    <span>
                      {exp.section || 'General'} • {parsedDate ? format(parsedDate, 'dd MMM yyyy') : 'Recent'}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    <strong className={exp.type === 'Savings' ? 'saving' : exp.type === 'Settlement' ? 'settlement' : 'expense'}>
                      {exp.type === 'Savings' ? '+' : ''}₹{Number(exp.amount || 0).toFixed(0)}
                    </strong>
                    <span className="text-subtle" style={{ fontSize: '0.68rem' }}>
                      {isPayer ? 'Paid by them' : 'Split participant'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
