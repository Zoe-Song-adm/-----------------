import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "VOLUNTEER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav
        role={session.role}
        name={session.name}
        cohortYear={session.cohortYear}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
