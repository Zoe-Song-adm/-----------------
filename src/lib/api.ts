import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(e: unknown) {
  if (e instanceof Error) {
    if (e.message === "UNAUTHORIZED") return jsonError("请先登录", 401);
    if (e.message === "FORBIDDEN") return jsonError("无权限", 403);
    return jsonError(e.message, 400);
  }
  return jsonError("服务器错误", 500);
}
