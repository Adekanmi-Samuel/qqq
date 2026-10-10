interface WheelIconProps {
  size?: number;
  variant?: "light" | "dark";
  className?: string;
}

export default function WheelIcon({ size = 38, variant = "light", className = "" }: WheelIconProps) {
  const stroke = variant === "light" ? "#ffffff" : "#0B6E6E";
  const gold = "#C8892A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 84 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring */}
      <circle cx="42" cy="42" r="36" stroke={stroke} strokeWidth="2.5" />
      {/* Inner hub */}
      <circle cx="42" cy="42" r="11" stroke={stroke} strokeWidth="2" />
      {/* Gold center */}
      <circle cx="42" cy="42" r="7" fill={gold} />
      <circle cx="42" cy="42" r="2.5" fill={stroke} />
      {/* Main spokes (4) */}
      <line x1="42" y1="6" x2="42" y2="30" stroke={stroke} strokeWidth="2" />
      <circle cx="42" cy="5" r="3.5" fill={stroke} />
      <line x1="42" y1="54" x2="42" y2="78" stroke={stroke} strokeWidth="2" />
      <circle cx="42" cy="79" r="3.5" fill={stroke} />
      <line x1="6" y1="42" x2="30" y2="42" stroke={stroke} strokeWidth="2" />
      <circle cx="5" cy="42" r="3.5" fill={stroke} />
      <line x1="54" y1="42" x2="78" y2="42" stroke={stroke} strokeWidth="2" />
      <circle cx="79" cy="42" r="3.5" fill={stroke} />
      {/* Diagonal spokes (4) */}
      <line x1="16.6" y1="16.6" x2="31.2" y2="31.2" stroke={stroke} strokeWidth="1.5" />
      <circle cx="15" cy="15" r="2.5" fill={stroke} />
      <line x1="52.8" y1="52.8" x2="67.4" y2="67.4" stroke={stroke} strokeWidth="1.5" />
      <circle cx="69" cy="69" r="2.5" fill={stroke} />
      <line x1="67.4" y1="16.6" x2="52.8" y2="31.2" stroke={stroke} strokeWidth="1.5" />
      <circle cx="69" cy="15" r="2.5" fill={stroke} />
      <line x1="31.2" y1="52.8" x2="16.6" y2="67.4" stroke={stroke} strokeWidth="1.5" />
      <circle cx="15" cy="69" r="2.5" fill={stroke} />
    </svg>
  );
}
