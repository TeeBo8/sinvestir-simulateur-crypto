"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SimulationParams } from "@/lib/types";
import { CRYPTO_BY_ID } from "@/lib/cryptos";
import { runSimulation } from "@/lib/simulation";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SimulatorInputs } from "./SimulatorInputs";
import { SimulatorResults } from "./SimulatorResults";
import { SimulatorChart } from "./SimulatorChart";
import { Disclaimer } from "./Disclaimer";
import type { HistoryResponse } from "./types";

interface CryptoSimulatorProps {
  /** Paramètres initiaux (le composant est props-driven / réutilisable). */
  initialParams?: Partial<SimulationParams>;
  className?: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const yearsAgo = (n: number) => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - n);
  return d.toISOString().slice(0, 10);
};

function StatusBadge({ live, loading }: { live: boolean | undefined; loading: boolean }) {
  const label = loading ? "Chargement…" : live ? "Données live" : "Données de secours";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          loading ? "bg-muted-foreground/50" : live ? "bg-foreground" : "bg-muted-foreground/60",
        )}
      />
      {label}
    </span>
  );
}

export function CryptoSimulator({ initialParams, className }: CryptoSimulatorProps) {
  const [params, setParams] = useState<SimulationParams>(() => ({
    cryptoId: "BTC",
    amount: 100,
    frequency: "monthly",
    startDate: yearsAgo(3),
    endDate: today(),
    ...initialParams,
  }));
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState(false);

  // Charge l'historique de la crypto sélectionnée (snapshot + refresh live).
  // L'état `loading` est dérivé (pas de setState synchrone dans l'effet) : on
  // est en chargement tant que l'historique en mémoire ne correspond pas à la
  // crypto demandée.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/history/${params.cryptoId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HistoryResponse>;
      })
      .then((data) => {
        setHistory(data);
        setError(false);
        // Clampe la période à l'historique réellement disponible pour cette crypto.
        const min = data.points[0]?.date;
        const max = data.points.at(-1)?.date;
        setParams((p) => {
          let { startDate, endDate } = p;
          if (min && startDate < min) startDate = min;
          if (max && endDate > max) endDate = max;
          return startDate === p.startDate && endDate === p.endDate
            ? p
            : { ...p, startDate, endDate };
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(true);
        toast.error("Impossible de charger les données", {
          description: "Vérifie ta connexion et réessaie.",
        });
      });
    return () => controller.abort();
  }, [params.cryptoId]);

  const result = useMemo(
    () => runSimulation(params, history?.points ?? []),
    [params, history],
  );

  const loading = !error && history?.id !== params.cryptoId;
  const minDate = history?.points[0]?.date ?? params.startDate;
  const maxDate = history?.points.at(-1)?.date ?? params.endDate;
  const symbol = CRYPTO_BY_ID[params.cryptoId].symbol;

  return (
    <Card className={cn("gap-0 p-5 sm:p-6", className)}>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SimulatorInputs
            params={params}
            minDate={minDate}
            maxDate={maxDate}
            disabled={loading && !history}
            onChange={(patch) => setParams((p) => ({ ...p, ...patch }))}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <SimulatorResults result={result} symbol={symbol} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Évolution du portefeuille
              </h3>
              <StatusBadge live={history?.live} loading={loading} />
            </div>
            <SimulatorChart points={result.points} />
          </div>
        </div>
      </div>

      <Disclaimer className="mt-6" />
    </Card>
  );
}
