import Link from "next/link";
import type { ReactNode } from "react";
import { assetUrl, istExternerLink, sichererLink } from "@/lib/assets";

/**
 * Ein Link für alle Ziele aus den Inhalten.
 * - Interne Seiten laufen über next/link (kennt den Unterpfad).
 * - Interne Ziele mit Sprungmarke («/impressum/#bildnachweis») sind gewöhnliche Links mit Unterpfad.
 * - https-Links öffnen in einem neuen Fenster, mit rel="noopener noreferrer" und einem Hinweis für Screenreader.
 * - Nicht erlaubte Ziele (javascript:, data: usw.) werden zu «#».
 */
export function SmartLink({ ziel, className, children, onClick, ariaLabel, ariaCurrent, neuesFensterText = "öffnet in einem neuen Fenster", hrefLang }: { ziel: string; className?: string; children: ReactNode; onClick?: () => void; ariaLabel?: string; ariaCurrent?: "page"; neuesFensterText?: string; hrefLang?: string }) {
  const z = sichererLink(ziel);
  if (z.startsWith("#")) return <a href={z} className={className} onClick={onClick} aria-label={ariaLabel} hrefLang={hrefLang}>{children}</a>;
  if (istExternerLink(z)) {
    const neuesFenster = z.startsWith("https://");
    return (
      <a href={z} className={className} onClick={onClick} aria-label={ariaLabel} {...(neuesFenster ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {neuesFenster ? <span className="nur-sr"> ({neuesFensterText})</span> : null}
      </a>
    );
  }
  if (z.includes("#")) return <a href={assetUrl(z)} className={className} onClick={onClick} aria-label={ariaLabel} hrefLang={hrefLang} aria-current={ariaCurrent}>{children}</a>;
  return <Link href={z} className={className} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent} hrefLang={hrefLang}>{children}</Link>;
}
