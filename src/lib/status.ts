import type { RequestStatus } from "@prisma/client";

export const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "待处理",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

export function formatProcessingMs(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 60000) return `${Math.round(ms / 1000)} 秒`;
  if (ms < 3600000) return `${Math.round(ms / 60000)} 分钟`;
  return `${(ms / 3600000).toFixed(1)} 小时`;
}
