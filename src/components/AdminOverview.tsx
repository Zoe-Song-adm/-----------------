"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Wrench, CalendarOff } from "lucide-react";

type Stats = {
  volunteerCount: number;
  pendingRepair: number;
  pendingLeave: number;
  cohorts: { year: number; count: number }[];
};

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <p className="text-stone-500">加载中…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="志愿者总数"
          value={stats.volunteerCount}
          href="/admin/volunteers"
        />
        <StatCard
          icon={Wrench}
          label="待处理报修"
          value={stats.pendingRepair}
          href="/admin/requests"
          highlight={stats.pendingRepair > 0}
        />
        <StatCard
          icon={CalendarOff}
          label="待处理请假"
          value={stats.pendingLeave}
          href="/admin/requests"
          highlight={stats.pendingLeave > 0}
        />
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">编年式届别统计</h2>
        <p className="mb-4 text-sm text-stone-500">
          系统永久保留历届志愿者档案，可按届别查阅完整记录。
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {stats.cohorts.map((c) => (
            <li
              key={c.year}
              className="rounded-xl bg-stone-50 px-4 py-3 text-center"
            >
              <p className="text-2xl font-bold text-brand-700">{c.count}</p>
              <p className="text-sm text-stone-600">{c.year} 届</p>
            </li>
          ))}
        </ul>
        {stats.cohorts.length === 0 && (
          <p className="text-sm text-stone-500">暂无志愿者注册</p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card block transition hover:shadow-md ${
        highlight ? "ring-2 ring-amber-400" : ""
      }`}
    >
      <Icon className="mb-2 h-6 w-6 text-brand-700" />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-stone-500">{label}</p>
    </Link>
  );
}