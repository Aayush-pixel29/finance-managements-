import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Receipt, User, PiggyBank, TrendingDown, ChevronLeft, ChevronRight, Trash2, Download, Menu, Bot, X, Loader } from 'lucide-react';
import { subscribeToExpenses, deleteExpense } from '../services/expenseService';
import { getFinancialAdvice, hasApiKey } from '../services/aiService';
import AddExpense from './AddExpense';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isSameMonth, addMonths, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard({ currentUser, onLogout, globalExpenses, onOpenMenu, currentGroupId, currentGroupName }) {
  const [showAdd, setShowAdd] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [showCAAdvice, setShowCAAdvice] = useState(false);
  const [caLoading, setCaLoading] = useState(false);
  const [caAdvice, setCaAdvice] = useState('');

  // Use global expenses if provided (for bottom nav architecture), else use local state
  const [localExpenses, setLocalExpenses] = useState([]);
  useEffect(() => {
    if (!globalExpenses) {
      const unsubscribe = subscribeToExpenses((data) => setLocalExpenses(data));
      return () => unsubscribe();
    }
  }, [globalExpenses]);
  
  const entries = globalExpenses || localExpenses;

  // Filter for current month
  const monthlyEntries = entries.filter(entry => 
    isSameMonth(new Date(entry.createdAt), currentMonth)
  );

  const monthlyExpenses = monthlyEntries.filter(e => e.type === 'Expense');
  const monthlySavings = monthlyEntries.filter(e => e.type === 'Savings');

  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalSavings = monthlySavings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Group by section for pie chart
  const sectionTotals = {};
  monthlyExpenses.forEach(e => {
    sectionTotals[e.section] = (sectionTotals[e.section] || 0) + Number(e.amount);
  });
  
  const pieData = Object.keys(sectionTotals).map(key => ({
    name: key,
    value: sectionTotals[key]
  })).sort((a, b) => b.value - a.value);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await deleteExpense(id);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const monthStr = format(currentMonth, 'MMMM yyyy');
    
    doc.setFontSize(20);
    doc.text(`Family Expenses Report - ${monthStr}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Total Expenses: Rs. ${totalExpense.toFixed(2)}`, 14, 32);
    doc.text(`Total Savings: Rs. ${totalSavings.toFixed(2)}`, 14, 38);
    
    const tableData = monthlyEntries.map(e => [
      new Date(e.createdAt).toLocaleDateString(),
      e.description,
      e.section,
      e.paidBy.split('@')[0],
      e.type,
      `Rs. ${Number(e.amount).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Date', 'Description', 'Category', 'Paid By', 'Type', 'Amount']],
      body: tableData,
    });

    doc.save(`Expenses_${monthStr}.pdf`);
  };

  const handleAskCA = async () => {
    if (!hasApiKey()) {
      alert("Please configure your Gemini API Key in the Sidebar settings first.");
      return;
    }
    setShowCAAdvice(true);
    setCaLoading(true);
    setCaAdvice('');
    try {
      const advice = await getFinancialAdvice(monthlyExpenses, monthlySavings, totalExpense, totalSavings);
      setCaAdvice(advice);
    } catch (err) {
      setCaAdvice(err.message);
    }
    setCaLoading(false);
  };

  if (showAdd) {
    return <AddExpense currentUser={currentUser} currentGroupId={currentGroupId} onClose={() => setShowAdd(false)} />;
  }

  if (showCAAdvice) {
    return (
      <div className="glass-card animate-slide-up" style={{ position: 'relative', minHeight: '100%', paddingBottom: '40px' }}>
        <button 
          onClick={() => setShowCAAdvice(false)} 
          style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
           <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '12px', borderRadius: '50%', color: 'white' }}>
              <Bot size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-bold" style={{ margin: 0 }}>AI Chartered Accountant</h2>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Financial insights for {format(currentMonth, 'MMMM yyyy')}</p>
           </div>
        </div>
        
        {caLoading ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--primary)' }}>
              <Loader className="animate-spin" size={40} style={{ marginBottom: '16px' }} />
              <p>Analyzing your finances...</p>
           </div>
        ) : (
           <div className="prose" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text)' }}>
              {caAdvice.split('\n').map((line, i) => {
                 if (line.startsWith('##')) return <h3 key={i} className="font-bold mt-4 mb-2" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{line.replace(/##/g, '')}</h3>;
                 if (line.startsWith('#')) return <h2 key={i} className="font-bold mt-4 mb-2" style={{ fontSize: '1.4rem' }}>{line.replace(/#/g, '')}</h2>;
                 if (line.startsWith('* ') || line.startsWith('- ')) return <li key={i} style={{ marginLeft: '16px', marginBottom: '8px' }}>{line.substring(2).replace(/\*\*/g, '')}</li>;
                 return <p key={i} style={{ marginBottom: '12px' }}>{line.replace(/\*\*/g, '')}</p>;
              })}
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '80px' }}>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onOpenMenu && (
            <button onClick={onOpenMenu} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '0' }}>
              <Menu size={24} />
            </button>
          )}
          <div>
            <h2 className="app-title">{currentGroupName || 'Family Finances'}</h2>
            <p className="text-muted flex items-center gap-2" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              <User size={14} /> {currentUser.split('@')[0]}
            </p>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-danger" style={{ width: 'auto', padding: '8px 16px', borderRadius: '12px' }}>
          <LogOut size={16} />
        </button>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn" style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px', width: 'auto' }} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-bold text-xl" style={{ minWidth: '120px', textAlign: 'center' }}>{format(currentMonth, 'MMMM yyyy')}</h3>
          <button className="btn" style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '8px', width: 'auto' }} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" style={{ width: 'auto', padding: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none' }} onClick={handleAskCA} title="Ask AI CA">
            <Bot size={16} />
          </button>
          <button className="btn" style={{ width: 'auto', padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }} onClick={exportPDF} title="Download Report">
            <Download size={16} />
          </button>
          <button className="btn" style={{ width: 'auto', padding: '8px 16px', borderRadius: '12px' }} onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px' }}>
          <p className="text-muted mb-2 font-medium flex items-center gap-2"><TrendingDown size={16} color="var(--danger)" /> Expenses</p>
          <h2 className="text-2xl font-bold">₹{totalExpense.toFixed(2)}</h2>
        </div>
        <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px' }}>
          <p className="text-muted mb-2 font-medium flex items-center gap-2"><PiggyBank size={16} color="var(--success)" /> Savings</p>
          <h2 className="text-2xl font-bold">₹{totalSavings.toFixed(2)}</h2>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="glass-card mb-6" style={{ height: '300px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <h4 className="font-bold mb-2">Expense Breakdown</h4>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₹${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '12px', fontSize: '0.8rem' }}>
             {pieData.map((entry, index) => (
               <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                 <span>{entry.name}</span>
               </div>
             ))}
          </div>
        </div>
      )}

      <h3 className="font-bold text-xl mb-4">Recent Entries</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {monthlyEntries.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.02)' }}>
            <p className="text-muted">No entries for this month yet.</p>
          </div>
        ) : (
          monthlyEntries.map(exp => (
            <div key={exp.id} className="glass-card expense-item" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: exp.type === 'Savings' ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.1)', padding: '12px', borderRadius: '12px' }}>
                  {exp.type === 'Savings' ? <PiggyBank size={24} color="var(--success)" /> : <Receipt size={24} color="var(--primary)" />}
                </div>
                <div>
                  <p className="font-bold">{exp.description}</p>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    {exp.section} • By {exp.paidBy.split('@')[0]}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'right' }}>
                <div>
                  <p className="font-bold text-xl" style={{ color: exp.type === 'Savings' ? 'var(--success)' : 'var(--text)' }}>
                    ₹{Number(exp.amount).toFixed(0)}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    {new Date(exp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(exp.id)}
                  style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
