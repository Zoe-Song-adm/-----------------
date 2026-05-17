"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import { Home, Wrench, CalendarOff } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatProcessingMs } from "@/lib/status";
import type { RequestStatus } from "@prisma/client";

type Apartment = {
  address: string;
  frontDeskPhone: string;
  images: string[];
};

type Repair = {
  id: string;
  description: string;
  images: string[];
  status: RequestStatus;
  adminComment: string | null;
  submittedAt: string;
  processingMs: number | null;
};

type Leave = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: RequestStatus;
  adminComment: string | null;
  submittedAt: string;
  processingMs: number | null;
};

export function LifePanel() {
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startAt: "",
    endAt: "",
    reason: "",
  });

  async function load() {
    const [aptRes, repairRes, leaveRes] = await Promise.all([
      fetch("/api/life/apartment"),
      fetch("/api/life/repair"),
      fetch("/api/life/leave"),
    ]);
    setApartment((await aptRes.json()).apartment);
    setRepairs((await repairRes.json()).requests || []);
    setLeaves((await leaveRes.json()).requests || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveApartment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/life/apartment", {
      method: "POST",
      body: new FormData(e.currentTarget),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "保存失败");
      return;
    }
    setMsg("公寓信息已保存");
    setApartment(data.apartment);
  }

  async function submitRepair(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/life/repair", {
      method: "POST",
      body: new FormData(e.currentTarget),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "提交失败");
      return;
    }
    setMsg("报修申请已提交");
    e.currentTarget.reset();
    load();
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/life/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leaveForm),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "提交失败");
      return;
    }
    setMsg("请假申请已提交");
    setLeaveForm({ startAt: "", endAt: "", reason: "" });
    load();
  }

  return (
    <div className="space-y-8">
      {msg && (
        <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-800">
          {msg}
        </p>
      )}

      <section className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Home className="h-5 w-5 text-brand-700" />
          住宿公寓信息
        </h2>
        {apartment && (
          <div className="mb-4 rounded-lg bg-stone-50 p-4 text-sm">
            <p>
              <strong>地址：</strong>
              {apartment.address}
            </p>
            <p className="mt-1">
              <strong>前台电话：</strong>
              {apartment.frontDeskPhone}
            </p>
            {apartment.images?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {apartment.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt="公寓"
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <form onSubmit={saveApartment} className="space-y-3">
          <div>
            <label className="label">公寓地址</label>
            <input
              name="address"
              className="input"
              required
              defaultValue={apartment?.address}
            />
          </div>
          <div>
            <label className="label">前台管理电话</label>
            <input
              name="frontDeskPhone"
              className="input"
              required
              defaultValue={apartment?.frontDeskPhone}
            />
          </div>
          <div>
            <label className="label">公寓照片（可多选）</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            保存公寓信息
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Wrench className="h-5 w-5 text-brand-700" />
          家具损坏报修
        </h2>
        <form onSubmit={submitRepair} className="space-y-3">
          <div>
            <label className="label">损坏说明</label>
            <textarea
              name="description"
              className="input min-h-[100px]"
              required
              minLength={5}
              placeholder="请描述损坏的家具、位置与程度"
            />
          </div>
          <div>
            <label className="label">现场照片</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            提交报修
          </button>
        </form>
        <RequestList
          title="我的报修记录"
          items={repairs.map((r) => ({
            id: r.id,
            status: r.status,
            adminComment: r.adminComment,
            processingMs: r.processingMs,
            submittedAt: r.submittedAt,
            summary: r.description,
            images: r.images,
          }))}
        />
      </section>

      <section className="card">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CalendarOff className="h-5 w-5 text-brand-700" />
          请假申请
        </h2>
        <form onSubmit={submitLeave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">开始时间</label>
              <input
                type="datetime-local"
                className="input"
                required
                value={leaveForm.startAt}
                onChange={(e) =>
                  setLeaveForm({ ...leaveForm, startAt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">结束时间</label>
              <input
                type="datetime-local"
                className="input"
                required
                value={leaveForm.endAt}
                onChange={(e) =>
                  setLeaveForm({ ...leaveForm, endAt: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">请假事由</label>
            <textarea
              className="input min-h-[80px]"
              required
              value={leaveForm.reason}
              onChange={(e) =>
                setLeaveForm({ ...leaveForm, reason: e.target.value })
              }
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            提交请假
          </button>
        </form>
        <RequestList
          title="我的请假记录"
          items={leaves.map((l) => ({
            id: l.id,
            status: l.status,
            adminComment: l.adminComment,
            processingMs: l.processingMs,
            submittedAt: l.submittedAt,
            summary: `${format(new Date(l.startAt), "yyyy-MM-dd HH:mm", { locale: zhCN })} 至 ${format(new Date(l.endAt), "yyyy-MM-dd HH:mm", { locale: zhCN })} · ${l.reason}`,
          }))}
        />
      </section>
    </div>
  );
}

function RequestList({
  title,
  items,
}: {
  title: string;
  items: {
    id: string;
    status: RequestStatus;
    adminComment: string | null;
    processingMs: number | null;
    submittedAt: string;
    summary: string;
    images?: string[];
  }[];
}) {
  if (!items.length) return null;
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-medium text-stone-600">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-stone-200 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={item.status} />
              {item.status !== "PENDING" && (
                <span className="text-xs text-stone-500">
                  处理用时：{formatProcessingMs(item.processingMs)}
                </span>
              )}
            </div>
            <p className="mt-2 text-stone-800">{item.summary}</p>
            {item.adminComment && (
              <p className="mt-1 text-stone-600">
                <strong>批注：</strong>
                {item.adminComment}
              </p>
            )}
            {item.images && item.images.length > 0 && (
              <div className="mt-2 flex gap-2">
                {item.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-16 w-16 rounded object-cover"
                  />
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-stone-400">
              提交于{" "}
              {format(new Date(item.submittedAt), "yyyy-MM-dd HH:mm", {
                locale: zhCN,
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
