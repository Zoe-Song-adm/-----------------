import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseImagePaths } from "@/lib/upload";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const cohortYear = searchParams.get("cohortYear");
    const includeInactive = searchParams.get("all") === "1";

    const users = await prisma.user.findMany({
      where: {
        role: "VOLUNTEER",
        ...(cohortYear ? { cohortYear: parseInt(cohortYear, 10) } : {}),
        ...(includeInactive ? {} : {}),
      },
      include: {
        profile: true,
        apartment: true,
        _count: {
          select: {
            clockRecords: true,
            workFiles: true,
            repairRequests: true,
            leaveRequests: true,
          },
        },
      },
      orderBy: [{ cohortYear: "desc" }, { name: "asc" }],
    });

    return jsonOk({
      volunteers: users.map((u) => ({
        ...u,
        apartment: u.apartment
          ? {
              ...u.apartment,
              images: parseImagePaths(u.apartment.imagePaths),
            }
          : null,
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
