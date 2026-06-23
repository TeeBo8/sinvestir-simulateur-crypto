import { getHistory } from "@/lib/coingecko";
import { CRYPTO_BY_ID, isCryptoId } from "@/lib/cryptos";

/**
 * Renvoie l'historique de prix (EUR, daily) d'une crypto : snapshot bundlé
 * rafraîchi par CoinGecko quand l'API répond, fallback bundlé sinon.
 *
 * GET /api/history/BTC → { id, name, currency, live, points: [{date, price}] }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isCryptoId(id)) {
    return Response.json({ error: `Crypto inconnue: ${id}` }, { status: 404 });
  }

  const { points, live } = await getHistory(id);
  return Response.json(
    { id, name: CRYPTO_BY_ID[id].name, currency: "EUR", live, points },
    // Cache CDN court : la donnée live est déjà revalidée 1 h côté fetch.
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
