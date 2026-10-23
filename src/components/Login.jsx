import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function Login() {
  const { login, register, loginGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await register(email, password, displayName);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email address.');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginGoogle();
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85vh', padding: '16px 0' }}>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--yc-gradient)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--yc-orange-glow)',
          marginBottom: '16px'
        }}>
          <Sparkles size={34} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-pure)' }}>
          Finance<span className="text-yc-orange">Hub</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
          Y Combinator aesthetic family expense manager
        </p>
      </div>

      {/* Main Form Card */}
      <div className="yc-card yc-card-glow" style={{ padding: '24px' }}>

        {/* Toggle Mode */}
        {mode !== 'forgot' && (
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: '14px', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'login' ? 'var(--yc-orange)' : 'transparent',
                color: mode === 'login' ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                border: 'none',
                background: mode === 'register' ? 'var(--yc-orange)' : 'transparent',
                color: mode === 'register' ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--yc-orange)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, marginBottom: '16px' }}
          >
            ← Back to Sign In
          </button>
        )}

        {/* Error / Success Messages */}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--coral-bg)', border: '1px solid var(--coral-red)', color: 'var(--coral-red)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--emerald-bg)', border: '1px solid var(--emerald-green)', color: 'var(--emerald-green)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-block">
              <label className="input-caption">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-yc"
                  placeholder="e.g. Papa, Mummy, Aayush"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              </div>
            </div>
          )}

          <div className="input-block">
            <label className="input-caption">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-yc"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '42px' }}
                required
                autoFocus
              />
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="input-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-caption">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--yc-orange)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-yc"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                  required
                  minLength={6}
                />
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-yc-primary"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Free Account' : 'Send Reset Link'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
              <span style={{ padding: '0 10px', color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: 700 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-yc-secondary"
              style={{ width: '100%', padding: '12px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign In with Google
            </button>
          </>
        )}
      </div>

    </div>
  );
}
