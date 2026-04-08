import React from "react";

type LogoProps = { size?: number; className?: string };

const logos: Record<string, React.FC<LogoProps>> = {
  /* ─── MFS ─── */
  "bkash": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#E2136E" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">bKash</text>
    </svg>
  ),
  "nagad": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#F05829" />
      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="9" fontWeight="900" fontFamily="Arial">nagad</text>
    </svg>
  ),
  "rocket": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#8B2FC9" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">ROCKET</text>
    </svg>
  ),
  "upay": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#00A650" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">Upay</text>
    </svg>
  ),
  "surecash": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#1B3C6E" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="bold" fontFamily="Arial">SURE</text>
      <text x="20" y="31" textAnchor="middle" fill="#F0A500" fontSize="6.5" fontWeight="bold" fontFamily="Arial">CASH</text>
    </svg>
  ),
  "mycash": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#009444" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">My</text>
      <text x="20" y="31" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">Cash</text>
    </svg>
  ),
  "ok wallet": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#FF6B00" />
      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" fontFamily="Arial">OK</text>
    </svg>
  ),

  /* ─── BANKS ─── */
  "dbbl": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#C41E3A" />
      <text x="20" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">DUTCH</text>
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANGLA</text>
    </svg>
  ),
  "dutch-bangla": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#C41E3A" />
      <text x="20" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">DUTCH</text>
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANGLA</text>
    </svg>
  ),
  "brac bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#E11C1C" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">BRAC</text>
      <text x="20" y="31" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "city bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#003366" />
      <text x="20" y="22" textAnchor="middle" fill="#FFD700" fontSize="9" fontWeight="bold" fontFamily="Arial">CITY</text>
      <text x="20" y="31" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "dhaka bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#1A5276" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">DHAKA</text>
      <text x="20" y="31" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "ebl": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#00558C" />
      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">EBL</text>
    </svg>
  ),
  "eastern bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#00558C" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">EASTERN</text>
      <text x="20" y="31" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "islami bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#007A3D" />
      <text x="20" y="19" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">ISLAMI</text>
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANK BD</text>
    </svg>
  ),
  "southeast bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#00457C" />
      <text x="20" y="19" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">SOUTHEAST</text>
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "sonali bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#006837" />
      <text x="20" y="19" textAnchor="middle" fill="#FFD700" fontSize="7.5" fontWeight="bold" fontFamily="Arial">SONALI</text>
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "janata bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#003D8F" />
      <text x="20" y="19" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">JANATA</text>
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "prime bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#8B0000" />
      <text x="20" y="19" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">PRIME</text>
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "mtb": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#0F3460" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">MTB</text>
      <text x="20" y="31" textAnchor="middle" fill="#4FA3E0" fontSize="5" fontFamily="Arial">MUTUAL TRUST</text>
    </svg>
  ),
  "mutual trust bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#0F3460" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">MTB</text>
      <text x="20" y="31" textAnchor="middle" fill="#4FA3E0" fontSize="5" fontFamily="Arial">MUTUAL TRUST</text>
    </svg>
  ),
  "standard chartered": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#009B77" />
      <text x="20" y="19" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="Arial">STANDARD</text>
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="Arial">CHARTERED</text>
    </svg>
  ),
  "hsbc": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#DB0011" />
      <polygon points="4,4 20,20 4,36" fill="white" opacity="0.3" />
      <polygon points="36,4 20,20 36,36" fill="white" opacity="0.3" />
      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">HSBC</text>
    </svg>
  ),
  "bank asia": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#003F87" />
      <text x="20" y="20" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">BANK</text>
      <text x="20" y="30" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="bold" fontFamily="Arial">ASIA</text>
    </svg>
  ),
  "ab bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#C0392B" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">AB</text>
      <text x="20" y="31" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "one bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#1F618D" />
      <text x="20" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">ONE</text>
      <text x="20" y="30" textAnchor="middle" fill="white" fontSize="7" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "uttara bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#17202A" />
      <text x="20" y="20" textAnchor="middle" fill="#F0A500" fontSize="7" fontWeight="bold" fontFamily="Arial">UTTARA</text>
      <text x="20" y="30" textAnchor="middle" fill="white" fontSize="6.5" fontFamily="Arial">BANK</text>
    </svg>
  ),
  "nbl": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#1A237E" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">NBL</text>
      <text x="20" y="31" textAnchor="middle" fill="#90CAF9" fontSize="5" fontFamily="Arial">NATIONAL BANK</text>
    </svg>
  ),
  "national bank": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#1A237E" />
      <text x="20" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">NBL</text>
      <text x="20" y="31" textAnchor="middle" fill="#90CAF9" fontSize="5" fontFamily="Arial">NATIONAL BANK</text>
    </svg>
  ),

  /* ─── CARDS ─── */
  "visa": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#1A1F71" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="Arial" fontStyle="italic">VISA</text>
    </svg>
  ),
  "mastercard": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#252525" />
      <circle cx="15" cy="20" r="9" fill="#EB001B" />
      <circle cx="25" cy="20" r="9" fill="#F79E1B" />
      <ellipse cx="20" cy="20" rx="4" ry="9" fill="#FF5F00" />
    </svg>
  ),
  "amex": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#2E77BC" />
      <text x="20" y="21" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">AMERICAN</text>
      <text x="20" y="30" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">EXPRESS</text>
    </svg>
  ),
  "american express": ({ size = 40, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="10" fill="#2E77BC" />
      <text x="20" y="21" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">AMERICAN</text>
      <text x="20" y="30" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">EXPRESS</text>
    </svg>
  ),
};

function getLogoKey(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower.includes("bkash") || lower.includes("b-kash") || lower.includes("bikash")) return "bkash";
  if (lower.includes("nagad")) return "nagad";
  if (lower.includes("rocket") || lower.includes("dbbl mobile")) return "rocket";
  if (lower.includes("upay")) return "upay";
  if (lower.includes("surecash") || lower.includes("sure cash")) return "surecash";
  if (lower.includes("mycash") || lower.includes("my cash")) return "mycash";
  if (lower.includes("ok wallet") || lower.includes("ok money")) return "ok wallet";
  if (lower.includes("dutch") || lower.includes("dbbl")) return "dbbl";
  if (lower.includes("brac")) return "brac bank";
  if (lower.includes("city bank")) return "city bank";
  if (lower.includes("dhaka bank")) return "dhaka bank";
  if (lower.includes("ebl") || lower.includes("eastern bank")) return "ebl";
  if (lower.includes("islami")) return "islami bank";
  if (lower.includes("southeast")) return "southeast bank";
  if (lower.includes("sonali")) return "sonali bank";
  if (lower.includes("janata")) return "janata bank";
  if (lower.includes("prime bank")) return "prime bank";
  if (lower.includes("mtb") || lower.includes("mutual trust")) return "mtb";
  if (lower.includes("standard chartered")) return "standard chartered";
  if (lower.includes("hsbc")) return "hsbc";
  if (lower.includes("bank asia")) return "bank asia";
  if (lower.includes("ab bank")) return "ab bank";
  if (lower.includes("one bank")) return "one bank";
  if (lower.includes("uttara")) return "uttara bank";
  if (lower.includes("nbl") || lower.includes("national bank")) return "nbl";
  if (lower.includes("visa")) return "visa";
  if (lower.includes("mastercard") || lower.includes("master card")) return "mastercard";
  if (lower.includes("amex") || lower.includes("american express")) return "amex";
  return "";
}

function FallbackLogo({ name, size = 40, category = "" }: { name: string; size?: number; category?: string }) {
  const bg = category === "mfs" ? "#00A650" : category === "bank" ? "#003F87" : category === "card" ? "#1A1F71" : "#4B5563";
  const initials = name
    .split(/[\s-]+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect width="40" height="40" rx="10" fill={bg} />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">
        {initials}
      </text>
    </svg>
  );
}

export function PaymentMethodLogo({
  name,
  category = "",
  size = 40,
  className = "",
}: {
  name: string;
  category?: string;
  size?: number;
  className?: string;
}) {
  const key = getLogoKey(name);
  const Logo = logos[key];
  if (Logo) return <Logo size={size} className={className} />;
  return <FallbackLogo name={name} size={size} category={category} />;
}
