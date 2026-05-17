import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Briefcase, Home, Users, Calendar } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/dashboard/work");
  }

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-stone-900 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(251,191,36,0.15) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="mb-3 text-sm font-medium tracking-widest text-gold-400 uppercase">
            Colegio Peruano Chino San Min
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            秘鲁中华三民联校
            <br />
            志愿者管理系统
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-red-100">
            编年式档案管理 · 工作打卡与文件 · 生活住宿与报修 · 请假审批
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary bg-white text-brand-800 hover:bg-red-50"
            >
              志愿者注册
            </Link>
            <Link
              href="/login"
              className="btn-secondary border-white/30 text-white hover:bg-white/10"
            >
              登录
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Briefcase,
            title: "工作",
            desc: "上班打卡、工作文件上传与归档",
          },
          {
            icon: Home,
            title: "生活",
            desc: "公寓信息、家具报修、请假申请",
          },
          {
            icon: Users,
            title: "个人信息",
            desc: "生日、任期、护照、院校等档案",
          },
          {
            icon: Calendar,
            title: "编年管理",
            desc: "按届别留存历届志愿者完整记录",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card text-center">
            <Icon className="mx-auto mb-3 h-8 w-8 text-brand-700" />
            <h3 className="font-semibold text-stone-900">{title}</h3>
            <p className="mt-2 text-sm text-stone-500">{desc}</p>
          </div>
        ))}
      </div>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} 秘鲁中华三民联校 · 志愿者管理平台
      </footer>
    </div>
  );
}
