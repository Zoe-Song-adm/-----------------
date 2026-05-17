import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/auth";
import { saveUpload } from "@/lib/upload";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      await requireAdmin();
      const files = await prisma.workFile.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, cohortYear: true } } },
      });
      return jsonOk({
        files: files.map((f) => ({
          ...f,
          url: `/api/files/work/${userId}/${f.storedName}`,
        })),
      });
    }

    const session = await requireSession();
    const files = await prisma.workFile.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({
      files: files.map((f) => ({
        ...f,
        url: `/api/files/work/${session.id}/${f.storedName}`,
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const description = (form.get("description") as string) || undefined;

    if (!file || file.size === 0) return jsonError("请选择文件");
    if (file.size > 10 * 1024 * 1024) return jsonError("文件不能超过10MB");

    const { storedName } = await saveUpload(file, `work/${session.id}`);

    const record = await prisma.workFile.create({
      data: {
        userId: session.id,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        description,
      },
    });
    return jsonOk({ file: record });
  } catch (e) {
    return handleApiError(e);
  }
}
