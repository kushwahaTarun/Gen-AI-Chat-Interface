"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap, Star } from "lucide-react";
import toast from "react-hot-toast";

import { app } from "@/lib/firebase";

// creating a Firebase auth instance
const auth = getAuth(app);
// const auth = getAuth(app);

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
            <p className="text-gray-600 text-sm font-medium">
              Create your journey
            </p>
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
                  placeholder="Create strong password"
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
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Join Baagdu Now! 🚀
                </div>
              )}

              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-gray-600 text-xs font-medium">
              Already have an account?{" "}
              <button className="text-pink-600 hover:text-pink-700 font-bold transition-colors hover:underline">
                <Link href="/Signin">Sign In Here!</Link>
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-2 text-center">
            <p className="text-gray-500 text-xs">
              By joining, you agree to our{" "}
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
