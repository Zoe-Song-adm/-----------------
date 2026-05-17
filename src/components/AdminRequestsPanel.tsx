"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { StatusBadge } from "./StatusBadge";
import { formatProcessingMs } from "@/lib/status";
import type { RequestStatus } from "@prisma/client";

type UserInfo = {
  id: string;
  name: string;
  cohortYear: number;
  email: string;
};

type Repair = {
  id: string;
  description: string;
  images: string[];
  status: RequestStatus;
  adminComment: string | null;
  submittedAt: string;
  processedAt: string | null;
  processingMs: number | null;
  user: UserInfo;
};

type Leave = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: RequestStatus;
  adminComment: string | null;
  submittedAt: string;
  processedAt: string | null;
  processingMs: number | null;
  user: UserInfo;
};

export function AdminRequestsPanel() {
  const [filter, setFilter] = useState("PENDING");
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch(
      `/api/admin/requests${filter ? `?status=${filter}` : ""}`
    );
    const data = await res.json();
    setRepairs(data.repairs || []);
    setLeaves(data.leaves || []);
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function process(
    type: "repair" | "leave",
    id: string,
    status: "APPROVED" | "REJECTED"
  ) {
    const url =
      type === "repair"
        ? `/api/admin/requests/repair/${id}`
        : `/api/admin/requests/leave/${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        adminComment: comments[id] || undefined,
      }),
    });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error || "处理失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          { v: "PENDING", l: "待处理" },
          { v: "APPROVED", l: "已通过" },
          { v: "REJECTED", l: "已驳回" },
          { v: "", l: "全部" },
        ].map(({ v, l }) => (
          <button
            key={v || "all"}
            type="button"
            onClick={() => setFilter(v)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              filter === v
                ? "bg-brand-700 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">家具报修申请</h2>
        {repairs.length === 0 ? (
          <p className="text-sm text-stone-500">暂无记录</p>
        ) : (
          <ul className="space-y-4">
            {repairs.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-stone-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {r.user.name} · {r.user.cohortYear} 届
                    </p>
                    <p className="text-xs text-stone-500">{r.user.email}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-2 text-sm">{r.description}</p>
                {r.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {r.images.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noreferrer">
                        <img
                          src={src}
                          alt=""
                          className="h-20 w-20 rounded object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-stone-400">
                  提交于{" "}
                  {format(new Date(r.submittedAt), "yyyy-MM-dd HH:mm", {
                    locale: zhCN,
                  })}
                  {r.processingMs != null &&
                    ` · 处理用时 ${formatProcessingMs(r.processingMs)}`}
                </p>
                {r.adminComment && (
                  <p className="mt-2 text-sm text-stone-600">
                    批注：{r.adminComment}
                  </p>
                )}
                {r.status === "PENDING" && (
                  <div className="mt-3 space-y-2">
                    <input
                      className="input"
                      placeholder="批注（可选）"
                      value={comments[r.id] || ""}
                      onChange={(e) =>
                        setComments({ ...comments, [r.id]: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => process("repair", r.id, "APPROVED")}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => process("repair", r.id, "REJECTED")}
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">请假申请</h2>
        {leaves.length === 0 ? (
          <p className="text-sm text-stone-500">暂无记录</p>
        ) : (
          <ul className="space-y-4">
            {leaves.map((l) => (
              <li
                key={l.id}
                className="rounded-xl border border-stone-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {l.user.name} · {l.user.cohortYear} 届
                    </p>
                    <p className="text-xs text-stone-500">{l.user.email}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
                <p className="mt-2 text-sm">
                  {format(new Date(l.startAt), "yyyy-MM-dd HH:mm", {
                    locale: zhCN,
                  })}{" "}
                  至{" "}
                  {format(new Date(l.endAt), "yyyy-MM-dd HH:mm", {
                    locale: zhCN,
                  })}
                </p>
                <p className="text-sm text-stone-600">事由：{l.reason}</p>
                <p className="mt-1 text-xs text-stone-400">
                  提交于{" "}
                  {format(new Date(l.submittedAt), "yyyy-MM-dd HH:mm", {
                    locale: zhCN,
                  })}
                  {l.processingMs != null &&
                    ` · 处理用时 ${formatProcessingMs(l.processingMs)}`}
                </p>
                {l.adminComment && (
                  <p className="mt-2 text-sm text-stone-600">
                    批注：{l.adminComment}
                  </p>
                )}
                {l.status === "PENDING" && (
                  <div className="mt-3 space-y-2">
                    <input
                      className="input"
                      placeholder="批注（可选）"
                      value={comments[l.id] || ""}
                      onChange={(e) =>
                        setComments({ ...comments, [l.id]: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => process("leave", l.id, "APPROVED")}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => process("leave", l.id, "REJECTED")}
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
