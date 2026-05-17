import type { RequestStatus } from "@prisma/client";
import { STATUS_LABEL } from "@/lib/status";

export function StatusBadge({ status }: { status: RequestStatus }) {
  const cls =
    status === "PENDING"
      ? "badge-pending"
      : status === "APPROVED"
        ? "badge-approved"
        : "badge-rejected";
  return <span className={cls}>{STATUS_LABEL[status]}</span>;
}
