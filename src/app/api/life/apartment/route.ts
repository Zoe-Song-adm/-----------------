import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/auth";
import {
  parseImagePaths,
  saveUpload,
  stringifyImagePaths,
} from "@/lib/upload";
import { jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  address: z.string().min(1, "请填写地址"),
  frontDeskPhone: z.string().min(1, "请填写前台电话"),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      await requireAdmin();
      const apartment = await prisma.apartment.findUnique({
        where: { userId },
        include: { user: { select: { name: true, cohortYear: true } } },
      });
      return jsonOk({
        apartment: apartment
          ? { ...apartment, images: parseImagePaths(apartment.imagePaths) }
          : null,
      });
    }

    const session = await requireSession();
    const apartment = await prisma.apartment.findUnique({
      where: { userId: session.id },
    });
    return jsonOk({
      apartment: apartment
        ? { ...apartment, images: parseImagePaths(apartment.imagePaths) }
        : null,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const form = await req.formData();
    const address = form.get("address") as string;
    const frontDeskPhone = form.get("frontDeskPhone") as string;
    const body = schema.parse({ address, frontDeskPhone });

    const existing = await prisma.apartment.findUnique({
      where: { userId: session.id },
    });
    let images = existing ? parseImagePaths(existing.imagePaths) : [];

    const imageFiles = form.getAll("images") as File[];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const { relativePath } = await saveUpload(
          file,
          `apartment/${session.id}`
        );
        images.push(relativePath);
      }
    }

    const apartment = await prisma.apartment.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        address: body.address,
        frontDeskPhone: body.frontDeskPhone,
        imagePaths: stringifyImagePaths(images),
      },
      update: {
        address: body.address,
        frontDeskPhone: body.frontDeskPhone,
        imagePaths: stringifyImagePaths(images),
      },
    });

    return jsonOk({
      apartment: {
        ...apartment,
        images: parseImagePaths(apartment.imagePaths),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
