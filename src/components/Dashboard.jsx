import React, { useMemo, useState } from 'react';
import { format, isSameMonth, subMonths, addMonths } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, FolderKanban, Menu, MoreHorizontal,
  Plus, ReceiptText, Search, Sparkles, Target, TrendingUp, Users, WalletCards,
  Share2, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useGroup } from '../context/GroupContext';
import { safeParseDate, sanitizeCsvCell } from '../services/utils';

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
  style: 'currency',
  currency: 'INR'
}).format(Number(amount) || 0);

const transactionTone = (type) => type === 'Savings' ? 'saving' : type === 'Settlement' ? 'settlement' : 'expense';

export default function Dashboard({ onOpenMenu, onAddTransaction, onSelectUser }) {
  const { currentUser, userProfile } = useAuth();
  const { currentGroup, groupMembers } = useGroup();
  const { expenses, budgets, deleteExpense } = useExpenses();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const monthlyEntries = useMemo(() => expenses.filter((entry) => {
    const parsed = safeParseDate(entry.createdAt);
    return parsed ? isSameMonth(parsed, currentMonth) : false;
  }), [expenses, currentMonth]);

  const monthExpenses = monthlyEntries.filter((entry) => entry.type === 'Expense');
  const monthSavings = monthlyEntries.filter((entry) => entry.type === 'Savings');
  const spent = monthExpenses.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
  const saved = monthSavings.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
  const planned = Object.values(budgets).reduce((total, budget) => total + (Number(budget.amount) || 0), 0);
  const remaining = Math.max(0, planned - spent);

  const categorySummary = useMemo(() => Object.values(monthExpenses.reduce((acc, entry) => {
    const name = entry.section || 'Other';
    acc[name] = acc[name] || { name, amount: 0 };
    acc[name].amount += Number(entry.amount) || 0;
    return acc;
  }, {})).sort((a, b) => b.amount - a.amount).slice(0, 4), [monthExpenses]);

  const budgetAlert = useMemo(() => Object.values(budgets).map((budget) => {
    const actual = monthExpenses.filter((entry) => entry.section === budget.section).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    return { ...budget, actual, ratio: Number(budget.amount) ? actual / Number(budget.amount) : 0 };
  }).sort((a, b) => b.ratio - a.ratio)[0], [budgets, monthExpenses]);

  const visibleEntries = useMemo(() => monthlyEntries.filter((entry) => {
    const term = search.trim().toLowerCase();
    return !term || [entry.description, entry.section, entry.paidBy].some((value) => String(value || '').toLowerCase().includes(term));
  }).slice(0, showAll ? 50 : 6), [monthlyEntries, search, showAll]);

  const handleShareApp = async () => {
    const shareData = {
      title: 'FinanceHub - Family Finance & Expenses',
      text: `Join ${currentGroup?.name || 'our group'} on FinanceHub! Open this link on your phone and tap "Add to Home Screen" to install it.`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      alert(`Install FinanceHub on your phone by visiting: ${window.location.origin}`);
    }
  };

  const exportCsv = () => {
    const lines = [['Date', 'Description', 'Category', 'Paid by', 'Type', 'Amount']];
    monthlyEntries.forEach((entry) => {
      const parsed = safeParseDate(entry.createdAt);
      lines.push([
        parsed ? format(parsed, 'yyyy-MM-dd') : '',
        sanitizeCsvCell(entry.description || ''),
        sanitizeCsvCell(entry.section || ''),
        sanitizeCsvCell(entry.paidBy || ''),
        sanitizeCsvCell(entry.type || ''),
        Number(entry.amount || 0).toFixed(2)
      ]);
    });
    const csv = lines.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `FinanceHub_${format(currentMonth, 'MMM_yyyy')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(currentGroup?.name || 'FinanceHub', 14, 18);
    doc.setFontSize(10);
    doc.text(`${format(currentMonth, 'MMMM yyyy')} · Shared money statement`, 14, 26);
    doc.autoTable({
      startY: 34,
      head: [['Date', 'Description', 'Category', 'Paid by', 'Amount']],
      body: monthlyEntries.map((entry) => {
        const parsed = safeParseDate(entry.createdAt);
        return [
          parsed ? format(parsed, 'dd MMM') : '',
          entry.description || 'Transaction',
          entry.section || 'Other',
          entry.paidBy?.split('@')[0] || '',
          formatMoney(entry.amount)
        ];
      }),
      headStyles: { fillColor: [23, 33, 31] },
      styles: { fontSize: 8 }
    });
    doc.save(`FinanceHub_${format(currentMonth, 'MMM_yyyy')}.pdf`);
  };

  const userInitial = (userProfile?.displayName || currentUser || 'ME').slice(0, 2).toUpperCase();

  return (
    <div className="overview-page">
      <header className="product-header">
        <div className="product-identity">
          <button className="btn-yc-icon" onClick={onOpenMenu} aria-label="Open workspace menu"><Menu size={20} /></button>
          <div>
            <span className="eyebrow"><FolderKanban size={13} /> Shared workspace</span>
            <h1>{currentGroup?.name || 'Your money'}</h1>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-yc-icon"
            onClick={handleShareApp}
            title={copiedShare ? "Link copied!" : "Share / Install App"}
            style={copiedShare ? { background: 'var(--emerald-bg)', color: 'var(--emerald-green)', borderColor: 'var(--emerald-green)' } : {}}
          >
            {copiedShare ? <Check size={18} /> : <Share2 size={18} />}
          </button>
          <button className="btn-yc-icon" onClick={exportCsv} title="Export CSV"><FileSpreadsheet size={18} /></button>
          <button className="btn-yc-icon" onClick={exportPdf} title="Export PDF"><Download size={18} /></button>
          <button
            onClick={() => onSelectUser && onSelectUser(currentUser)}
            title="My Profile"
            className="btn-yc-icon"
            style={{
              background: 'var(--yc-gradient)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.82rem',
              boxShadow: 'var(--yc-orange-glow)'
            }}
          >
            {userInitial}
          </button>
        </div>
      </header>

      {copiedShare && (
        <div style={{
          background: 'var(--emerald-bg)',
          color: 'var(--emerald-green)',
          border: '1px solid #bce4d8',
          padding: '8px 14px',
          borderRadius: '12px',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <Check size={16} /> App link copied to clipboard! Share it with friends or family to install on their phones.
        </div>
      )}

      <section className="period-bar" aria-label="Reporting period">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <span><CalendarDays size={15} /> {format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="Next month"><ChevronRight size={18} /></button>
      </section>

      <section className="money-hero">
        <div className="money-hero-copy">
          <span className="eyebrow light"><Sparkles size={14} /> Financial pulse</span>
          <p className="hero-label">{planned > 0 ? 'Safe to spend this month' : 'This month’s spending'}</p>
          <h2>{formatMoney(planned > 0 ? remaining : spent)}</h2>
          <p>{planned > 0 ? `${formatMoney(spent)} of ${formatMoney(planned)} planned` : `${monthExpenses.length} expenses recorded this month`}</p>
          {planned > 0 && <div className="hero-progress"><span style={{ width: `${Math.min(100, (spent / planned) * 100)}%` }} /></div>}
        </div>
        <button className="hero-add" onClick={onAddTransaction}>
          <Plus size={20} /><span>Add transaction</span>
        </button>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon expense"><ArrowDownRight size={18} /></span>
          <span>Spent</span><strong>{formatMoney(spent)}</strong><small>{monthExpenses.length} expenses</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon saving"><ArrowUpRight size={18} /></span>
          <span>Saved</span><strong>{formatMoney(saved)}</strong><small>{monthSavings.length} deposits</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon group"><Users size={18} /></span>
          <span>People</span><strong>{groupMembers.length}</strong><small>{groupMembers.length === 1 ? 'Just you' : 'in this workspace'}</small>
        </article>
      </section>

      <section className="insight-grid">
        <article className="yc-card attention-card">
          <div className="section-title"><div><span className="eyebrow"><Target size={13} /> Needs attention</span><h3>Budget health</h3></div><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><MoreHorizontal size={18} /></button></div>
          {budgetAlert ? <><p className="attention-copy"><strong>{budgetAlert.section}</strong> is at <strong>{Math.round(budgetAlert.ratio * 100)}%</strong> of its monthly limit.</p><div className="budget-track"><span className={budgetAlert.ratio >= 1 ? 'danger' : budgetAlert.ratio >= .8 ? 'warning' : ''} style={{ width: `${Math.min(100, budgetAlert.ratio * 100)}%` }} /></div><div className="budget-details"><span>{formatMoney(budgetAlert.actual)} used</span><span>{formatMoney(budgetAlert.amount)} limit</span></div></> : <div className="empty-inline"><Target size={18} /> Set a budget to unlock proactive spend alerts.</div>}
        </article>
        <article className="yc-card categories-card">
          <div className="section-title"><div><span className="eyebrow"><TrendingUp size={13} /> Your pattern</span><h3>Top categories</h3></div><span className="text-muted">This month</span></div>
          {categorySummary.length ? <div className="category-list">{categorySummary.map((category, index) => <div key={category.name} className="category-row"><span className="category-index">0{index + 1}</span><span>{category.name}</span><strong>{formatMoney(category.amount)}</strong><i><b style={{ width: `${spent ? (category.amount / spent) * 100 : 0}%` }} /></i></div>)}</div> : <div className="empty-inline"><ReceiptText size={18} /> Your spending pattern will appear here.</div>}
        </article>
      </section>

      <section className="activity-section">
        <div className="activity-header"><div><span className="eyebrow"><WalletCards size={13} /> Live activity</span><h3>Recent transactions</h3></div><div className="search-control"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" aria-label="Search transactions" /></div></div>
        {visibleEntries.length ? <div className="activity-list">{visibleEntries.map((entry) => {
          const parsed = safeParseDate(entry.createdAt);
          return (
            <article key={entry.id} className="transaction-row">
              <span className={`transaction-mark ${transactionTone(entry.type)}`}><ReceiptText size={18} /></span>
              <div className="transaction-main">
                <strong>{entry.description || entry.section || 'Transaction'}</strong>
                <span>{entry.section || 'Other'} · {entry.paidBy === currentUser ? 'You paid' : entry.paidBy?.split('@')[0] || 'Group member'} · {parsed ? format(parsed, 'dd MMM') : 'Recent'}</span>
              </div>
              <div className="transaction-amount">
                <strong className={transactionTone(entry.type)}>{entry.type === 'Savings' ? '+' : ''}{formatMoney(entry.amount)}</strong>
                <button onClick={() => { if (window.confirm('Delete this transaction?')) deleteExpense(entry.id); }} aria-label={`Delete ${entry.description || 'transaction'}`}>Remove</button>
              </div>
            </article>
          );
        })}</div> : <div className="empty-state"><ReceiptText size={26} /><h3>{search ? 'No matching transactions' : 'Start with the first transaction'}</h3><p>{search ? 'Try a category, description, or person.' : 'Record an expense, saving, or settlement to make the workspace useful.'}</p><button className="btn-yc-primary" onClick={onAddTransaction}><Plus size={18} /> Add transaction</button></div>}
        {monthlyEntries.length > visibleEntries.length && <button className="show-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show less' : `Show all ${monthlyEntries.length} transactions`}</button>}
      </section>
    </div>
  );
}
