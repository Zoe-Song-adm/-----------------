import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  type: z.enum(["IN", "OUT"]),
  note: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const records = await prisma.clockRecord.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const last = records[0];
    return jsonOk({ records, lastType: last?.type ?? null });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());
    const record = await prisma.clockRecord.create({
      data: {
        userId: session.id,
        type: body.type,
        note: body.note,
      },
    });
    return jsonOk({ record });
  } catch (e) {
    return handleApiError(e);
  }
}
