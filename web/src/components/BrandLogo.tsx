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
    <span
      className={`brand-logo brand-logo-${tone} ${compact ? "brand-logo-compact" : ""} ${className}`.trim()}
      aria-label="MilestoneX"
    >
      <svg className="brand-symbol" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <path
          className="brand-stair"
          d="M7 37V29h9v-9h9v-9h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="brand-rise"
          d="M33 5h8v8"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle className="brand-node brand-node-one" cx="7" cy="37" r="3.6" />
        <circle className="brand-node brand-node-two" cx="16" cy="29" r="3.6" />
        <circle className="brand-node brand-node-three" cx="25" cy="20" r="3.6" />
      </svg>
      {!compact && (
        <span className="brand-wordmark">
          Milestone<span>X</span>
        </span>
      )}
    </span>
  );
}
