/**
 * Couche d'accès aux données de prix — stratégie **hybride** (le point technique
 * clé du projet, à raconter dans le README/Loom).
 *
 *   1. Snapshot bundlé (src/data/crypto-history/*.json) = base multi-années,
 *      commitée dans le repo → la démo fonctionne *toujours*, même hors-ligne,
 *      même si CoinGecko est en panne ou rate-limité.
 *   2. CoinGecko en *live* (best-effort) = rafraîchit les prix récents (≤365 j,
 *      limite du tier gratuit) par-dessus le snapshot → données à jour quand
 *      l'API répond.
 *   3. Toute erreur réseau/API → on sert le snapshot seul. Aucun crash possible.
 *
 * ⚠️ Module **serveur uniquement** : les snapshots (~650 Ko) ne doivent jamais
 *    partir dans le bundle client. Toujours appeler `getHistory` depuis un
 *    Server Component / Route Handler / Server Action.
 */
import type { CryptoHistory, CryptoId, PricePoint } from "./types";
import { CRYPTO_BY_ID } from "./cryptos";

import BTC from "@/data/crypto-history/BTC.json";
import ETH from "@/data/crypto-history/ETH.json";
import SOL from "@/data/crypto-history/SOL.json";
import BNB from "@/data/crypto-history/BNB.json";
import XRP from "@/data/crypto-history/XRP.json";
import ADA from "@/data/crypto-history/ADA.json";
import DOGE from "@/data/crypto-history/DOGE.json";
import POL from "@/data/crypto-history/POL.json";

const SNAPSHOTS = { BTC, ETH, SOL, BNB, XRP, ADA, DOGE, POL } as unknown as Record<
  CryptoId,
  CryptoHistory
>;

/** Durée de cache du fetch live CoinGecko (1 h) — ménage le rate-limit gratuit. */
const REVALIDATE_SECONDS = 3600;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Retourne le snapshot bundlé d'une crypto (toujours disponible). */
export function getSnapshot(id: CryptoId): CryptoHistory {
  return SNAPSHOTS[id];
}

/**
 * Récupère les prix récents (≤365 j, daily, EUR) via CoinGecko. Best-effort :
 * renvoie `null` en cas d'absence de clé non requise, d'erreur réseau, de
 * rate-limit ou de réponse inattendue — jamais d'exception propagée.
 */
async function fetchLivePrices(coingeckoId: string): Promise<PricePoint[] | null> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const url = `${COINGECKO_BASE}/coins/${coingeckoId}/market_chart?vs_currency=eur&days=365&interval=daily`;
  try {
    const res = await fetch(url, {
      headers: apiKey ? { "x-cg-demo-api-key": apiKey } : undefined,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const prices = (data as { prices?: [number, number][] }).prices;
    if (!Array.isArray(prices)) return null;
    // Déduplique par jour (l'API peut renvoyer un point intraday final).
    const byDate = new Map<string, number>();
    for (const [ms, price] of prices) {
      if (typeof ms === "number" && typeof price === "number" && price > 0) {
        byDate.set(new Date(ms).toISOString().slice(0, 10), price);
      }
    }
    return [...byDate.entries()].map(([date, price]) => ({ date, price }));
  } catch {
    return null;
  }
}

/**
 * Série de prix d'une crypto, snapshot rafraîchi par le live quand disponible.
 *
 * @returns Points journaliers EUR triés par date croissante (jamais vide pour
 *          un `id` valide, grâce au fallback bundlé).
 */
export async function getHistory(id: CryptoId): Promise<PricePoint[]> {
  const snapshot = getSnapshot(id);
  const live = await fetchLivePrices(CRYPTO_BY_ID[id].coingeckoId);
  if (!live || live.length === 0) return snapshot.points;

  // Superpose les prix live (récents) par-dessus la base bundlée.
  const byDate = new Map(snapshot.points.map((p) => [p.date, p.price]));
  for (const p of live) byDate.set(p.date, p.price);
  return [...byDate.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Indique si la stratégie live est configurée (clé présente). Pour le diagnostic. */
export function isLiveConfigured(): boolean {
  return Boolean(process.env.COINGECKO_API_KEY);
}
