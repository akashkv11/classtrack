import Badge from "@/components/ui/badge";
import type { StatusBadgeConfig } from "@/lib/ui/status-badges";

type StatusBadgeProps = StatusBadgeConfig & {
  className?: string;
};

export default function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export function StatusBadgeFromConfig({
  status,
  className,
}: {
  status: StatusBadgeConfig;
  className?: string;
}) {
  return <StatusBadge {...status} className={className} />;
}
