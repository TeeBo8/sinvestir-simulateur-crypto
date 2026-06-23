import type { CryptoId, Frequency, PricePoint } from "@/lib/types";

/** Options de fréquence affichées dans le segmented control. */
export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "once", label: "Une fois" },
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdo" },
  { value: "monthly", label: "Mensuel" },
];

/** Forme de la réponse de `GET /api/history/[id]`. */
export interface HistoryResponse {
  id: CryptoId;
  name: string;
  currency: "EUR";
  /** `true` si les prix ont été rafraîchis en live (CoinGecko), `false` si fallback bundlé. */
  live: boolean;
  points: PricePoint[];
}
