"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { Clock, Upload, LogIn, LogOut } from "lucide-react";

type ClockRecord = {
  id: string;
  type: string;
  note: string | null;
  createdAt: string;
};

type WorkFile = {
  id: string;
  originalName: string;
  url: string;
  description: string | null;
  createdAt: string;
};

export function WorkPanel() {
  const [records, setRecords] = useState<ClockRecord[]>([]);
  const [lastType, setLastType] = useState<string | null>(null);
  const [files, setFiles] = useState<WorkFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [fileDesc, setFileDesc] = useState("");

  async function load() {
    const [clockRes, filesRes] = await Promise.all([
      fetch("/api/work/clock"),
      fetch("/api/work/files"),
    ]);
    const clock = await clockRes.json();
    const fileData = await filesRes.json();
    setRecords(clock.records || []);
    setLastType(clock.lastType);
    setFiles(fileData.files || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function punch(type: "IN" | "OUT") {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/work/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "打卡失败");
      return;
    }
    setMsg(type === "IN" ? "上班打卡成功" : "下班打卡成功");
    load();
  }

  async function uploadFile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!fd.get("file")) {
      setMsg("请选择文件");
      return;
    }
    if (fileDesc) fd.set("description", fileDesc);
    setLoading(true);
    const res = await fetch("/api/work/files", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "上传失败");
      return;
    }
    setMsg("文件上传成功");
    setFileDesc("");
    form.reset();
    load();
  }

  return (
    <div className="space-y-8">
      <section className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5 text-brand-700" />
          上班打卡
        </h2>
        <p className="mb-4 text-sm text-stone-500">
          上次记录：
          {lastType === "IN"
            ? "已上班"
            : lastType === "OUT"
              ? "已下班"
              : "暂无"}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={() => punch("IN")}
          >
            <LogIn className="h-4 w-4" />
            上班打卡
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => punch("OUT")}
          >
            <LogOut className="h-4 w-4" />
            下班打卡
          </button>
        </div>
        {msg && (
          <p className="mt-3 text-sm text-brand-700">{msg}</p>
        )}
        <ul className="mt-6 divide-y divide-stone-100">
          {records.slice(0, 10).map((r) => (
            <li key={r.id} className="flex justify-between py-2 text-sm">
              <span>
                {r.type === "IN" ? "上班" : "下班"}
                {r.note && ` · ${r.note}`}
              </span>
              <span className="text-stone-500">
                {format(new Date(r.createdAt), "yyyy-MM-dd HH:mm", {
                  locale: zhCN,
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Upload className="h-5 w-5 text-brand-700" />
          工作文件
        </h2>
        <form onSubmit={uploadFile} className="space-y-3">
          <input
            type="file"
            name="file"
            className="input"
            required
          />
          <input
            className="input"
            placeholder="文件说明（可选）"
            value={fileDesc}
            onChange={(e) => setFileDesc(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            上传文件
          </button>
        </form>
        <ul className="mt-6 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
            >
              <span>
                {f.originalName}
                {f.description && (
                  <span className="text-stone-500"> · {f.description}</span>
                )}
              </span>
              <a
                className="text-brand-700 hover:underline"
                href={f.url}
                target="_blank"
                rel="noreferrer"
              >
                下载
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
