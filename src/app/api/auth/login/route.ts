import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return jsonError("邮箱或密码错误", 401);
    }
    if (!user.isActive) return jsonError("账号已停用，请联系管理员", 403);

    await createSession(toSessionUser(user));
    return jsonOk({ user: toSessionUser(user) });
  } catch (e) {
    return handleApiError(e);
  }
}
