"use client";

import React, { useState } from 'react';
import { AuthBrandPanel } from './AuthBrandPanel';
import { AuthFormPanel } from './AuthFormPanel';
import { Toast } from './AuthToast';

export default function RegisterScreen() {
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    loginEmail: '',
    loginPassword: ''
  });

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      showNotification('Please enter your full name', 'error');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      showNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    if (formData.password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match! Please check again.', 'error');
      return;
    }
    if (!agreedToTerms) {
      showNotification('Please agree to community guidelines & terms to proceed.', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showNotification(`🎉 Welcome aboard, ${formData.fullName.split(' ')[0]}! Account created successfully.`, 'success');
    }, 1200);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loginEmail || !formData.loginPassword) {
      showNotification('Please fill in both Email and Password', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showNotification('Welcome back to your local vibe!', 'success');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E0] to-[#FFE8D6] text-neutral-800 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-amber-300/40 to-orange-400/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-28 w-96 h-96 bg-gradient-to-tl from-orange-400/30 to-amber-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

      {/* Dynamic Toast Feedback Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Main Glassmorphism Master Card */}
      <div className="w-full max-w-6xl bg-white/80 backdrop-blur-xl border border-white/90 rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        <AuthBrandPanel />

        <AuthFormPanel
          authMode={authMode}
          setAuthMode={setAuthMode}
          formData={formData}
          handleInputChange={handleInputChange}
          handleRegisterSubmit={handleRegisterSubmit}
          handleLoginSubmit={handleLoginSubmit}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          agreedToTerms={agreedToTerms}
          setAgreedToTerms={setAgreedToTerms}
          isLoading={isLoading}
          onForgotPassword={() => showNotification('Password reset link sent to your registered email.', 'success')}
        />
      </div>
    </div>
  );
}