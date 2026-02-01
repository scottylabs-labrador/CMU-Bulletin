// src/components/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function AuthSignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!firstName || !lastName) {
      setError('First name and Last name are required.');
      return;
    }
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        organization,
        email,
      });
      navigate('/'); // Redirect to homepage
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      setError(err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      setError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <div className="form-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <div>
              <label>First Name:</label>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Last Name:</label>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Organization (Optional):</label>
              <input
                type="text"
                placeholder="Organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
          </>
        )}
        <div>
          <label>Email:</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <button type="submit" className="btn">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            style={{ cursor: 'pointer', fontSize: '0.9em', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </a>
        </div>
      </form>
      {error && <p className="form-message error">{error}</p>}
    </div>
  );
}

export default AuthSignUp;