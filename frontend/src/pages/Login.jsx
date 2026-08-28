import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || (user.role === 'admin' ? '/admin/dashboard' : '/my-reports');
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleCallback = async (response) => {
    setError('');
    setIsSubmitting(true);
    try {
      const loggedUser = await loginWithGoogle(response.credential);
      const destination = loggedUser.role === 'admin' ? '/admin/dashboard' : '/my-reports';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Google authentication failed');
      setIsSubmitting(false);
    }
  };

  const handleSimulateGoogle = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        email: 'googleuser@test.com',
        name: 'Google User Test',
        sub: `google-sub-${Date.now()}`
      };
      // Encode as standard base64 for decoding
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockGoogleCredential = `${encodedHeader}.${encodedPayload}.signature`;

      const loggedUser = await loginWithGoogle(mockGoogleCredential);
      const destination = loggedUser.role === 'admin' ? '/admin/dashboard' : '/my-reports';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Simulated Google login failed');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    /* global google */
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-dummyclientid.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInDiv'),
          { theme: 'filled_black', size: 'large', width: '380', shape: 'pill' }
        );
      } catch (err) {
        console.error('Google One Tap init failed:', err);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      const destination = loggedUser.role === 'admin' ? '/admin/dashboard' : '/my-reports';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-950/40 via-slate-950 to-slate-950">
      <div className="w-full max-w-md space-y-8 glass-panel rounded-2xl p-8 shadow-xl shadow-black/40 animate-fade-in glow-primary">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to report road hazards or track resolutions
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end text-xs">
            <Link
              to="/forgot-password"
              className="font-semibold text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-900"></div>
          <span className="flex-shrink mx-4 text-slate-600 text-xs font-bold uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-900"></div>
        </div>

        <div className="space-y-3">
          <div id="googleSignInDiv" className="w-full flex justify-center"></div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSimulateGoogle}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 font-semibold rounded-xl transition-all text-xs"
          >
            <span>Simulate Google Sign-In</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
