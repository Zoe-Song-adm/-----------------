import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminComment: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    const existing = await prisma.repairRequest.findUnique({
      where: { id: params.id },
    });
    if (!existing) return jsonError("申请不存在", 404);
    if (existing.status !== "PENDING") {
      return jsonError("该申请已处理", 400);
    }

    const now = new Date();
    const processingMs = now.getTime() - existing.submittedAt.getTime();

    const updated = await prisma.repairRequest.update({
      where: { id: params.id },
      data: {
        status: body.status,
        adminComment: body.adminComment || null,
        processedAt: now,
        processingMs,
      },
    });
    return jsonOk({ request: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
