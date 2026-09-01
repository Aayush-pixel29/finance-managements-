import React, { useState } from 'react';
import { X, Receipt, PiggyBank, Users, RefreshCw, Camera, Loader } from 'lucide-react';
import { addExpense, addRecurringExpense } from '../services/expenseService';
import { analyzeReceipt, hasApiKey } from '../services/aiService';

export default function AddExpense({ currentUser, currentGroupId, onClose }) {
  const [type, setType] = useState('Expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('Food');
  const [customSection, setCustomSection] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const defaultSections = type === 'Expense' 
    ? ['Food', 'Transport', 'Utilities', 'Shopping', 'Entertainment', 'Health']
    : ['Emergency Fund', 'Retirement', 'Investment', 'Vacation', 'Education'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const finalSection = customSection || section;
    const expenseData = {
      amount: parseFloat(amount),
      description,
      section: finalSection,
      type,
      isShared,
      paidBy: currentUser
    };

    try {
      if (isRecurring) {
        await addRecurringExpense(expenseData, currentUser, currentGroupId);
        await addExpense(expenseData, currentUser, currentGroupId);
      } else {
        await addExpense(expenseData, currentUser, currentGroupId);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add entry");
    }
    setLoading(false);
  };

  const handleScanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!hasApiKey()) {
      alert("Please configure your Gemini API Key in the Sidebar settings first.");
      return;
    }

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const mimeType = file.type;
        
        try {
          const aiData = await analyzeReceipt(base64Data, mimeType);
          
          if (aiData.amount) setAmount(aiData.amount.toString());
          if (aiData.description) setDescription(aiData.description);
          if (aiData.category) {
            if (defaultSections.includes(aiData.category)) {
              setSection(aiData.category);
              setCustomSection('');
            } else {
              setSection('Custom');
              setCustomSection(aiData.category);
            }
          }
        } catch (aiErr) {
          alert(aiErr.message);
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Failed to read image");
      setScanning(false);
    }
  };

  return (
    <div className="glass-card animate-slide-up" style={{ position: 'relative' }}>
      <button 
        onClick={onClose} 
        style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
      >
        <X size={24} />
      </button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="text-2xl font-bold" style={{ margin: 0 }}>New Entry</h2>
        {type === 'Expense' && (
          <div>
             <input 
               type="file" 
               accept="image/*" 
               capture="environment" 
               id="receipt-upload" 
               style={{ display: 'none' }} 
               onChange={handleScanReceipt} 
             />
             <label htmlFor="receipt-upload" className="btn" style={{ cursor: 'pointer', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '6px 12px', fontSize: '0.85rem' }}>
               {scanning ? <Loader size={16} className="animate-spin" /> : <Camera size={16} />}
               {scanning ? 'Scanning...' : 'Scan Receipt'}
             </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          className="btn" 
          style={{ flex: 1, background: type === 'Expense' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: type === 'Expense' ? 'var(--danger)' : 'var(--text-muted)', border: `1px solid ${type === 'Expense' ? 'var(--danger)' : 'var(--border)'}` }}
          onClick={() => setType('Expense')}
        >
          <Receipt size={18} /> Expense
        </button>
        <button 
          className="btn" 
          style={{ flex: 1, background: type === 'Savings' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: type === 'Savings' ? 'var(--success)' : 'var(--text-muted)', border: `1px solid ${type === 'Savings' ? 'var(--success)' : 'var(--border)'}` }}
          onClick={() => setType('Savings')}
        >
          <PiggyBank size={18} /> Savings
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            className="input-field"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="input-group">
          <label>Description</label>
          <input
            type="text"
            className="input-field"
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Category</label>
          <select 
            className="input-field" 
            value={section} 
            onChange={(e) => {
              setSection(e.target.value);
              if (e.target.value !== 'Custom') setCustomSection('');
            }}
          >
            {defaultSections.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Custom">Other (Custom...)</option>
          </select>
        </div>

        {section === 'Custom' && (
          <div className="input-group animate-slide-up">
            <input
              type="text"
              className="input-field"
              placeholder="Enter custom category"
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              required
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
            <input 
              type="checkbox" 
              checked={isShared} 
              onChange={(e) => setIsShared(e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <Users size={16} color="var(--primary)" /> Shared Family Expense (Split equally)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
            <input 
              type="checkbox" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)} 
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <RefreshCw size={16} color="var(--primary)" /> Recurring Monthly Expense
          </label>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Adding...' : 'Add Entry'}
        </button>
      </form>
    </div>
  );
}
