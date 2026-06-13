import type { TaskStatus } from "@shared/types";
import { statusLabel, statusColor } from "@/utils/format";

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge ${statusColor[status]}`}>
      {statusLabel[status]}
    </span>
  );
}
