import { AdminRequestsPanel } from "@/components/AdminRequestsPanel";

export default function AdminRequestsPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-stone-900">申请处理</h1>
      <p className="mb-6 text-sm text-stone-500">
        处理报修与请假申请，可添加批注；系统自动记录处理用时
      </p>
      <AdminRequestsPanel />
    </div>
  );
}
