import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, toSessionUser } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(8, "密码至少8位"),
  name: z.string().min(2, "请输入姓名"),
  cohortYear: z.coerce.number().int().min(2000).max(2100),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const exists = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (exists) return jsonError("该邮箱已注册", 409);

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        name: body.name,
        cohortYear: body.cohortYear,
        role: "VOLUNTEER",
        profile: { create: {} },
      },
    });

    await createSession(toSessionUser(user));
    return jsonOk({ user: toSessionUser(user) });
  } catch (e) {
    return handleApiError(e);
  }
}
