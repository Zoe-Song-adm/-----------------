import { AdminVolunteersPanel } from "@/components/AdminVolunteersPanel";

export default function AdminVolunteersPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">志愿者档案</h1>
      <p className="mb-6 text-sm text-stone-500">
        历届志愿者完整信息，支持按届别筛选与查看工作文件
      </p>
      <AdminVolunteersPanel />
    </div>
  );
}
