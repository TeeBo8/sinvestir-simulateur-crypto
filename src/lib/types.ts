/**
 * Types domaine du simulateur crypto.
 *
 * Volontairement découplés de l'UI et de la source de données : le moteur de
 * calcul ({@link ./simulation}) ne connaît que des séries de prix, jamais une
 * API. C'est ce qui rend la logique pure, testable et réutilisable/embarquable.
 */

/** Identifiant interne d'une crypto (les 8 majeures curatées de la démo). */
export type CryptoId = "BTC" | "ETH" | "SOL" | "BNB" | "XRP" | "ADA" | "DOGE" | "POL";

/** Fréquence d'investissement. `once` = one-shot, le reste = DCA. */
export type Frequency = "once" | "daily" | "weekly" | "monthly";

/** Un prix de clôture journalier, en euros. `date` au format ISO `YYYY-MM-DD`. */
export interface PricePoint {
  date: string;
  price: number;
}

/** Historique de prix bundlé/récupéré pour une crypto (toujours en EUR). */
export interface CryptoHistory {
  id: CryptoId;
  currency: "EUR";
  /** Provenance de la donnée (ex: "binance", "coingecko"). */
  source: string;
  /** Points triés par date croissante. */
  points: PricePoint[];
}

/** Métadonnées d'une crypto du catalogue. */
export interface Crypto {
  id: CryptoId;
  /** Nom complet, ex. "Bitcoin". */
  name: string;
  /** Ticker affiché, ex. "BTC". */
  symbol: string;
  /** Identifiant CoinGecko pour le rafraîchissement live. */
  coingeckoId: string;
  /**
   * Symbole(s) de paire Binance EUR utilisés pour générer le snapshot bundlé.
   * Plusieurs entrées = historique à raccorder (cas Polygon : MATICEUR → POLEUR).
   */
  binanceSymbols: string[];
}

/** Paramètres d'une simulation, tels que saisis par l'utilisateur. */
export interface SimulationParams {
  cryptoId: CryptoId;
  /**
   * Montant en euros. Pour `once`, c'est le montant total investi en une fois ;
   * pour le DCA, c'est le montant investi à *chaque* échéance.
   */
  amount: number;
  frequency: Frequency;
  /** Date de début de la période, `YYYY-MM-DD`. */
  startDate: string;
  /** Date de fin de la période, `YYYY-MM-DD`. */
  endDate: string;
}

/** Un point de la courbe de résultat (un par jour coté de la période). */
export interface SimulationPoint {
  date: string;
  /** Cumul investi jusqu'à cette date (courbe en escalier). */
  invested: number;
  /** Valeur du portefeuille à cette date. */
  value: number;
}

/** Résultat complet d'une simulation. */
export interface SimulationResult {
  /** Série pour le graphe (valeur vs investi dans le temps). */
  points: SimulationPoint[];
  /** Total réellement investi sur la période. */
  totalInvested: number;
  /** Valeur finale du portefeuille au dernier jour de la période. */
  finalValue: number;
  /** Plus/moins-value absolue en euros (`finalValue - totalInvested`). */
  profit: number;
  /** Plus/moins-value en pourcentage du capital investi. */
  profitPct: number;
  /** Quantité totale de crypto accumulée. */
  quantity: number;
  /** Nombre d'achats réellement effectués. */
  contributions: number;
  /** Bornes effectives utilisées (clampées à l'historique disponible). */
  startDate: string;
  endDate: string;
}
