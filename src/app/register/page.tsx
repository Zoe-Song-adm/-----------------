import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <p className="mb-8 text-center">
        <Link href="/" className="text-sm text-brand-700 hover:underline">
          ← 返回首页
        </Link>
      </p>
      <AuthForm mode="register" />
    </div>
  );
}
