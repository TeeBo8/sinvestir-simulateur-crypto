/** Helpers de formatage (locale fr-FR), partagés par l'UI du simulateur. */

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Formate un montant en euros, ex. `1 477 526,79 €`. */
export function formatEUR(value: number): string {
  return eur.format(value);
}

/** Version compacte pour les axes/graphes, ex. `1,5 M €`. */
export function formatEURCompact(value: number): string {
  return eurCompact.format(value);
}

/** Formate un pourcentage signé, ex. `+68,4 %` / `-12,0 %`. */
export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

/** Formate une quantité de crypto (précision adaptée aux petites valeurs). */
export function formatQuantity(value: number): string {
  const digits = value >= 1 ? 4 : 8;
  return value.toLocaleString("fr-FR", { maximumFractionDigits: digits });
}

/** Formate une date ISO `YYYY-MM-DD` en `MM/AAAA` (axes). */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-");
  return `${m}/${y}`;
}

/** Formate une date ISO en `JJ/MM/AAAA` (tooltips). */
export function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
