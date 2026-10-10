import WheelIcon from "@/components/WheelIcon";

interface SchoolLogoProps {
  /** Only rendered when the school has uploaded its own logo. */
  logoUrl?: string | null;
  /** School name used for alt text when a custom logo is shown. */
  schoolName?: string;
  size?: number;
  className?: string;
  /** Show the SchoolPilot wordmark next to the mark. */
  withWordmark?: boolean;
  variant?: "light" | "dark";
}

/**
 * SchoolPilot brand mark.
 * Always shows the normal SchoolPilot logo until a school uploads its own.
 * Never falls back to emoji, initials, or random avatars.
 */
export default function SchoolLogo({
  logoUrl,
  schoolName = "School",
  size = 36,
  className = "",
  withWordmark = false,
  variant = "light",
}: SchoolLogoProps) {
  const hasCustom = Boolean(logoUrl && logoUrl.trim().length > 0);

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ lineHeight: 0 }}
    >
      {hasCustom ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl as string}
          alt={`${schoolName} logo`}
          width={size}
          height={size}
          className="object-contain rounded-lg"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: size,
            height: size,
            borderRadius: Math.max(8, size * 0.22),
            background: "linear-gradient(135deg, #0b6e4f 0%, #12926a 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <WheelIcon size={Math.round(size * 0.62)} variant="light" />
        </span>
      )}
      {withWordmark && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: Math.max(14, size * 0.45),
            color: "var(--heading-color)",
            letterSpacing: "-0.02em",
          }}
        >
          SchoolPilot
        </span>
      )}
    </span>
  );
}
