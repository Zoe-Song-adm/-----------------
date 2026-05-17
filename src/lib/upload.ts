import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveUpload(
  file: File,
  subdir: string
): Promise<{ storedName: string; relativePath: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || "";
  const storedName = `${randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, storedName);
  await writeFile(fullPath, buffer);
  return {
    storedName,
    relativePath: `/api/files/${subdir}/${storedName}`,
  };
}

export function parseImagePaths(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function stringifyImagePaths(paths: string[]) {
  return JSON.stringify(paths);
}
