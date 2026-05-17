import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().min(2, "请填写请假事由"),
});

export async function GET() {
  try {
    const session = await requireSession();
    const requests = await prisma.leaveRequest.findMany({
      where: { userId: session.id },
      orderBy: { submittedAt: "desc" },
    });
    return jsonOk({ requests });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return jsonError("时间格式无效");
    }
    if (endAt <= startAt) return jsonError("结束时间须晚于开始时间");

    const request = await prisma.leaveRequest.create({
      data: {
        userId: session.id,
        startAt,
        endAt,
        reason: body.reason,
      },
    });
    return jsonOk({ request });
  } catch (e) {
    return handleApiError(e);
  }
}
