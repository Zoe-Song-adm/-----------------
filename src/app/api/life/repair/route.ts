import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import {
  parseImagePaths,
  saveUpload,
  stringifyImagePaths,
} from "@/lib/upload";
import { jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  description: z.string().min(5, "请详细描述损坏情况"),
});

export async function GET() {
  try {
    const session = await requireSession();
    const requests = await prisma.repairRequest.findMany({
      where: { userId: session.id },
      orderBy: { submittedAt: "desc" },
    });
    return jsonOk({
      requests: requests.map((r) => ({
        ...r,
        images: parseImagePaths(r.imagePaths),
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
    const description = form.get("description") as string;
    const body = schema.parse({ description });

    const images: string[] = [];
    const imageFiles = form.getAll("images") as File[];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const { relativePath } = await saveUpload(
          file,
          `repair/${session.id}`
        );
        images.push(relativePath);
      }
    }

    const request = await prisma.repairRequest.create({
      data: {
        userId: session.id,
        description: body.description,
        imagePaths: stringifyImagePaths(images),
      },
    });
    return jsonOk({
      request: { ...request, images },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
