"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap } from "lucide-react";
import toast from "react-hot-toast";

import { app } from "@/lib/firebase";

// creating a Firebase auth instance
const auth = getAuth(app);

export default function BaagduSignUp() {
  // state var that stores the user email
  const [email, setEmail] = useState("");

  // state var that stores the user password
  const [password, setPassword] = useState("");

  // state var that is responsible for showing/hiding the password
  const [showPassword, setShowPassword] = useState(false);

  // state var that manages the loading state of the submit button
  const [isLoading, setIsLoading] = useState(false);

  // triggers when user clicks on the submit button
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set loading state to once the api request is initiated
    setIsLoading(true);

    try {
      // creating a new user with email and password
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // display success message
      toast.success("Account created successfully!");

      // clearing the states once the user is created
      setEmail("");
      setPassword("");

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      toast.error(`Error: ${err.message}`);
      console.error("Error creating account:", err);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at top, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #111111 25%, #1a1a1a 50%, #0f0f0f 100%)
        `,
      }}
    >
      {/* Animated floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-25 animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-blue-300 rounded-full opacity-20 animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-purple-300 rounded-full opacity-15 animate-pulse delay-1500"></div>
      </div>

      {/* Main form container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/30 p-8 transform hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl"></div>

          {/* Logo/Brand section */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mb-4 shadow-xl border border-slate-600/50 relative overflow-hidden">
              <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Baagdu AI
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Create your journey
            </p>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
          </div>

          {/* Form */}
          <div className="space-y-6 relative z-10">
            {/* Email field */}
            <div className="group">
              <label className="block text-sm font-medium text-slate-300 mb-2 group-focus-within:text-blue-400 transition-colors">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="group">
              <label className="block text-sm font-medium text-slate-300 mb-2 group-focus-within:text-blue-400 transition-colors">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-slate-600/30"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            <div className="text-xs text-slate-500 space-y-1">
              <p>Password should contain:</p>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <span className={password.length >= 8 ? "text-green-400" : ""}>
                  • 8+ characters
                </span>
                <span
                  className={/[A-Z]/.test(password) ? "text-green-400" : ""}
                >
                  • Uppercase letter
                </span>
                <span
                  className={/[a-z]/.test(password) ? "text-green-400" : ""}
                >
                  • Lowercase letter
                </span>
                <span
                  className={/[0-9]/.test(password) ? "text-green-400" : ""}
                >
                  • Number
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Create Account
                </div>
              )}
            </button>

            {/* Terms acceptance */}
            <div className="text-center">
              <p className="text-slate-500 text-xs leading-relaxed">
                By creating an account, you agree to our{" "}
                <button className="text-blue-400 hover:text-blue-300 transition-colors hover:underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button className="text-blue-400 hover:text-blue-300 transition-colors hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 relative z-10">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link
                href="/Signin"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors hover:underline"
              >
                Sign In Here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional subtle floating elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gradient-to-br from-purple-400/25 to-blue-400/25 rounded-full animate-pulse delay-2000"></div>
      </div>
    </div>
  );
}
