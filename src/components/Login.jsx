import React, { useState } from 'react';
import { UserCircle2 } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../services/authService';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatEmail = (input) => {
    // If the input is exactly 10 digits, convert it to a fake email for Firebase
    if (/^\d{10}$/.test(input.trim())) {
      return `${input.trim()}@family.app`;
    }
    return input.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedEmail = formatEmail(emailOrMobile);

    try {
      if (isRegister) {
        await registerWithEmail(formattedEmail, password);
      } else {
        await loginWithEmail(formattedEmail, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError('Invalid email or mobile format.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email or mobile number is already registered.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email/mobile or password.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    }
    setLoading(false);
  };

  return (
    <div className="glass-card animate-slide-up" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <div className="text-center mb-6">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <UserCircle2 size={64} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Family Expenses</h2>
        <p className="text-muted">{isRegister ? 'Create an account' : 'Sign in to continue'}</p>
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email or Mobile Number (10 digits)</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 9876543210 or name@email.com"
            value={emailOrMobile}
            onChange={(e) => setEmailOrMobile(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '0.9rem' }}>
        <button 
          onClick={() => setIsRegister(!isRegister)} 
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
      </div>

      <button 
        type="button" 
        className="btn" 
        style={{ background: 'white', color: '#333' }} 
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}
