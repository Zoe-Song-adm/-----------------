import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const [
      volunteerCount,
      pendingRepair,
      pendingLeave,
      cohorts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "VOLUNTEER" } }),
      prisma.repairRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.user.groupBy({
        by: ["cohortYear"],
        where: { role: "VOLUNTEER" },
        _count: true,
        orderBy: { cohortYear: "desc" },
      }),
    ]);
    return jsonOk({
      volunteerCount,
      pendingRepair,
      pendingLeave,
      cohorts: cohorts.map((c) => ({
        year: c.cohortYear,
        count: c._count,
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
