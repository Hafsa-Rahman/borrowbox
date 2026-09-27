import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const demoUsers = [
    { name: 'Ali Khan (User)', email: 'ali@borrowbox.dev', badge: '👤' },
    { name: 'Sara Ahmed (User)', email: 'sara@borrowbox.dev', badge: '👤' },
    { name: 'Usman Raza (User)', email: 'usman@borrowbox.dev', badge: '👤' },
    { name: 'Admin User (Admin)', email: 'admin@borrowbox.dev', badge: '🛡️' },
  ];

  const submitCredentials = async (loginEmail, loginPassword) => {
    try {
      setError('');
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword || 'Passw0rd!' }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || resData.error || 'Login failed');
      }

      // Read from resData.data because backend sends { success: true, data: { user, token } }
      const authData = resData.data;

      if (authData && authData.token) {
        localStorage.setItem('token', authData.token);
        if (authData.user) {
          localStorage.setItem('user', JSON.stringify(authData.user));
        }
        if (onLogin) onLogin(authData.user);
        
        // Redirect to homepage
        window.location.href = '/';
      } else {
        throw new Error('No token returned from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Could not connect to backend server');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitCredentials(email, password);
  };

  const handleDemoClick = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Passw0rd!');
    submitCredentials(demoEmail, 'Passw0rd!');
  };

  return (
    <div className="login-card" style={{ maxWidth: '420px', margin: '40px auto', padding: '24px', border: '1px solid #e0e0e0', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
      <h2 style={{ marginBottom: '16px', textAlign: 'center' }}>Log in</h2>

      {/* Quick Demo Logins */}
      <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
        <small style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#495057' }}>
          ⚡ One-Click Demo Logins:
        </small>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {demoUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => handleDemoClick(u.email)}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{u.badge}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '8px 12px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        <button 
          type="submit" 
          style={{ width: '100%', padding: '10px', borderRadius: '6px', cursor: 'pointer', background: '#0d6efd', color: '#fff', border: 'none', fontWeight: 'bold' }}
        >
          Log in
        </button>
      </form>
    </div>
  );
}