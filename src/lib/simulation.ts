import type {
  Frequency,
  PricePoint,
  SimulationParams,
  SimulationPoint,
  SimulationResult,
} from "./types";

/**
 * Moteur de simulation — logique de calcul **pure** (aucune dépendance UI ni
 * réseau). Elle prend une série de prix historiques + des paramètres, et rend
 * un résultat complet. C'est le composant le plus important du projet : il est
 * isolé pour être testable unitairement et réutilisable tel quel ailleurs.
 *
 * Hypothèses de calcul (sur données historiques) :
 *  - One-shot : `amount` investi une seule fois à la date de début.
 *  - DCA : `amount` investi à *chaque* échéance (quotidienne/hebdo/mensuelle),
 *    au prix de clôture du jour. Les quantités achetées se cumulent.
 *  - Valeur finale = quantité totale × prix au dernier jour de la période.
 */

// --- Helpers de date (sans dépendance externe, tout en UTC) -----------------

/** Parse une date `YYYY-MM-DD` en timestamp UTC (minuit). */
function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Formate un timestamp UTC en `YYYY-MM-DD`. */
function fromUTC(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

const DAY_MS = 86_400_000;

/** Ajoute `n` jours à une date ISO. */
export function addDays(date: string, n: number): string {
  return fromUTC(toUTC(date) + n * DAY_MS);
}

/**
 * Ajoute `n` mois à une date ISO, en clampant le jour du mois (ex. 31 janv.
 * + 1 mois → 28/29 févr.) pour rester sur une date valide.
 */
export function addMonths(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const daysInMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, daysInMonth));
  return target.toISOString().slice(0, 10);
}

/**
 * Énumère les dates d'échéance d'investissement dans `[start, end]` selon la
 * fréquence. Exportée pour être testée indépendamment.
 */
export function enumerateContributionDates(
  start: string,
  end: string,
  frequency: Frequency,
): string[] {
  if (start > end) return [];
  if (frequency === "once") return [start];

  const dates: string[] = [];
  let cursor = start;
  let step = 0;
  while (cursor <= end) {
    dates.push(cursor);
    step += 1;
    cursor =
      frequency === "daily"
        ? addDays(start, step)
        : frequency === "weekly"
          ? addDays(start, step * 7)
          : addMonths(start, step);
  }
  return dates;
}

// --- Recherche de prix ------------------------------------------------------

/**
 * Renvoie le dernier prix coté à une date <= `date` (jour coté le plus proche
 * en amont), ou `null` si la date précède tout l'historique. Recherche
 * dichotomique sur la série triée par date croissante.
 */
export function priceAtOrBefore(points: PricePoint[], date: string): number | null {
  let lo = 0;
  let hi = points.length - 1;
  let result: number | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].date <= date) {
      result = points[mid].price;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

// --- Moteur -----------------------------------------------------------------

function emptyResult(startDate: string, endDate: string): SimulationResult {
  return {
    points: [],
    totalInvested: 0,
    finalValue: 0,
    profit: 0,
    profitPct: 0,
    quantity: 0,
    contributions: 0,
    startDate,
    endDate,
  };
}

/**
 * Lance une simulation sur une série de prix historiques.
 *
 * @param params  Paramètres saisis (crypto, montant, fréquence, période).
 * @param history Série de prix journaliers EUR **triée par date croissante**.
 * @returns Le résultat complet (série pour le graphe + agrégats).
 */
export function runSimulation(
  params: SimulationParams,
  history: PricePoint[],
): SimulationResult {
  const { amount, frequency, startDate, endDate } = params;

  // Garde-fous : entrées invalides → résultat neutre plutôt qu'une exception
  // (l'UI valide en amont, mais le moteur reste robuste).
  if (!history.length || amount <= 0 || startDate > endDate) {
    return emptyResult(startDate, endDate);
  }

  // Clamp de la période à l'historique réellement disponible.
  const firstDate = history[0].date;
  const lastDate = history[history.length - 1].date;
  const effStart = startDate < firstDate ? firstDate : startDate;
  const effEnd = endDate > lastDate ? lastDate : endDate;
  if (effStart > effEnd) return emptyResult(effStart, effEnd);

  // 1) Échéances d'investissement + achat à chaque échéance.
  const contributionDates = enumerateContributionDates(effStart, effEnd, frequency);
  const buys: { date: string; qty: number; amount: number }[] = [];
  let totalInvested = 0;
  let totalQty = 0;
  for (const date of contributionDates) {
    const price = priceAtOrBefore(history, date);
    if (price == null || price <= 0) continue; // pas de cotation → on saute
    const qty = amount / price;
    buys.push({ date, qty, amount });
    totalInvested += amount;
    totalQty += qty;
  }

  if (!buys.length) return emptyResult(effStart, effEnd);

  // 2) Série pour le graphe : un point par jour coté de la période, avec le
  //    cumul investi (en escalier) et la valeur du portefeuille.
  const points: SimulationPoint[] = [];
  let buyIdx = 0;
  let cumInvested = 0;
  let cumQty = 0;
  for (const point of history) {
    if (point.date < effStart) continue;
    if (point.date > effEnd) break;
    // Intègre les achats dont l'échéance est atteinte à ce jour.
    while (buyIdx < buys.length && buys[buyIdx].date <= point.date) {
      cumInvested += buys[buyIdx].amount;
      cumQty += buys[buyIdx].qty;
      buyIdx += 1;
    }
    points.push({
      date: point.date,
      invested: cumInvested,
      value: cumQty * point.price,
    });
  }

  // 3) Agrégats finaux.
  const finalPrice = priceAtOrBefore(history, effEnd) ?? 0;
  const finalValue = totalQty * finalPrice;
  const profit = finalValue - totalInvested;
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return {
    points,
    totalInvested,
    finalValue,
    profit,
    profitPct,
    quantity: totalQty,
    contributions: buys.length,
    startDate: effStart,
    endDate: effEnd,
  };
}
