"use client";

import React from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AuthInput } from './AuthFormFields';

interface FormDataState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  loginEmail: string;
  loginPassword: string;
}

interface AuthFormPanelProps {
  authMode: 'register' | 'login';
  setAuthMode: (mode: 'register' | 'login') => void;
  formData: FormDataState;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  handleLoginSubmit: (e: React.FormEvent) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  isLoading: boolean;
  onForgotPassword: () => void;
}

export function AuthFormPanel({
  authMode,
  setAuthMode,
  formData,
  handleInputChange,
  handleRegisterSubmit,
  handleLoginSubmit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  agreedToTerms,
  setAgreedToTerms,
  isLoading,
  onForgotPassword,
}: AuthFormPanelProps) {
  return (
    <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white/60 backdrop-blur-md">
      {/* Top Toggle Switch */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {authMode === 'register' ? 'Create Your Vibe Account' : 'Welcome Back!'}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            {authMode === 'register' 
              ? 'Join local events and invite verified neighbors to connect.' 
              : 'Log in to check invites and manage ongoing activities.'}
          </p>
        </div>

        {/* Pill Switcher */}
        <div className="bg-orange-100/70 p-1 rounded-2xl flex items-center border border-orange-200/50">
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-orange-600 shadow-sm shadow-orange-500/10'
                : 'text-neutral-600 hover:text-orange-600'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-orange-600 shadow-sm shadow-orange-500/10'
                : 'text-neutral-600 hover:text-orange-600'
            }`}
          >
            Log In
          </button>
        </div>
      </div>

      {authMode === 'register' ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <AuthInput
            label="Full Name"
            icon={<User className="w-4 h-4" />}
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="e.g. Riya Sharma"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <AuthInput
                label="Email Address"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="riya@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AuthInput
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Min 8 characters"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-neutral-400 hover:text-orange-500 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <AuthInput
              label="Confirm Password"
              icon={<Lock className="w-4 h-4" />}
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter password"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="text-neutral-400 hover:text-orange-500 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500/40 accent-orange-600 cursor-pointer"
              />
              <span className="text-xs text-neutral-600 leading-relaxed">
                I agree to connect, invite, and share plans respectfully under the{' '}
                <span className="font-semibold text-orange-600 hover:underline">
                  ActiVibe Neighborhood Safety Guidelines
                </span>{' '}
                and <span className="font-semibold text-neutral-800">Privacy Policy</span>.
              </span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Join Local Vibes</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <AuthInput
            label="Email Address"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            name="loginEmail"
            value={formData.loginEmail}
            onChange={handleInputChange}
            placeholder="you@email.com"
            required
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Password
              </label>
              {/* <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
              >
                Forgot Password?
              </button> */}
            </div>
            <AuthInput
              label=""
              icon={<Lock className="w-4 h-4" />}
              type={showPassword ? 'text' : 'password'}
              name="loginPassword"
              value={formData.loginPassword}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-neutral-400 hover:text-orange-500 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In to Your Vibe</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Bottom Switch Footer */}
      <div className="mt-8 text-center text-xs text-neutral-500">
        {authMode === 'register' ? (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4 ml-1 cursor-pointer"
            >
              Log In
            </button>
          </p>
        ) : (
          <p>
            New to ActiVibe?{' '}
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className="font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4 ml-1 cursor-pointer"
            >
              Sign Up for Free
            </button>
          </p>
        )}
      </div>
    </div>
  );
}