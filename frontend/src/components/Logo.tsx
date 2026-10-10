import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  href?: string;
  className?: string;
}

export default function Logo({ size = "md", showTagline = false, href, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-base", tagline: "text-[7px]" },
    md: { icon: 36, text: "text-lg", tagline: "text-[8px]" },
    lg: { icon: 48, text: "text-2xl", tagline: "text-[10px]" },
  };

  const s = sizes[size];

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Compass Shield Icon */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 4L56 14V32C56 46 44 56 32 60C20 56 8 46 8 32V14L32 4Z" fill="#0B6E4F"/>
        <path d="M32 10L50 18V32C50 42 41 50 32 54C23 50 14 42 14 32V18L32 10Z" fill="#1B2A4A"/>
        <circle cx="32" cy="32" r="10" fill="none" stroke="#F59E0B" strokeWidth="2"/>
        <circle cx="32" cy="32" r="3" fill="#F59E0B"/>
        <line x1="32" y1="18" x2="32" y2="24" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="32" y1="40" x2="32" y2="46" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="32" x2="24" y2="32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
        <line x1="40" y1="32" x2="46" y2="32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
        <text x="32" y="20" textAnchor="middle" fill="#F59E0B" fontSize="6" fontWeight="700" fontFamily="Inter, sans-serif">N</text>
      </svg>
      <div className="flex flex-col">
        <span className={`${s.text} font-bold font-display leading-tight`}>
          <span className="text-[#1B2A4A]">School</span>
          <span className="text-[#0B6E4F]">Pilot</span>
        </span>
        {showTagline && (
          <span className={`${s.tagline} text-[var(--text-muted)] tracking-widest uppercase`}>
            Navigate Your School to Success
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
