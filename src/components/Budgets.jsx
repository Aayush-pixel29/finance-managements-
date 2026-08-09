import React, { useState, useEffect } from 'react';
import { subscribeToBudgets, setBudget } from '../services/expenseService';
import { Target, TrendingUp, AlertCircle, Plus } from 'lucide-react';

export default function Budgets({ currentMonthExpenses, currentGroupId }) {
  const [budgets, setBudgets] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [newBudgetSection, setNewBudgetSection] = useState('Food');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  const defaultCategories = ['Food', 'Transport', 'Utilities', 'Shopping', 'Entertainment', 'Health', 'Education', 'Custom...'];

  useEffect(() => {
    if (currentGroupId) {
      const unsubscribe = subscribeToBudgets(currentGroupId, (data) => {
        setBudgets(data);
      });
      return () => unsubscribe();
    }
  }, [currentGroupId]);

  // Calculate total spent per section this month
  const spentPerSection = {};
  currentMonthExpenses.forEach(exp => {
    if (exp.type === 'Expense') {
      spentPerSection[exp.section] = (spentPerSection[exp.section] || 0) + Number(exp.amount);
    }
  });

  const handleSaveBudget = async (section, amount) => {
    if (amount && !isNaN(amount)) {
      await setBudget(section, amount, currentGroupId);
    }
    setEditingSection(null);
    setEditAmount('');
  };

  const handleCreateNewBudget = async () => {
    if (newBudgetSection && newBudgetAmount) {
      await handleSaveBudget(newBudgetSection, newBudgetAmount);
      setShowNewBudget(false);
      setNewBudgetSection('Food');
      setNewBudgetAmount('');
    }
  };

  // Default sections + any custom ones that have expenses this month
  const allSections = new Set([...Object.keys(budgets), ...Object.keys(spentPerSection)]);

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target size={24} color="var(--primary)" /> Monthly Budgets
        </h2>
        <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setShowNewBudget(!showNewBudget)}>
          <Plus size={16} /> New Budget
        </button>
      </div>

      {showNewBudget && (
        <div className="glass-card animate-slide-up" style={{ padding: '16px', marginBottom: '24px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid var(--primary)' }}>
          <h3 className="font-bold mb-4">Create New Budget</h3>
          <div className="input-group">
            <label>Category</label>
            <select className="input-field" value={newBudgetSection} onChange={e => setNewBudgetSection(e.target.value)}>
              {defaultCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {newBudgetSection === 'Custom...' && (
            <div className="input-group">
              <input type="text" className="input-field" placeholder="Enter custom category" onChange={e => setNewBudgetSection(e.target.value)} />
            </div>
          )}
          <div className="input-group">
            <label>Monthly Limit (₹)</label>
            <input type="number" className="input-field" placeholder="e.g. 15000" value={newBudgetAmount} onChange={e => setNewBudgetAmount(e.target.value)} />
          </div>
          <button className="btn mt-2" onClick={handleCreateNewBudget}>Save Budget</button>
        </div>
      )}

      {allSections.size === 0 && !showNewBudget && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
          <p className="text-muted">No budgets or expenses yet this month.</p>
          <p className="text-sm mt-2" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowNewBudget(true)}>Click here to set your first budget.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from(allSections).map(section => {
          const budget = budgets[section]?.amount || 0;
          const spent = spentPerSection[section] || 0;
          const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const isOverBudget = budget > 0 && spent > budget;
          const isNearBudget = budget > 0 && spent > budget * 0.8 && !isOverBudget;

          return (
            <div key={section} className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className="font-bold">{section}</h3>
                
                {editingSection === section ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ padding: '4px 8px', minHeight: '30px', width: '100px' }}
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      placeholder="Amount"
                      autoFocus
                    />
                    <button className="btn" style={{ width: 'auto', padding: '4px 12px' }} onClick={() => handleSaveBudget(section, editAmount)}>Save</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => { setEditingSection(section); setEditAmount(budget || ''); }}>
                    {budget > 0 ? (
                      <p className="font-bold text-lg">₹{spent.toFixed(0)} / ₹{budget}</p>
                    ) : (
                      <p className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full">Set Budget</p>
                    )}
                  </div>
                )}
              </div>

              {budget > 0 && (
                <>
                  <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percentage}%`, 
                      background: isOverBudget ? 'var(--danger)' : isNearBudget ? 'var(--warning)' : 'var(--success)',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  {isOverBudget && <p className="text-danger text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/> Over budget by ₹{(spent - budget).toFixed(0)}</p>}
                  {isNearBudget && <p className="text-warning text-sm mt-2 flex items-center gap-1"><TrendingUp size={14}/> Nearing limit!</p>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
