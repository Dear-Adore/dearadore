'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Mail, Lock, User, EyeOff, Eye, Check } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { syncUserToDatabase } from '../app/actions/userActions';

export default function LoginPage() {
  const router = useRouter();
  
  // 'login', 'register', 'forgot'
  const [view, setView] = useState('login');
  
  // States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Halaman tujuan setelah login (hanya path internal)
  const getNext = () => {
    if (typeof window === 'undefined') return '/akun';
    const n = new URLSearchParams(window.location.search).get('next');
    return n && n.startsWith('/') && !n.startsWith('//') ? n : '/akun';
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('next')?.startsWith('/buat-undangan')) {
      setView('register');
      setInfoMsg('Silakan buat akun atau login terlebih dahulu untuk membuat project.');
    }
    if (p.get('error')) setErrorMsg('Login gagal. Silakan coba lagi.');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (view === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Password tidak sama');
        }
        if (formData.password.length < 6) {
          throw new Error('Password minimal 6 karakter');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
        
        // Simpan UID ke cookie agar terbaca di Server Actions
        document.cookie = `firebase_uid=${userCredential.user.uid}; path=/; max-age=86400`;
        
        await syncUserToDatabase({
          id: userCredential.user.uid,
          email: formData.email,
          name: formData.name,
        });

        window.location.href = getNext();
        
      } else if (view === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Simpan UID ke cookie agar terbaca di Server Actions
        document.cookie = `firebase_uid=${userCredential.user.uid}; path=/; max-age=86400`;
        
        await syncUserToDatabase({
          id: userCredential.user.uid,
          email: formData.email,
        });
        
        window.location.href = getNext();
        
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, formData.email);
        alert('Instruksi reset password telah dikirim ke email Anda.');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setErrorMsg('Email atau password salah');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email sudah terdaftar');
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async () => {
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      document.cookie = `firebase_uid=${userCredential.user.uid}; path=/; max-age=86400`;
      
      await syncUserToDatabase({
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName,
      });

      window.location.href = getNext();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const inputGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '0.8rem 1rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    border: '1px solid #F3F4F6'
  };

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.95rem',
    color: '#374151',
    marginLeft: '0.75rem',
    width: '100%'
  };

  const iconColor = '#9CA3AF';

  const SocialButtons = () => (
    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'absolute', height: '1px', background: '#E5E7EB', width: '100%', zIndex: 0 }} />
        <span style={{ position: 'relative', background: '#F9FAFB', padding: '0 1rem', fontSize: '0.85rem', color: '#6B7280', zIndex: 1 }}>
          atau
        </span>
      </div>
      <button
        type="button"
        id="google-auth-btn"
        onClick={handleOAuth}
        style={{
          width: '100%',
          padding: '0.9rem',
          borderRadius: '24px',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.95rem',
          color: '#374151'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
        </svg>
        {view === 'register' ? 'Sign up with Google' : 'Login with Google'}
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 24px -4px rgba(0, 0, 0, 0.03)',
        padding: '2.5rem 2rem',
        boxSizing: 'border-box'
      }}>
        
        {/* Back Button */}
        <button
          onClick={() => {
            if (view !== 'login') setView('login');
            else router.back();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            marginBottom: '2rem',
            color: '#374151'
          }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
            {view === 'login' && 'Log in'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Forgot Password'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.5, padding: '0 1rem' }}>
            {view === 'login' && 'Enter your email and password to securely access your account and manage your services.'}
            {view === 'register' && 'Create a new account to get started and enjoy seamless access to our features.'}
            {view === 'forgot' && 'Enter your email address to receive a reset link and regain access to your account.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth}>
          {infoMsg && (
            <div style={{ background: '#ECFDF5', color: '#065F46', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {infoMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}
          
          {view === 'register' && (
            <div style={inputGroupStyle}>
              <User size={18} color={iconColor} />
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
          )}

          <div style={inputGroupStyle}>
            <Mail size={18} color={iconColor} />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          {view !== 'forgot' && (
            <div style={inputGroupStyle}>
              <Lock size={18} color={iconColor} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <Eye size={18} color={iconColor} /> : <EyeOff size={18} color={iconColor} />}
              </button>
            </div>
          )}

          {view === 'register' && (
            <div style={inputGroupStyle}>
              <Lock size={18} color={iconColor} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={inputStyle}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showConfirmPassword ? <Eye size={18} color={iconColor} /> : <EyeOff size={18} color={iconColor} />}
              </button>
            </div>
          )}

          {view === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#4B5563' }}>
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{ 
                    width: '18px', height: '18px', borderRadius: '4px', 
                    border: rememberMe ? 'none' : '1px solid #D1D5DB', 
                    background: rememberMe ? '#111827' : '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {rememberMe && <Check size={12} color="#FFF" />}
                </div>
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setView('forgot')}
                style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', fontWeight: 500 }}
              >
                Forgot Password
              </button>
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#111827',
              color: '#FFF',
              border: 'none',
              borderRadius: '24px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: view === 'forgot' ? '1.5rem' : '0.5rem',
              boxShadow: '0 4px 14px rgba(17, 24, 39, 0.15)',
              transition: 'all 0.2s'
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : view === 'login' ? 'Login' : view === 'register' ? 'Create Account' : 'Continue'}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6B7280' }}>
          {view === 'login' && (
            <span>
              Don't have an account?{' '}
              <button 
                onClick={() => setView('register')} 
                style={{ background: 'none', border: 'none', color: '#111827', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign Up here
              </button>
            </span>
          )}
          {view === 'register' && (
            <span>
              Already have an account?{' '}
              <button 
                onClick={() => setView('login')} 
                style={{ background: 'none', border: 'none', color: '#111827', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In here
              </button>
            </span>
          )}
        </div>

        {/* Social */}
        {view !== 'forgot' && <SocialButtons />}

      </div>
    </div>
  );
}
