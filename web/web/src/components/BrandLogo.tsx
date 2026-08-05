import { ArrowUpRight } from "lucide-react";

type BrandLogoProps = {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
};

export default function BrandLogo({
  tone = "dark",
  compact = false,
  className = "",
}: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo-${tone} ${compact ? "brand-logo-compact" : ""} ${className}`.trim()} aria-label="MilestoneX">
      <span className="brand-symbol" aria-hidden="true">
        <span>MX</span>
        <ArrowUpRight size={12} strokeWidth={2.6} />
      </span>
      {!compact && (
        <span className="brand-wordmark">
          Milestone<span>X</span>
        </span>
      )}
    </span>
  );
}
