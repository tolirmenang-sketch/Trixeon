import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthMethod } from '../types';
import {
  X,
  Smartphone,
  UserCheck,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquareCode,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, sendPhoneOtp, loginWithPhone, loginWithUserId } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthMethod>('google');

  // Phone Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // User ID / Email Form State
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [idLoading, setIdLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle('trader.google@trixeon.io', 'Google Trader');
      onClose();
    } catch {
      setErrorMsg('Google Sign-In failed');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 7) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    setErrorMsg('');
    setPhoneLoading(true);
    const result = await sendPhoneOtp(phone);
    setPhoneLoading(false);
    if (result.success) {
      setOtpSent(true);
      if (result.demoCode) {
        setSimulatedOtpCode(result.demoCode);
      }
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg('Please enter the 6-digit verification OTP code');
      return;
    }
    setErrorMsg('');
    setPhoneLoading(true);
    const success = await loginWithPhone(phone, otp);
    setPhoneLoading(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Invalid OTP verification code');
    }
  };

  const handleUserIdAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdInput || !passwordInput) {
      setErrorMsg('Please fill in both User ID / Email and Password');
      return;
    }
    setErrorMsg('');
    setIdLoading(true);
    const success = await loginWithUserId(userIdInput, passwordInput, isRegisterMode);
    setIdLoading(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div id="auth-modal-container" className="relative w-full max-w-md bg-[#121620] border border-[#232b3e] rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.15)] overflow-hidden">
        
        {/* Header Title Bar */}
        <div className="flex items-center justify-between p-5 border-b border-[#1f2738] bg-gradient-to-r from-[#121620] via-[#171d2b] to-[#121620]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[#00F2FE]">
              <Zap className="w-4 h-4 fill-cyan-400/20" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">TRIXEON FUTURES</h3>
              <p className="text-[11px] text-slate-400">Secure Blockchain Trading Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-3 bg-[#0d1018] border-b border-[#1b2230]">
          <button
            id="auth-tab-google"
            onClick={() => { setActiveTab('google'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'google'
                ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {/* Google SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </button>

          <button
            id="auth-tab-phone"
            onClick={() => { setActiveTab('phone'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'phone'
                ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Phone
          </button>

          <button
            id="auth-tab-userid"
            onClick={() => { setActiveTab('userid'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'userid'
                ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            User ID
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* GOOGLE TAB */}
          {activeTab === 'google' && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.15)]">
                <Sparkles className="w-8 h-8 text-[#00F2FE]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Google One-Tap Auth</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your Google Account for instant, encrypted access to real-time crypto futures trading.
                </p>
              </div>

              <button
                id="google-login-action-btn"
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-bit SSL Cryptographic Handshake Enabled</span>
              </div>
            </div>
          )}

          {/* PHONE OTP TAB */}
          {activeTab === 'phone' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone Number (with Country Code)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full bg-[#171d2b] border border-[#283247] focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {phoneLoading ? 'Sending SMS Code...' : 'Send SMS Verification Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhone} className="space-y-4">
                  {simulatedOtpCode && (
                    <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 font-mono text-center flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MessageSquareCode className="w-4 h-4 text-[#00F2FE]" />
                        <span>SMS OTP Verification Code:</span>
                      </div>
                      <span className="font-extrabold text-white text-sm bg-cyan-900/60 px-2 py-0.5 rounded">
                        {simulatedOtpCode}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Enter 6-Digit SMS OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-[#171d2b] border border-[#283247] focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-center text-lg tracking-widest text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {phoneLoading ? 'Verifying...' : 'Verify & Enter Trading Hub'}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs text-slate-400 hover:text-white"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* USER ID / EMAIL TAB */}
          {activeTab === 'userid' && (
            <form onSubmit={handleUserIdAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  User ID / Registered Email
                </label>
                <input
                  type="text"
                  value={userIdInput}
                  onChange={e => setUserIdInput(e.target.value)}
                  placeholder="TX-883921 or name@domain.com"
                  className="w-full bg-[#171d2b] border border-[#283247] focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#171d2b] border border-[#283247] focus:border-[#00F2FE] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[#00F2FE] hover:underline font-semibold"
                >
                  {isRegisterMode ? 'Already have an account? Login' : 'Need new Account? Register'}
                </button>
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ZK-Encrypted
                </span>
              </div>

              <button
                type="submit"
                disabled={idLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {idLoading
                  ? 'Authenticating...'
                  : isRegisterMode
                  ? 'Register Trixeon Account'
                  : 'Sign In With User ID'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
