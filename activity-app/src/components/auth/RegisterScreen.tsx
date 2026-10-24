"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthBrandPanel } from './AuthBrandPanel';
import { AuthFormPanel } from './AuthFormPanel';
import { loginUser, registerUser } from '@/service/AuthService';
import { useAuth } from './AuthProvider';

export default function RegisterScreen({
  initialMode = 'register',
}: {
  initialMode?: 'register' | 'login';
}) {
  const router = useRouter();
  const { notify } = useAuth();
  const [authMode, setAuthMode] = useState<'register' | 'login'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    loginEmail: '',
    loginPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const fullNameLength = Array.from(formData.fullName).length;
    if (fullNameLength < 2 || fullNameLength > 120) {
      notify('Full name must be between 2 and 120 characters.', 'error');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      notify('Please enter a valid email address', 'error');
      return;
    }
    const phoneNumber = formData.phoneNumber.trim().replace(/[\s()-]/g, '');
    if (!/^\+?[1-9]\d{6,14}$/.test(phoneNumber)) {
      notify('Enter a valid phone number with 7 to 15 digits.', 'error');
      return;
    }
    const passwordLength = Array.from(formData.password).length;
    if (passwordLength < 8 || passwordLength > 72) {
      notify('Password must be between 8 and 72 characters.', 'error');
      return;
    }
    if (new TextEncoder().encode(formData.password).length > 72) {
      notify('Password must not exceed 72 UTF-8 bytes.', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      notify('Passwords do not match! Please check again.', 'error');
      return;
    }
    if (!agreedToTerms) {
      notify('Please agree to community guidelines & terms to proceed.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        full_name: formData.fullName,
        email: formData.email.trim(),
        phone_number: phoneNumber,
        password: formData.password,
      });
      notify(
        `🎉 Welcome aboard, ${formData.fullName.trim().split(/\s+/)[0]}! Account created successfully.`,
        'success'
      );
      setAuthMode('login');
      router.replace('/login');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Registration failed. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!formData.loginEmail || !formData.loginPassword) {
      notify('Please fill in both Email and Password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser({
        email: formData.loginEmail.trim(),
        password: formData.loginPassword,
      });
      notify('Login successful. Welcome back!', 'success');
      router.push('/dashboard');
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E0] to-[#FFE8D6] text-neutral-800 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-amber-300/40 to-orange-400/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-28 w-96 h-96 bg-gradient-to-tl from-orange-400/30 to-amber-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

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
          onForgotPassword={() => notify('Password reset link sent to your registered email.', 'success')}
        />
      </div>
    </div>
  );
}