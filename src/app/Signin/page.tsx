"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Sparkles, LogIn, Star } from "lucide-react";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import toast from "react-hot-toast";

// creting a new google provider instance
const googleProvider = new GoogleAuthProvider();

const githubProvider = new GithubAuthProvider();

// Creating auth instance
const auth = getAuth(app);

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // triggers when user clicks on the submit button
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // calling the signInWithEmailAndPassword method from firebase auth
      const response = await signInWithEmailAndPassword(auth, email, password);
      setIsLoading(false);
    } catch (err) {
      toast.error("Sign in failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  // triggers when the user clicks on the Google sign-in button
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Google sign-in successful:", user);
      toast.success("Welcome to Baagdu via Google! 🎉");
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // triggers when the user clicks on the GitHub sign-in button
  const handleGithubSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      console.log("GitHub sign-in successful:", user);
      toast.success("Welcome to Baagdu via GitHub! 🎉");
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      toast.error("GitHub sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-400/30 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-400/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-ping delay-2000"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-red-400/25 rounded-full blur-3xl animate-bounce delay-500"
          style={{ animationDuration: "2.5s" }}
        ></div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <Star
              className="absolute text-white/40 animate-pulse"
              size={Math.random() * 12 + 6}
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Main form container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-6 transform hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-pink-300/50 to-transparent rounded-bl-3xl"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-orange-300/50 to-transparent rounded-tr-3xl"></div>

          {/* Logo/Brand section */}
          <div className="text-center mb-5 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 rounded-3xl mb-2 shadow-xl relative overflow-hidden">
              <Sparkles
                className="w-8 h-8 text-white animate-spin"
                style={{ animationDuration: "4s" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 bg-clip-text text-transparent mb-1 animate-pulse">
              Baagdu
            </h1>
            <p className="text-gray-600 text-sm font-medium">Welcome back!</p>
            <div className="w-12 h-1 bg-gradient-to-r from-pink-500 to-orange-500 mx-auto mt-1 rounded-full"></div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Email field */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1 group-focus-within:text-pink-600 transition-colors">
                📧 Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gradient-to-r from-pink-50 to-orange-50 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 transition-all duration-300 font-medium shadow-inner text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-700 mb-1 group-focus-within:text-pink-600 transition-colors">
                🔒 Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-pink-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-gradient-to-r from-pink-50 to-orange-50 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 transition-all duration-300 font-medium shadow-inner text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors p-1 rounded-lg hover:bg-pink-100"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-pink-500 border-2 border-gray-300 rounded focus:ring-pink-400 focus:ring-2"
                />
                <span className="ml-2 text-gray-600 text-xs font-medium">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 text-white font-bold rounded-2xl shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="w-4 h-4 mr-2 animate-pulse" />
                  Sign In to Baagdu! 🚀
                </div>
              )}

              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium text-xs">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Auth Buttons - Single Line */}
            <div className="grid grid-cols-2 gap-3">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="py-2.5 px-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-2xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm">Google</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>

              {/* GitHub Sign In */}
              <button
                type="button"
                onClick={handleGithubSignIn}
                disabled={isLoading}
                className="py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-sm">GitHub</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-gray-600 text-xs font-medium">
              Don't have an account?{" "}
              <button className="text-pink-600 hover:text-pink-700 font-bold transition-colors hover:underline">
                <Link href="/Signup">Create Account!</Link>
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-2 text-center">
            <p className="text-gray-500 text-xs">
              By signing in, you agree to our{" "}
              <button className="text-pink-500 hover:text-pink-600 transition-colors hover:underline font-medium">
                Terms
              </button>{" "}
              and{" "}
              <button className="text-pink-500 hover:text-pink-600 transition-colors hover:underline font-medium">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>

        {/* Additional floating elements */}
        <div
          className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full animate-bounce shadow-lg"
          style={{ animationDuration: "2s" }}
        ></div>
        <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-gradient-to-br from-yellow-400 to-red-400 rounded-full animate-ping shadow-lg"></div>
        <div className="absolute top-1/2 -right-1 w-3 h-3 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full animate-pulse shadow-lg"></div>
      </div>
    </div>
  );
}
