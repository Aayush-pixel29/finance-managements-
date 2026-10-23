import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, Check, ChevronDown, CreditCard, PiggyBank, ReceiptText, Smartphone, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useExpenses } from '../context/ExpenseContext';

const expenseCategories = ['Food & Dining', 'Shopping & Groceries', 'Transport & Fuel', 'Bills & Utilities', 'Health & Pharmacy', 'Entertainment', 'Education & Fees', 'General'];
const savingCategories = ['Emergency Fund', 'Fixed Deposit / Mutual Fund', 'Savings / Gold', 'General'];
const quickAmounts = [100, 500, 1000, 2000];
const paymentMethods = [
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'Card', label: 'Card', icon: CreditCard },
  { id: 'Cash', label: 'Cash', icon: Wallet }
];

export default function AddExpense({ onClose }) {
  const { currentUser } = useAuth();
  const { groupMembers } = useGroup();
  const { addExpense, recordSettlement } = useExpenses();
  const [kind, setKind] = useState('Expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('UPI');
  const [shared, setShared] = useState(false);
  const [members, setMembers] = useState([currentUser]);
  const [recipient, setRecipient] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMembers((current) => current.filter((member) => groupMembers.includes(member)).length ? current.filter((member) => groupMembers.includes(member)) : [currentUser]);
  }, [currentUser, groupMembers]);

  const chooseKind = (nextKind) => {
    setKind(nextKind);
    setError('');
    setShared(false);
    setMembers([currentUser]);
    setRecurring(false);
    setCategory(nextKind === 'Savings' ? savingCategories[0] : expenseCategories[0]);
  };

  const toggleMember = (member) => {
    setMembers((current) => current.includes(member)
      ? current.length > 1 ? current.filter((item) => item !== member) : current
      : [...current, member]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const cleanAmount = Number(amount);
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      setError('Enter an amount greater than ₹0.');
      return;
    }
    if (kind === 'Settlement' && !recipient) {
      setError('Choose who received this payment.');
      return;
    }
    setLoading(true);
    try {
      if (kind === 'Settlement') {
        await recordSettlement(recipient, cleanAmount);
      } else {
        await addExpense({
          amount: cleanAmount,
          description: note.trim() || category,
          section: category,
          type: kind,
          isShared: shared,
          splitMembers: shared ? members : [currentUser],
          paymentMethod: method,
          // Noon avoids serialising an Indian local date as the previous UTC day.
          createdAt: new Date(`${date}T12:00:00`).toISOString()
        }, recurring);
      }
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'We could not save this transaction. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = kind === 'Savings' ? savingCategories : expenseCategories;

  return (
    <div className="yc-modal-backdrop" onClick={onClose} role="presentation">
      <section className="yc-bottom-sheet transaction-sheet" onClick={(event) => event.stopPropagation()} aria-label="Add transaction">
        <header className="sheet-header">
          <div><span className="eyebrow">New entry</span><h2>What happened?</h2></div>
          <button className="btn-yc-icon" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>

        <div className="transaction-type-picker" role="tablist" aria-label="Transaction type">
          <button type="button" className={kind === 'Expense' ? 'active' : ''} onClick={() => chooseKind('Expense')}><ReceiptText size={17} /> Expense</button>
          <button type="button" className={kind === 'Savings' ? 'active savings' : ''} onClick={() => chooseKind('Savings')}><PiggyBank size={17} /> Save</button>
          <button type="button" className={kind === 'Settlement' ? 'active settle' : ''} onClick={() => chooseKind('Settlement')}><ArrowRightLeft size={17} /> Settle</button>
        </div>

        <form onSubmit={submit}>
          <div className="amount-field">
            <label htmlFor="amount">Amount</label>
            <div><span>₹</span><input id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" autoFocus /></div>
            <div className="quick-amounts">{quickAmounts.map((quickAmount) => <button key={quickAmount} type="button" onClick={() => setAmount(String(quickAmount))}>₹{quickAmount.toLocaleString('en-IN')}</button>)}</div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          {kind === 'Settlement' ? (
            <div className="input-block">
              <label className="input-caption" htmlFor="recipient">I paid</label>
              <select id="recipient" className="input-yc" value={recipient} onChange={(event) => setRecipient(event.target.value)}>
                <option value="">Choose a person</option>
                {groupMembers.filter((member) => member !== currentUser).map((member) => <option key={member} value={member}>{member.split('@')[0]}</option>)}
              </select>
              <p className="field-help">This reduces the amount you owe that person.</p>
            </div>
          ) : (
            <>
              <div className="input-block"><label className="input-caption" htmlFor="note">What was it for? <em>Optional</em></label><input id="note" className="input-yc" value={note} onChange={(event) => setNote(event.target.value)} placeholder={kind === 'Savings' ? 'e.g. Monthly SIP' : 'e.g. Sunday groceries'} maxLength={200} /></div>
              <div className="input-block"><label className="input-caption">Category</label><div className="category-picker">{categories.map((item) => <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{category === item && <Check size={13} />}{item}</button>)}</div></div>

              {kind === 'Expense' && groupMembers.length > 1 && <div className="split-card">
                <div><strong>Split this expense?</strong><p>{shared ? `Shared by ${members.length} people` : 'Only you are charged'}</p></div>
                <button type="button" className={shared ? 'switch on' : 'switch'} onClick={() => { setShared(!shared); if (!shared) setMembers(groupMembers); }} aria-pressed={shared}><i /></button>
                {shared && <div className="member-picker">{groupMembers.map((member) => <button type="button" key={member} className={members.includes(member) ? 'selected' : ''} onClick={() => toggleMember(member)}>{members.includes(member) && <Check size={12} />}{member === currentUser ? 'You' : member.split('@')[0]}</button>)}</div>}
              </div>}
            </>
          )}

          {kind !== 'Settlement' && <div className="advanced-area">
            <button className="advanced-toggle" type="button" onClick={() => setAdvancedOpen(!advancedOpen)} aria-expanded={advancedOpen}>More details <ChevronDown size={16} className={advancedOpen ? 'open' : ''} /></button>
            {advancedOpen && <div className="advanced-fields"><div className="input-block"><label className="input-caption" htmlFor="date">Date</label><input id="date" className="input-yc" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div><div className="input-block"><label className="input-caption">Paid with</label><div className="method-picker">{paymentMethods.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={method === id ? 'selected' : ''} onClick={() => setMethod(id)}><Icon size={15} />{label}</button>)}</div></div><label className="recurring-control"><input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} />Repeat every month</label></div>}
          </div>}

          <button className="btn-yc-primary save-transaction" type="submit" disabled={loading}>{loading ? 'Saving…' : kind === 'Settlement' ? 'Record payment' : `Save ${kind.toLowerCase()}`}</button>
        </form>
      </section>
    </div>
  );
}
