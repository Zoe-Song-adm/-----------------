import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseImagePaths } from "@/lib/upload";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const where = status
      ? { status: status as "PENDING" | "APPROVED" | "REJECTED" }
      : {};

    const [repairs, leaves] = await Promise.all([
      prisma.repairRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, cohortYear: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.leaveRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, cohortYear: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      }),
    ]);

    return jsonOk({
      repairs: repairs.map((r) => ({
        ...r,
        images: parseImagePaths(r.imagePaths),
      })),
      leaves,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
