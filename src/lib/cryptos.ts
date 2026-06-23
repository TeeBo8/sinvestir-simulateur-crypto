import type { Crypto, CryptoId } from "./types";

/**
 * Catalogue curaté des 8 cryptos majeures de la démo.
 *
 * Le périmètre est volontairement restreint (démo propre et rapide). Le passage
 * à l'échelle = brancher la recherche CoinGecko (documenté dans le README).
 *
 * Cas particulier `POL` : Polygon a été rebrandé MATIC → POL (sept. 2024). On
 * raccorde donc l'historique des deux paires Binance (MATICEUR puis POLEUR,
 * conversion 1:1) pour une série continue.
 */
export const CRYPTOS: readonly Crypto[] = [
  { id: "BTC", name: "Bitcoin", symbol: "BTC", coingeckoId: "bitcoin", binanceSymbols: ["BTCEUR"] },
  { id: "ETH", name: "Ethereum", symbol: "ETH", coingeckoId: "ethereum", binanceSymbols: ["ETHEUR"] },
  { id: "SOL", name: "Solana", symbol: "SOL", coingeckoId: "solana", binanceSymbols: ["SOLEUR"] },
  { id: "BNB", name: "BNB", symbol: "BNB", coingeckoId: "binancecoin", binanceSymbols: ["BNBEUR"] },
  { id: "XRP", name: "XRP", symbol: "XRP", coingeckoId: "ripple", binanceSymbols: ["XRPEUR"] },
  { id: "ADA", name: "Cardano", symbol: "ADA", coingeckoId: "cardano", binanceSymbols: ["ADAEUR"] },
  { id: "DOGE", name: "Dogecoin", symbol: "DOGE", coingeckoId: "dogecoin", binanceSymbols: ["DOGEEUR"] },
  {
    id: "POL",
    name: "Polygon",
    symbol: "POL",
    coingeckoId: "polygon-ecosystem-token",
    binanceSymbols: ["MATICEUR", "POLEUR"],
  },
] as const;

/** Accès O(1) par identifiant. */
export const CRYPTO_BY_ID: Record<CryptoId, Crypto> = Object.fromEntries(
  CRYPTOS.map((c) => [c.id, c]),
) as Record<CryptoId, Crypto>;

/** Liste des identifiants supportés. */
export const CRYPTO_IDS = CRYPTOS.map((c) => c.id);

/** Garde de type : vérifie qu'une chaîne est un `CryptoId` connu. */
export function isCryptoId(value: string): value is CryptoId {
  return value in CRYPTO_BY_ID;
}
