import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import {
  Target,
  Plus,
  AlertCircle,
  TrendingUp,
  Trash2,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { isSameMonth } from 'date-fns';
import { safeParseDate } from '../services/utils';

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transport & Fuel',
  'Bills & Utilities',
  'Shopping & Groceries',
  'Entertainment',
  'Health & Pharmacy',
  'Education & Fees',
  'General'
];

export default function Budgets() {
  const { expenses, budgets, saveBudget, removeBudget } = useExpenses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [editingSection, setEditingSection] = useState(null);
  const [inlineEditAmount, setInlineEditAmount] = useState('');

  const currentMonth = new Date();
  const currentMonthExpenses = expenses.filter(e => {
    if (e.type !== 'Expense') return false;
    const parsed = safeParseDate(e.createdAt);
    return parsed ? isSameMonth(parsed, currentMonth) : false;
  });

  const spentPerCategory = {};
  currentMonthExpenses.forEach(exp => {
    const sec = exp.section || 'General';
    spentPerCategory[sec] = (spentPerCategory[sec] || 0) + Number(exp.amount);
  });

  let totalBudget = 0;
  Object.values(budgets).forEach(b => {
    totalBudget += Number(b.amount) || 0;
  });

  const totalSpentThisMonth = Object.values(spentPerCategory).reduce((sum, v) => sum + v, 0);
  const totalPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpentThisMonth / totalBudget) * 100)) : 0;

  const allSections = Array.from(new Set([
    ...Object.keys(budgets),
    ...Object.keys(spentPerCategory)
  ]));

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    const finalSection = selectedCategory === 'Custom...' ? (customCategory.trim() || 'General') : selectedCategory;
    const numAmount = parseFloat(budgetLimit);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) return;

    await saveBudget(finalSection, numAmount);
    setShowAddModal(false);
    setBudgetLimit('');
    setCustomCategory('');
  };

  const handleInlineSave = async (section) => {
    const num = parseFloat(inlineEditAmount);
    if (!isNaN(num) && num > 0) {
      await saveBudget(section, num);
    }
    setEditingSection(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={22} color="var(--yc-orange)" /> Category Budgets
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Set monthly spending caps & prevent overspending</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-yc-primary"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', minHeight: '38px', borderRadius: '12px' }}
        >
          <Plus size={16} /> New Budget
        </button>
      </div>

      {/* Aggregate Overview Card */}
      {totalBudget > 0 && (
        <div className="yc-card yc-card-glow" style={{ padding: '20px', borderLeft: '4px solid var(--yc-orange)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Budget Velocity</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '4px' }}>
                ₹{totalSpentThisMonth.toFixed(0)} <span className="text-muted" style={{ fontSize: '1rem', fontWeight: 600 }}>/ ₹{totalBudget.toFixed(0)}</span>
              </h3>
            </div>
            <span className={`yc-badge ${totalPercentage >= 100 ? 'yc-badge-red' : totalPercentage >= 80 ? 'yc-badge-orange' : 'yc-badge-green'}`}>
              {totalPercentage}% Spent
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', margin: '10px 0', border: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                height: '100%',
                width: `${totalPercentage}%`,
                background: totalPercentage >= 100 ? 'var(--coral-red)' : totalPercentage >= 80 ? 'var(--yc-orange)' : 'var(--emerald-green)',
                borderRadius: '6px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Remaining: ₹{Math.max(0, totalBudget - totalSpentThisMonth).toFixed(0)}</span>
            <span style={{ color: totalSpentThisMonth > totalBudget ? 'var(--coral-red)' : 'var(--emerald-green)', fontWeight: 700 }}>
              {totalSpentThisMonth > totalBudget ? `Over budget by ₹${(totalSpentThisMonth - totalBudget).toFixed(0)}` : 'Within limits'}
            </span>
          </div>
        </div>
      )}

      {/* Categories Budget Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {allSections.length === 0 ? (
          <div className="yc-card" style={{ padding: '36px 16px', textAlign: 'center' }}>
            <Sparkles size={32} color="var(--yc-orange)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>No Budgets Configured</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '6px auto 16px' }}>
              Set category caps to get automatic warning notifications.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-yc-primary"
              style={{ margin: '0 auto', width: 'auto', fontSize: '0.85rem' }}
            >
              Set First Budget
            </button>
          </div>
        ) : (
          allSections.map(section => {
            const budgetObj = budgets[section];
            const limit = Number(budgetObj?.amount) || 0;
            const spent = spentPerCategory[section] || 0;
            const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            const isOver = limit > 0 && spent > limit;
            const isNear = limit > 0 && spent >= limit * 0.8 && !isOver;

            return (
              <div key={section} className="yc-card" style={{ padding: '16px' }}>

                {/* Section Top Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{section}</h4>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                      {limit > 0 ? `${percent}% of limit spent` : 'No limit set yet'}
                    </p>
                  </div>

                  {editingSection === section ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        className="input-yc"
                        value={inlineEditAmount}
                        onChange={(e) => setInlineEditAmount(e.target.value)}
                        placeholder="Limit"
                        style={{ width: '90px', height: '36px', padding: '4px 8px', fontSize: '0.9rem' }}
                        autoFocus
                      />
                      <button onClick={() => handleInlineSave(section)} className="btn-yc-icon" style={{ width: '36px', height: '36px' }}>
                        <Check size={16} color="var(--emerald-green)" />
                      </button>
                      <button onClick={() => setEditingSection(null)} className="btn-yc-icon" style={{ width: '36px', height: '36px' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        onClick={() => { setEditingSection(section); setInlineEditAmount(limit || ''); }}
                        style={{ cursor: 'pointer', textAlign: 'right' }}
                      >
                        <p style={{ fontWeight: 900, fontSize: '1rem' }}>
                          ₹{spent.toFixed(0)} <span className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>/ ₹{limit > 0 ? limit : '—'}</span>
                        </p>
                      </div>

                      {limit > 0 && (
                        <button
                          onClick={() => removeBudget(section)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px' }}
                          title="Remove"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {limit > 0 && (
                  <>
                    <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percent}%`,
                          background: isOver ? 'var(--coral-red)' : isNear ? 'var(--yc-orange)' : 'var(--emerald-green)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>

                    {isOver && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--coral-red)', fontSize: '0.75rem', marginTop: '8px', fontWeight: 700 }}>
                        <AlertCircle size={14} /> Over budget by ₹{(spent - limit).toFixed(0)}
                      </p>
                    )}
                    {isNear && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--yc-orange)', fontSize: '0.75rem', marginTop: '8px', fontWeight: 700 }}>
                        <TrendingUp size={14} /> Nearing 80% spending limit
                      </p>
                    )}
                  </>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Modal: Set New Budget */}
      {showAddModal && (
        <div className="yc-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="yc-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create Category Budget</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-yc-icon" style={{ width: '36px', height: '36px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBudget}>
              <div className="input-block">
                <label className="input-caption">Category</label>
                <select
                  className="input-yc"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom...">Custom Category...</option>
                </select>
              </div>

              {selectedCategory === 'Custom...' && (
                <div className="input-block">
                  <label className="input-caption">Custom Category Name</label>
                  <input
                    type="text"
                    className="input-yc"
                    placeholder="e.g. Medicine, Pet Food"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-block">
                <label className="input-caption">Monthly Limit (₹)</label>
                <input
                  type="number"
                  className="input-yc"
                  placeholder="e.g. 10000"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  style={{ color: 'var(--yc-orange)', fontWeight: 800, fontSize: '1.2rem' }}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-yc-primary" style={{ marginTop: '12px' }}>
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
