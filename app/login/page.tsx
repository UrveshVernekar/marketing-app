// Updated Login Page - Compact & Scrollbar-Free

"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      {/* BACKGROUND PATTERN */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f630_1px,transparent_1px)] bg-[length:20px_20px] dark:bg-[radial-gradient(#3b82f610_1px,transparent_1px)]" />

      <div className="relative w-full max-w-md">
        <Card className="border border-white/60 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">

          {/* IFB LOGO */}
          <div className="flex flex-col items-center pt-8 pb-2">
            <div className="relative w-36 h-12 mb-3">
              <Image
                src="/images/IFB.png"
                alt="IFB Logo"
                fill
                className="object-contain dark:invert"
                priority
              />
            </div>
          </div>

          <CardHeader className="text-center pb-3">
            <CardTitle className="text-3xl font-semibold tracking-tight">Sign In</CardTitle>
            <CardDescription className="text-base mt-1.5">
              Sign in to access the Marketing Dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ifbglobal.com"
                    className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                  {/* <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link> */}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 text-base font-semibold rounded-2xl mt-3 shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all active:scale-[0.985]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}