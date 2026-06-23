import { afterEach, describe, expect, it, vi } from "vitest";
import { getHistory, getSnapshot } from "./coingecko";

/**
 * Vérifie la robustesse de la stratégie hybride : la démo ne casse jamais.
 * On simule l'API live (CoinGecko) tantôt en panne, tantôt OK.
 */
describe("getHistory — stratégie hybride", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sert le snapshot bundlé quand l'API live échoue (fallback)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { points, live } = await getHistory("BTC");
    const snapshot = getSnapshot("BTC");

    expect(live).toBe(false);
    expect(points).toEqual(snapshot.points);
    expect(points.length).toBeGreaterThan(0); // la démo a toujours des données
  });

  it("sert le snapshot quand l'API répond mais sans données exploitables", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );

    const { points, live } = await getHistory("ETH");
    expect(live).toBe(false);
    expect(points).toEqual(getSnapshot("ETH").points);
  });

  it("superpose les prix live par-dessus le snapshot quand l'API répond", async () => {
    const future = "2999-01-01";
    const futurePrice = 123456;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ prices: [[Date.parse(future), futurePrice]] }),
      }),
    );

    const { points, live } = await getHistory("SOL");
    const snapshot = getSnapshot("SOL");

    expect(live).toBe(true);
    expect(points.length).toBe(snapshot.points.length + 1); // point live ajouté
    expect(points.at(-1)).toEqual({ date: future, price: futurePrice });
  });
});
