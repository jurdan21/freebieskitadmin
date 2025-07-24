"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadCaptchaEnginge(6);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validasi captcha
    const userCaptcha = captchaInputRef.current?.value || "";
    if (!validateCaptcha(userCaptcha)) {
      setError("Captcha salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }
    // Query user by email
    const { data: users, error: supaError } = await supabase
      .from("users")
      .select("id, email, password, is_active, name, role")
      .eq("email", email)
      .limit(1);
    if (supaError) {
      setError("Server error. Please try again.");
      setLoading(false);
      return;
    }
    if (!users || users.length === 0) {
      setError("User not found.");
      setLoading(false);
      return;
    }
    const user = users[0];
    if (!user.is_active) {
      setError("User is not active.");
      setLoading(false);
      return;
    }
    if (user.password !== password) {
      setError("Incorrect password.");
      setLoading(false);
      return;
    }
    localStorage.setItem("user", JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role }));
    setLoading(false);
    router.push("/admin/master-categories");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Captcha</label>
          <div className="flex flex-col gap-2">
            <LoadCanvasTemplate />
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              ref={captchaInputRef}
              required
              placeholder="Masukkan captcha di atas"
            />
          </div>
        </div>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2 rounded-lg transition"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
} 