import React, { useState } from 'react';
import { auth, db } from '../js/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/login.css'

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password should be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username should be at least 3 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting signup process...');
      console.log('Auth object:', auth);
      
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', userCredential);
      
      const user = userCredential.user;
      console.log('User object:', user);

      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        createdAt: new Date().toISOString()
      });
      console.log('User data saved to Firestore');

      setUsername('');
      setEmail('');
      setPassword('');
      
      
      navigate('/login');
      
    } catch (err) {
      console.error('Detailed signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (err.code === 'auth/configuration-not-found') {
        setError('Firebase configuration error. Please try again later.');
      } else {
        setError(`Signup failed: ${err.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-outer">
      <div className="login-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input 
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className='login-input'
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='login-input'
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='login-input'
            required
          />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default Signup;
