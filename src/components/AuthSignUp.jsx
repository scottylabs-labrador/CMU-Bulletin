import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, createUserProfile } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

function AuthSignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user, { name, email });
      navigate('/');
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-promo-panel">
        <div className="auth-promo" aria-hidden="true" />
      </div>

      <div className="auth-form-panel form-container">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <img src="/logo-small.svg" alt="CMU Bulletin" className="auth-logo" />
            <h2>Join CMU Bulletin</h2>
            <p className="auth-subtext">Your digital campus experience starts here</p>
          </div>

          <form onSubmit={handleSignUp}>
            <div>
              <label>Name</label>
              <input
                type="text"
                placeholder="Name / Organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="andrew.cmu.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>

            <p className="auth-login-prompt">
              Already have an account?{' '}
              <Link to="/authlogin" className="auth-login-link">
                Log in
              </Link>
            </p>
          </form>

          {error && <p className="form-message error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default AuthSignUp;
