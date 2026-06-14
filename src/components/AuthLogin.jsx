import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function AuthLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-promo-panel">
        <div className="auth-promo" aria-hidden="true">
          <img src="./auth_graphic.svg" alt="login promo" /> 
        </div>
        {/* <img src="./auth_graphic.svg" alt="login promo" /> */} 
        {/* fix this so the image is in the rounded container and resizes */}
      </div>

      <div className="auth-form-panel form-container">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <img src="/logo-small.svg" alt="CMU Bulletin" className="auth-logo" />
            <h2>Welcome back!</h2>
            <p className="auth-subtext">Log in to continue your campus experience</p>
          </div>

          <form onSubmit={handleSignIn}>
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn">
              Log In
            </button>

            <p className="auth-login-prompt">
              Don&apos;t have an account?{' '}
              <Link to="/authsignup" className="auth-login-link">
                Sign up
              </Link>
            </p>
          </form>

          {error && <p className="form-message error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default AuthLogin;
