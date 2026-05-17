"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Home,
  User,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

type Props = {
  role: "VOLUNTEER" | "ADMIN";
  name: string;
  cohortYear: number;
};

export function Nav({ role, name, cohortYear }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const volunteerLinks = [
    { href: "/dashboard/work", label: "工作", icon: Briefcase },
    { href: "/dashboard/life", label: "生活", icon: Home },
    { href: "/dashboard/profile", label: "个人信息", icon: User },
  ];

  const adminLinks = [
    { href: "/admin", label: "总览", icon: LayoutDashboard },
    { href: "/admin/volunteers", label: "志愿者档案", icon: Users },
    { href: "/admin/requests", label: "申请处理", icon: Briefcase },
  ];

  const links = role === "ADMIN" ? adminLinks : volunteerLinks;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
            秘鲁中华三民联校
          </p>
          <h1 className="text-lg font-semibold text-stone-900">
            志愿者管理系统
          </h1>
          <p className="text-xs text-stone-500">
            {name} · {cohortYear} 届
            {role === "ADMIN" && " · 管理员"}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-700 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="ml-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-stone-500 hover:bg-stone-100"
          >
            <LogOut className="h-4 w-4" />
            退出
          </button>
        </nav>
      </div>
    </header>
  );
}
