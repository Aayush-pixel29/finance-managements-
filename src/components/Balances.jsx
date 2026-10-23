import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useExpenses } from '../context/ExpenseContext';
import {
  Users,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';

export default function Balances({ onSelectUser }) {
  const { currentUser } = useAuth();
  const { groupMembers } = useGroup();
  const { calculateBalances, recordSettlement } = useExpenses();

  const [settlingItem, setSettlingItem] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settlingLoading, setSettlingLoading] = useState(false);

  const { netBalances, settlementTransactions } = calculateBalances();

  const myBalance = netBalances[currentUser] || 0;
  const isOwed = myBalance > 0.5;
  const isOwing = myBalance < -0.5;

  const handleOpenSettle = (tx) => {
    // Strictly verify the user is the debtor paying the creditor
    if (tx.from !== currentUser) {
      alert("Only the person making the payment can confirm this settlement.");
      return;
    }
    setSettlingItem(tx);
    setSettleAmount(tx.amount.toString());
  };

  const handleConfirmSettle = async () => {
    if (!settlingItem || !settleAmount) return;
    const num = parseFloat(settleAmount);
    if (isNaN(num) || num <= 0) return;

    setSettlingLoading(true);
    try {
      // Record payment from currentUser to the creditor
      await recordSettlement(settlingItem.to, num);
      setSettlingItem(null);
      setSettleAmount('');
    } catch (e) {
      console.error(e);
      alert("Failed to record settlement payment");
    } finally {
      setSettlingLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} color="var(--yc-orange)" /> Group Balances
        </h2>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Splitwise-style debt simplification & 1-tap settlements</p>
      </div>

      {/* User Personal Standing Card */}
      <div
        className="yc-card yc-card-glow"
        style={{
          padding: '20px',
          borderLeft: `5px solid ${isOwed ? 'var(--emerald-green)' : isOwing ? 'var(--coral-red)' : 'var(--border-subtle)'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Net Standing</p>
            <h3 style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '4px', color: isOwed ? 'var(--emerald-green)' : isOwing ? 'var(--coral-red)' : 'var(--text-pure)' }}>
              {isOwed ? `+₹${myBalance.toFixed(0)}` : isOwing ? `-₹${Math.abs(myBalance).toFixed(0)}` : '₹0.00'}
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px', color: isOwed ? 'var(--emerald-green)' : isOwing ? 'var(--coral-red)' : 'var(--text-muted)', fontWeight: 600 }}>
              {isOwed ? 'Group owes you in total' : isOwing ? 'You owe money to the group' : 'All square! No pending dues 🎉'}
            </p>
          </div>

          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: isOwed ? 'var(--emerald-bg)' : isOwing ? 'var(--coral-bg)' : 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isOwed ? <TrendingUp size={28} color="var(--emerald-green)" /> : isOwing ? <TrendingDown size={28} color="var(--coral-red)" /> : <ShieldCheck size={28} color="var(--text-muted)" />}
          </div>
        </div>
      </div>

      {/* Suggested Settlements Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowRightLeft size={18} color="var(--yc-orange)" /> Optimized Debt Settlements
          </h4>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Minimum transactions</span>
        </div>

        {settlementTransactions.length === 0 ? (
          <div className="yc-card" style={{ padding: '28px 16px', textAlign: 'center' }}>
            <CheckCircle2 size={32} color="var(--emerald-green)" style={{ marginBottom: '8px' }} />
            <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>All Debts Cleared!</p>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>Everyone in the group is settled up.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settlementTransactions.map((tx, idx) => {
              const isIpay = tx.from === currentUser;
              const isIreceive = tx.to === currentUser;

              return (
                <div
                  key={idx}
                  className="yc-card"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: (isIpay || isIreceive) ? '1.5px solid var(--yc-orange)' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      <span style={{ color: isIpay ? 'var(--coral-red)' : 'var(--text-pure)' }}>
                        {isIpay ? 'You' : tx.from.split('@')[0]}
                      </span>
                      <span className="text-muted" style={{ margin: '0 6px', fontWeight: 500, fontSize: '0.8rem' }}>pays</span>
                      <span style={{ color: isIreceive ? 'var(--emerald-green)' : 'var(--text-pure)' }}>
                        {isIreceive ? 'You' : tx.to.split('@')[0]}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-pure)' }}>
                      ₹{tx.amount.toFixed(0)}
                    </span>

                    {/* Fixed: Only the debtor is allowed to record the settlement payment */}
                    {isIpay ? (
                      <button
                        onClick={() => handleOpenSettle(tx)}
                        className="btn-yc-primary"
                        style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem', minHeight: '36px', borderRadius: '10px' }}
                      >
                        Settle
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                        {isIreceive ? 'Awaiting Pay' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balance Ledger */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>Member Overview</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {groupMembers.map((memberEmail) => {
            const bal = netBalances[memberEmail] || 0;
            const isMe = memberEmail === currentUser;
            const memberOwed = bal > 0.5;
            const memberOwing = bal < -0.5;

            return (
              <div
                key={memberEmail}
                className="yc-card"
                onClick={() => onSelectUser && onSelectUser(memberEmail)}
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--yc-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--yc-orange)' }}>
                    {memberEmail.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-pure)' }}>
                      {isMe ? 'You' : memberEmail.split('@')[0]} {isMe && <span className="text-muted">(Me)</span>}
                    </p>
                    <p className="text-subtle" style={{ fontSize: '0.75rem' }}>{memberEmail}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    color: memberOwed ? 'var(--emerald-green)' : memberOwing ? 'var(--coral-red)' : 'var(--text-muted)'
                  }}>
                    {memberOwed ? `+₹${bal.toFixed(0)}` : memberOwing ? `-₹${Math.abs(bal).toFixed(0)}` : '₹0'}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                    {memberOwed ? 'Gets back' : memberOwing ? 'Owes in total' : 'All square'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settle Confirmation Modal */}
      {settlingItem && (
        <div className="yc-modal-backdrop" onClick={() => setSettlingItem(null)}>
          <div className="yc-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>Record Settle Payment</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              Confirm that you paid <span className="text-yc-orange">{settlingItem.to.split('@')[0]}</span>
            </p>

            <div className="input-block">
              <label className="input-caption">Payment Amount (₹)</label>
              <input
                type="number"
                className="input-yc"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--yc-orange)' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleConfirmSettle}
                className="btn-yc-primary"
                disabled={settlingLoading}
                style={{ flex: 1 }}
              >
                {settlingLoading ? 'Recording...' : 'Confirm Settle'}
              </button>
              <button
                onClick={() => setSettlingItem(null)}
                className="btn-yc-secondary"
                style={{ width: 'auto' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
