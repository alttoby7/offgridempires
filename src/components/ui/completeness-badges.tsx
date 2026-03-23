const roles = [
  { key: "panels", label: "Panels" },
  { key: "controller", label: "Controller" },
  { key: "battery", label: "Battery" },
  { key: "inverter", label: "Inverter" },
  { key: "wiring", label: "Wiring" },
  { key: "mounting", label: "Mounting" },
  { key: "monitoring", label: "Monitor" },
] as const;

type RoleKey = (typeof roles)[number]["key"];

interface CompletenessBadgesProps {
  included: Record<string, boolean>;
  size?: "sm" | "md";
}

export function CompletenessBadges({
  included,
  size = "sm",
}: CompletenessBadgesProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  const iconSize = size === "sm" ? 8 : 10;

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => {
        const isIncluded = included[role.key] ?? false;
        return (
          <span
            key={role.key}
            className={`inline-flex items-center gap-0.5 rounded-sm font-mono font-medium ${padding} ${textSize} ${
              isIncluded
                ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                : "bg-[var(--danger)]/8 text-[var(--danger)]/70 border border-[var(--danger)]/15"
            }`}
          >
            {isIncluded ? (
              <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
            {role.label}
          </span>
        );
      })}
    </div>
  );
}
