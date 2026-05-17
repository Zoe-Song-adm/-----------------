"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    cohortYear: new Date().getFullYear(),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email: form.email, password: form.password }
        : form;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "操作失败");
      return;
    }

    const dest =
      data.user.role === "ADMIN" ? "/admin" : "/dashboard/work";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card">
        <h2 className="mb-6 text-center text-2xl font-bold text-stone-900">
          {mode === "login" ? "登录" : "志愿者注册"}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="label">姓名</label>
                <input
                  className="input"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">届别（派出年份）</label>
                <input
                  type="number"
                  className="input"
                  required
                  min={2000}
                  max={2100}
                  value={form.cohortYear}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cohortYear: parseInt(e.target.value, 10),
                    })
                  }
                />
                <p className="mt-1 text-xs text-stone-500">
                  请选择您所属的志愿者批次年份，便于编年式管理
                </p>
              </div>
            </>
          )}
          <div>
            <label className="label">邮箱</label>
            <input
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">密码</label>
            <input
              type="password"
              className="input"
              required
              minLength={8}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "请稍候…" : mode === "login" ? "登录" : "注册"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          {mode === "login" ? (
            <>
              还没有账号？{" "}
              <Link href="/register" className="text-brand-700 hover:underline">
                注册
              </Link>
            </>
          ) : (
            <>
              已有账号？{" "}
              <Link href="/login" className="text-brand-700 hover:underline">
                登录
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}