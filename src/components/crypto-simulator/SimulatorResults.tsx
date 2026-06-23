"use client";

import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import type { SimulationResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEUR, formatPct, formatQuantity } from "@/lib/format";

interface SimulatorResultsProps {
  result: SimulationResult;
  /** Ticker de la crypto (ex. "BTC") pour libeller la quantité. */
  symbol: string;
}

export function SimulatorResults({ result, symbol }: SimulatorResultsProps) {
  const gain = result.profit >= 0;
  const TrendIcon = gain ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">Vos résultats</h2>

      {/* Carte principale : plus/moins-value */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              gain ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            )}
          >
            <TrendIcon className="size-4" />
            Plus/moins-value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "text-3xl font-bold tracking-tight tabular-nums",
                gain ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {gain ? "+" : ""}
              {formatEUR(result.profit)}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ring-1",
                gain
                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
              )}
            >
              {formatPct(result.profitPct)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Investi vs valeur finale */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant total investi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatEUR(result.totalInvested)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.contributions} versement{result.contributions > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valeur finale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatEUR(result.finalValue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatQuantity(result.quantity)} {symbol}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
