"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse, AuthResponse, User } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<ApiResponse<AuthResponse>>(
        "/api/auth/register",
        form
      );
      const { token } = res.data.data;

      const meRes = await api.get<ApiResponse<User>>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuth(meRes.data.data, token);
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sp-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-sp-green text-5xl">♪</span>
          <h1 className="text-white text-2xl font-bold mt-3">
            Tạo tài khoản EMusic
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-sp-surface rounded-lg p-8 space-y-4"
        >
          <div>
            <label className="text-sp-silver text-sm font-bold block mb-1">
              Tên người dùng
            </label>
            <input
              type="text"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              required
              className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
              placeholder="username"
              style={{
                boxShadow:
                  "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset",
              }}
            />
          </div>

          <div>
            <label className="text-sp-silver text-sm font-bold block mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
              placeholder="name@example.com"
              style={{
                boxShadow:
                  "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset",
              }}
            />
          </div>

          <div>
            <label className="text-sp-silver text-sm font-bold block mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full bg-sp-mid text-white rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white placeholder:text-sp-silver"
              placeholder="Ít nhất 8 ký tự"
              style={{
                boxShadow:
                  "rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset",
              }}
            />
          </div>

          {error && <p className="text-sp-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sp-green text-sp-black font-bold py-3 rounded-pill uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>

          <div className="h-px bg-sp-border" />

          <p className="text-center text-sp-silver text-sm">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-white underline underline-offset-2 hover:text-sp-green"
            >
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
