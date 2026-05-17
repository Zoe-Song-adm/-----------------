import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

const schema = z.object({
  birthday: z.string().optional(),
  termStart: z.string().optional(),
  termEnd: z.string().optional(),
  passportNo: z.string().optional(),
  dispatchUniversity: z.string().optional(),
  teachingSchool: z.string().optional(),
  spanishName: z.string().optional(),
  phone: z.string().optional(),
});

function parseDate(s?: string) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  try {
    const session = await requireSession();
    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId: session.id },
    });
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        name: true,
        email: true,
        cohortYear: true,
        createdAt: true,
      },
    });
    return jsonOk({ profile, user });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());

    const profile = await prisma.volunteerProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        birthday: parseDate(body.birthday),
        termStart: parseDate(body.termStart),
        termEnd: parseDate(body.termEnd),
        passportNo: body.passportNo || null,
        dispatchUniversity: body.dispatchUniversity || null,
        teachingSchool: body.teachingSchool || null,
        spanishName: body.spanishName || null,
        phone: body.phone || null,
      },
      update: {
        birthday: parseDate(body.birthday),
        termStart: parseDate(body.termStart),
        termEnd: parseDate(body.termEnd),
        passportNo: body.passportNo || null,
        dispatchUniversity: body.dispatchUniversity || null,
        teachingSchool: body.teachingSchool || null,
        spanishName: body.spanishName || null,
        phone: body.phone || null,
      },
    });
    return jsonOk({ profile });
  } catch (e) {
    return handleApiError(e);
  }
}
