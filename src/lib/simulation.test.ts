import { describe, it, expect } from "vitest";
import {
  addDays,
  addMonths,
  enumerateContributionDates,
  priceAtOrBefore,
  runSimulation,
} from "./simulation";
import type { PricePoint, SimulationParams } from "./types";

/** Série de prix synthétique pour des assertions déterministes. */
const series = (entries: [string, number][]): PricePoint[] =>
  entries.map(([date, price]) => ({ date, price }));

const params = (p: Partial<SimulationParams>): SimulationParams => ({
  cryptoId: "BTC",
  amount: 1000,
  frequency: "once",
  startDate: "2024-01-01",
  endDate: "2024-01-10",
  ...p,
});

describe("addDays / addMonths", () => {
  it("ajoute des jours en passant les mois", () => {
    expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29"); // 2024 bissextile
  });

  it("clampe le jour du mois en ajoutant des mois", () => {
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29"); // 31 -> 29 févr.
    expect(addMonths("2023-01-31", 1)).toBe("2023-02-28"); // non bissextile
    expect(addMonths("2024-01-15", 2)).toBe("2024-03-15");
    expect(addMonths("2024-12-15", 1)).toBe("2025-01-15"); // passage d'année
  });
});

describe("enumerateContributionDates", () => {
  it("one-shot = une seule échéance (la date de début)", () => {
    expect(enumerateContributionDates("2024-01-01", "2024-12-31", "once")).toEqual(["2024-01-01"]);
  });

  it("daily = un point par jour, bornes incluses", () => {
    const d = enumerateContributionDates("2024-01-01", "2024-01-05", "daily");
    expect(d).toEqual(["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"]);
  });

  it("weekly = tous les 7 jours", () => {
    const d = enumerateContributionDates("2024-01-01", "2024-01-31", "weekly");
    expect(d).toEqual(["2024-01-01", "2024-01-08", "2024-01-15", "2024-01-22", "2024-01-29"]);
  });

  it("monthly = même jour chaque mois, avec clamp", () => {
    const d = enumerateContributionDates("2024-01-31", "2024-04-30", "monthly");
    expect(d).toEqual(["2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30"]);
  });

  it("renvoie [] si start > end", () => {
    expect(enumerateContributionDates("2024-02-01", "2024-01-01", "daily")).toEqual([]);
  });
});

describe("priceAtOrBefore", () => {
  const pts = series([
    ["2024-01-01", 100],
    ["2024-01-03", 300],
    ["2024-01-05", 500],
  ]);

  it("trouve le prix exact", () => {
    expect(priceAtOrBefore(pts, "2024-01-03")).toBe(300);
  });

  it("renvoie le dernier prix coté en amont (jour manquant)", () => {
    expect(priceAtOrBefore(pts, "2024-01-04")).toBe(300);
  });

  it("renvoie null avant tout l'historique", () => {
    expect(priceAtOrBefore(pts, "2023-12-31")).toBeNull();
  });

  it("renvoie le dernier prix après la fin de l'historique", () => {
    expect(priceAtOrBefore(pts, "2024-06-01")).toBe(500);
  });
});

describe("runSimulation — one-shot", () => {
  const history = series([
    ["2024-01-01", 100],
    ["2024-01-10", 200],
  ]);

  it("calcule une plus-value correcte", () => {
    const r = runSimulation(params({ amount: 1000, frequency: "once" }), history);
    expect(r.contributions).toBe(1);
    expect(r.quantity).toBeCloseTo(10, 10); // 1000 / 100
    expect(r.totalInvested).toBe(1000);
    expect(r.finalValue).toBeCloseTo(2000, 6); // 10 * 200
    expect(r.profit).toBeCloseTo(1000, 6);
    expect(r.profitPct).toBeCloseTo(100, 6);
  });

  it("calcule une moins-value correcte", () => {
    const r = runSimulation(
      params({ amount: 1000, frequency: "once", endDate: "2024-01-10" }),
      series([
        ["2024-01-01", 100],
        ["2024-01-10", 50],
      ]),
    );
    expect(r.finalValue).toBeCloseTo(500, 6);
    expect(r.profit).toBeCloseTo(-500, 6);
    expect(r.profitPct).toBeCloseTo(-50, 6);
  });
});

describe("runSimulation — DCA", () => {
  it("cumule les quantités à chaque échéance (daily)", () => {
    const history = series([
      ["2024-01-01", 100],
      ["2024-01-02", 200],
      ["2024-01-03", 400],
      ["2024-01-04", 800],
    ]);
    const r = runSimulation(
      params({ amount: 100, frequency: "daily", startDate: "2024-01-01", endDate: "2024-01-04" }),
      history,
    );
    // qty = 100/100 + 100/200 + 100/400 + 100/800 = 1.875
    expect(r.contributions).toBe(4);
    expect(r.totalInvested).toBe(400);
    expect(r.quantity).toBeCloseTo(1.875, 10);
    expect(r.finalValue).toBeCloseTo(1500, 6); // 1.875 * 800
    expect(r.profit).toBeCloseTo(1100, 6);
  });
});

describe("runSimulation — série du graphe", () => {
  it("produit un point par jour coté avec investi en escalier", () => {
    const history = series([
      ["2024-01-01", 100],
      ["2024-01-02", 100],
      ["2024-01-03", 100],
    ]);
    const r = runSimulation(
      params({ amount: 100, frequency: "daily", startDate: "2024-01-01", endDate: "2024-01-03" }),
      history,
    );
    expect(r.points).toHaveLength(3);
    expect(r.points[0]).toMatchObject({ date: "2024-01-01", invested: 100 });
    expect(r.points[2].invested).toBe(300);
    // prix constant -> valeur = investi
    expect(r.points[2].value).toBeCloseTo(300, 6);
  });
});

describe("runSimulation — clamp & garde-fous", () => {
  const history = series([
    ["2024-01-05", 100],
    ["2024-01-10", 200],
  ]);

  it("clampe la période à l'historique disponible", () => {
    const r = runSimulation(
      params({ amount: 1000, frequency: "once", startDate: "2024-01-01", endDate: "2024-12-31" }),
      history,
    );
    expect(r.startDate).toBe("2024-01-05");
    expect(r.endDate).toBe("2024-01-10");
    expect(r.quantity).toBeCloseTo(10, 10); // achat au premier jour dispo (100)
  });

  it("renvoie un résultat neutre si montant <= 0", () => {
    const r = runSimulation(params({ amount: 0 }), history);
    expect(r).toMatchObject({ totalInvested: 0, finalValue: 0, contributions: 0 });
    expect(r.points).toHaveLength(0);
  });

  it("renvoie un résultat neutre si start > end", () => {
    const r = runSimulation(params({ startDate: "2024-02-01", endDate: "2024-01-01" }), history);
    expect(r.contributions).toBe(0);
  });

  it("renvoie un résultat neutre si historique vide", () => {
    const r = runSimulation(params({}), []);
    expect(r.finalValue).toBe(0);
  });
});
