import { telLink, telefonAnzeige } from "@/lib/assets";

/**
 * Telefonnummer als tel:-Link. Die Ziffern stehen in einem eigenen Links-nach-rechts-Lauf (<bdi dir="ltr">), damit sie auch auf der
 * arabischen Seite in der richtigen Reihenfolge erscheinen. Anzeige mit Landesvorwahl (international), weil die Website in sechs
 * Sprachen gelesen wird.
 */
export function Telefon({ nummer, className = "kontakt-link", international = true, label }: { nummer: string; className?: string; international?: boolean; label?: string }) {
  return (
    <a href={telLink(nummer)} className={className} aria-label={label ? `${label}: ${nummer}` : undefined}>
      <bdi dir="ltr" className="zahl">{international ? nummer : telefonAnzeige(nummer)}</bdi>
    </a>
  );
}

/** E-Mail-Adresse als mailto:-Link, ebenfalls als eigener Links-nach-rechts-Lauf. */
export function EMail({ adresse, className = "kontakt-link" }: { adresse: string; className?: string }) {
  return (
    <a href={`mailto:${adresse}`} className={className}>
      <bdi dir="ltr">{adresse}</bdi>
    </a>
  );
}
