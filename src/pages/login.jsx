import React, { useState } from 'react';
import { auth, db } from '../js/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import "../css/login.css"
import { useNavigate } from 'react-router-dom';

function Login({ onSignupClick, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      }
      
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="login-outer">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
            type="button"
            className="login-btn"
            onClick={onSignupClick}
          >
            Signup
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default Login;
