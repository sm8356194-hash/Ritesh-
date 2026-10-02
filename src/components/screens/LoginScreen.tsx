/**
 * Login & Authentication Screen
 * 
 * Supports Email/Password (Sign In / Register) and Google Sign-In with Firebase Auth integration.
 * Mobile Number + OTP is clearly designated as unavailable on the free Starter tier, preventing
 * broken provider calls and directing users to Google or Email & Password.
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowLeft, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth/authService';
import { useTranslation } from '../../services/languageService';
import { GlobalLanguageSelector } from '../common/GlobalLanguageSelector';

interface LoginScreenProps {
  onBackToHome?: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBackToHome, onLoginSuccess }) => {
  const { t } = useTranslation();
  const [authType, setAuthType] = useState<'email' | 'phone'>('email');
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isLoginMode) {
        const res = await authService.loginWithEmail(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Login failed. Please check your credentials.');
        } else {
          setSuccessMessage('Successfully signed in! Returning...');
          setTimeout(() => {
            onLoginSuccess();
          }, 800);
        }
      } else {
        const res = await authService.register({
          email,
          password,
          displayName,
          role: 'USER',
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Registration failed.');
        } else {
          setSuccessMessage('Account created successfully! Returning...');
          setTimeout(() => {
            onLoginSuccess();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authService.loginWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Google sign-in failed.');
      } else {
        setSuccessMessage('Google sign-in successful! Returning...');
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05080f] text-[#e2e8f0] flex flex-col items-center justify-start overflow-y-auto px-4 py-8 pb-24 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation / Back to Home */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        {onBackToHome ? (
          <button
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-xl bg-[#16203c]/80 hover:bg-[#1e2b4f] text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/20 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{t('backToHome')}</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <GlobalLanguageSelector id="login-global-lang-selector" />
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold font-serif">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('vedicPortal')}</span>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md rounded-3xl bg-[#0c1222] border border-amber-500/30 shadow-2xl p-6 sm:p-8 relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-100 tracking-wide">
            {t('appTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('tagline')}
          </p>
        </div>

        {/* Auth Method Selector Tabs: Email vs Phone */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setAuthType('email'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all border ${
              authType === 'email'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-[#16203c] text-slate-300 border-[#1e2b4f] hover:text-white'
            }`}
          >
            {t('signInWithEmail')}
          </button>
          <button
            type="button"
            onClick={() => { setAuthType('phone'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
              authType === 'phone'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-[#16203c] text-slate-300 border-[#1e2b4f] hover:text-white'
            }`}
          >
            <span>{t('signInWithPhone')}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              authType === 'phone' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
            }`}>
              Later
            </span>
          </button>
        </div>

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* EMAIL / PASSWORD FORM */}
        {authType === 'email' && (
          <>
            <div className="flex rounded-xl bg-[#16203c] p-1 border border-amber-500/20 mb-5">
              <button
                type="button"
                onClick={() => { setIsLoginMode(true); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isLoginMode ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('login')}
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginMode(false); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !isLoginMode ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('register')}
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('fullName')}
                      className="w-full bg-[#16203c] border border-amber-500/20 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#16203c] border border-amber-500/20 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#16203c] border border-amber-500/20 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <span>Please wait...</span> : <span>{isLoginMode ? t('login') : t('register')}</span>}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e2b4f]"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-[#0c1222] px-2 text-slate-400">{t('orContinueWith')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 border border-amber-500/20 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{t('signInWithGoogle')}</span>
            </button>
          </>
        )}

        {/* MOBILE + OTP UNAVAILABLE NOTICE VIEW */}
        {authType === 'phone' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#16203c]/90 border border-amber-500/20 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                <Phone className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold mb-2">
                <span>Coming Later</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                Mobile + OTP Unavailable
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mb-4">
                Mobile + OTP is currently unavailable. Please use Google or Email & Password.
              </p>

              <div className="w-full space-y-2 pt-2 border-t border-[#1e2b4f]/60">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#1e2b4f] hover:bg-[#253561] text-slate-100 border border-amber-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthType('email'); setErrorMessage(null); setSuccessMessage(null); }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#b48c26] to-[#d4af37] text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-slate-950" />
                  <span>Use Email & Password</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default LoginScreen;
