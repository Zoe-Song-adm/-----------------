"use client";

import { useEffect, useState } from "react";
function toInputDate(d: string | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function ProfilePanel() {
  const [form, setForm] = useState({
    birthday: "",
    termStart: "",
    termEnd: "",
    passportNo: "",
    dispatchUniversity: "",
    teachingSchool: "",
    spanishName: "",
    phone: "",
  });
  const [user, setUser] = useState<{
    name: string;
    email: string;
    cohortYear: number;
  } | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        if (data.profile) {
          setForm({
            birthday: toInputDate(data.profile.birthday),
            termStart: toInputDate(data.profile.termStart),
            termEnd: toInputDate(data.profile.termEnd),
            passportNo: data.profile.passportNo || "",
            dispatchUniversity: data.profile.dispatchUniversity || "",
            teachingSchool: data.profile.teachingSchool || "",
            spanishName: data.profile.spanishName || "",
            phone: data.profile.phone || "",
          });
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "保存失败");
      return;
    }
    setMsg("个人信息已保存");
  }

  return (
    <div className="card max-w-2xl">
      <h2 className="mb-2 text-lg font-semibold">志愿者个人信息</h2>
      {user && (
        <p className="mb-6 text-sm text-stone-500">
          {user.name} · {user.email} · {user.cohortYear} 届
        </p>
      )}
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">生日</label>
          <input
            type="date"
            className="input"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
          />
        </div>
        <div>
          <label className="label">西语名</label>
          <input
            className="input"
            value={form.spanishName}
            onChange={(e) =>
              setForm({ ...form, spanishName: e.target.value })
            }
            placeholder="Nombre en español"
          />
        </div>
        <div>
          <label className="label">任期开始</label>
          <input
            type="date"
            className="input"
            value={form.termStart}
            onChange={(e) => setForm({ ...form, termStart: e.target.value })}
          />
        </div>
        <div>
          <label className="label">任期结束</label>
          <input
            type="date"
            className="input"
            value={form.termEnd}
            onChange={(e) => setForm({ ...form, termEnd: e.target.value })}
          />
        </div>
        <div>
          <label className="label">护照号</label>
          <input
            className="input"
            value={form.passportNo}
            onChange={(e) => setForm({ ...form, passportNo: e.target.value })}
          />
        </div>
        <div>
          <label className="label">联系电话</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">派出院校</label>
          <input
            className="input"
            value={form.dispatchUniversity}
            onChange={(e) =>
              setForm({ ...form, dispatchUniversity: e.target.value })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">任教学校</label>
          <input
            className="input"
            value={form.teachingSchool}
            onChange={(e) =>
              setForm({ ...form, teachingSchool: e.target.value })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            保存信息
          </button>
          {msg && <p className="mt-2 text-sm text-brand-700">{msg}</p>}
        </div>
      </form>
    </div>
  );
}
