"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { SimulationPoint } from "@/lib/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDateFR, formatEUR, formatEURCompact, formatMonthYear } from "@/lib/format";

interface SimulatorChartProps {
  points: SimulationPoint[];
}

const chartConfig = {
  value: { label: "Valeur du portefeuille", color: "var(--chart-1)" },
  invested: { label: "Montant investi", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function SimulatorChart({ points }: SimulatorChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Ajustez les paramètres pour voir l&apos;évolution du portefeuille.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
      <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={48}
          tickFormatter={formatMonthYear}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickMargin={4}
          tickFormatter={(v) => formatEURCompact(Number(v))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatDateFR(String(label))}
              formatter={(value, name) => (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatEUR(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="invested"
          type="monotone"
          stroke="var(--color-invested)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
          dot={false}
          isAnimationActive={false}
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="url(#fillValue)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
