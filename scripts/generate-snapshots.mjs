/**
 * Génère les snapshots d'historique de prix bundlés (fallback).
 *
 * Source : Binance klines (API publique, sans clé), paires EUR, granularité
 * journalière, historique complet. Pourquoi Binance plutôt que CoinGecko ici ?
 * → l'API publique CoinGecko plafonne l'historique à 365 jours ; Binance donne
 *   plusieurs années gratuitement, ce qui rend les backtests DCA pertinents.
 *   CoinGecko reste la source *live* de rafraîchissement (voir lib/coingecko.ts).
 *
 * Usage : `node scripts/generate-snapshots.mjs`
 * Sortie : src/data/crypto-history/{ID}.json
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "data", "crypto-history");
const DAY_MS = 86_400_000;
const HISTORY_START = Date.UTC(2019, 0, 1); // les paires commencent en 2020+

// Doit rester aligné avec src/lib/cryptos.ts.
const CRYPTOS = [
  { id: "BTC", binanceSymbols: ["BTCEUR"] },
  { id: "ETH", binanceSymbols: ["ETHEUR"] },
  { id: "SOL", binanceSymbols: ["SOLEUR"] },
  { id: "BNB", binanceSymbols: ["BNBEUR"] },
  { id: "XRP", binanceSymbols: ["XRPEUR"] },
  { id: "ADA", binanceSymbols: ["ADAEUR"] },
  { id: "DOGE", binanceSymbols: ["DOGEEUR"] },
  { id: "POL", binanceSymbols: ["MATICEUR", "POLEUR"] }, // rebrand 1:1
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Récupère tout l'historique journalier d'un symbole Binance (paginé). */
async function fetchSymbol(symbol) {
  const points = [];
  let cursor = HISTORY_START;
  for (;;) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=1000&startTime=${cursor}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${symbol}: HTTP ${res.status}`);
    const klines = await res.json();
    if (!Array.isArray(klines) || klines.length === 0) break;
    for (const k of klines) {
      points.push({ date: new Date(k[0]).toISOString().slice(0, 10), price: parseFloat(k[4]) });
    }
    if (klines.length < 1000) break;
    cursor = klines[klines.length - 1][0] + DAY_MS;
    await sleep(200); // politesse rate-limit
  }
  return points;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const { id, binanceSymbols } of CRYPTOS) {
    const merged = new Map(); // date → price (dédup, le dernier symbole prime sur l'overlap)
    for (const symbol of binanceSymbols) {
      const pts = await fetchSymbol(symbol);
      for (const p of pts) merged.set(p.date, p.price);
      console.log(`  ${symbol}: ${pts.length} jours`);
    }
    const points = [...merged.entries()]
      .map(([date, price]) => ({ date, price }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const history = { id, currency: "EUR", source: "binance", points };
    await writeFile(join(OUT_DIR, `${id}.json`), JSON.stringify(history));
    console.log(`✓ ${id}: ${points.length} points (${points[0]?.date} → ${points.at(-1)?.date})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
