import React, { useState } from 'react';
import { UserCircle2 } from 'lucide-react';
import { loginWithEmail, registerWithEmail, resetPassword, loginWithGoogle } from '../services/authService';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      // App.jsx will automatically detect the login and switch the screen
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // For redirect auth, this line may not be reached as page redirects
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    try {
      await resetPassword(email);
      setMessage('Password reset email sent (check spam folder).');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="glass-card animate-slide-up" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
      <div className="text-center mb-6">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <UserCircle2 size={64} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Family Expenses</h2>
        <p className="text-muted">{isRegistering ? 'Create a new account' : 'Sign in to continue'}</p>
      </div>

      {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
      {message && <div style={{ color: 'var(--success)', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email Address</label>
          <input
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
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
          />
        </div>
        
        <button type="submit" className="btn" style={{ marginTop: '24px' }} disabled={loading}>
          {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
        </button>
      </form>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '0.9rem' }}>
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>

        {!isRegistering && (
          <button 
            onClick={handleForgotPassword}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Forgot Password?
          </button>
        )}
      </div>
    </div>
  );
}
