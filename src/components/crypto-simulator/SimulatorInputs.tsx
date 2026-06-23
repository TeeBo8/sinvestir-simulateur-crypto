"use client";

import type { CryptoId, SimulationParams } from "@/lib/types";
import { CRYPTOS } from "@/lib/cryptos";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FREQUENCY_OPTIONS } from "./types";

interface SimulatorInputsProps {
  params: SimulationParams;
  /** Première date disponible pour la crypto sélectionnée. */
  minDate: string;
  /** Dernière date disponible (aujourd'hui). */
  maxDate: string;
  disabled?: boolean;
  onChange: (patch: Partial<SimulationParams>) => void;
}

const cryptoItems = CRYPTOS.map((c) => ({ value: c.id, label: `${c.name} (${c.symbol})` }));

export function SimulatorInputs({
  params,
  minDate,
  maxDate,
  disabled,
  onChange,
}: SimulatorInputsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Cryptomonnaie */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="crypto">Cryptomonnaie</Label>
        <Select
          value={params.cryptoId}
          items={cryptoItems}
          onValueChange={(value) => onChange({ cryptoId: value as CryptoId })}
        >
          <SelectTrigger id="crypto" className="w-full" disabled={disabled}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRYPTOS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                <span className="text-muted-foreground">{c.symbol}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Montant investi */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">
          Montant investi {params.frequency !== "once" && <span className="text-muted-foreground">(par échéance)</span>}
        </Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min={1}
            step={10}
            value={Number.isFinite(params.amount) ? params.amount : ""}
            disabled={disabled}
            onChange={(e) => onChange({ amount: e.target.valueAsNumber })}
            className="pr-9"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            €
          </span>
        </div>
      </div>

      {/* Fréquence — segmented control */}
      <div className="flex flex-col gap-2">
        <Label>Fréquence</Label>
        <div
          role="group"
          aria-label="Fréquence d'investissement"
          className="grid grid-cols-2 gap-1.5 rounded-lg border border-input p-1 sm:grid-cols-4"
        >
          {FREQUENCY_OPTIONS.map((opt) => {
            const active = params.frequency === opt.value;
            return (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={active ? "default" : "ghost"}
                aria-pressed={active}
                disabled={disabled}
                onClick={() => onChange({ frequency: opt.value })}
                className={cn("h-8", !active && "text-muted-foreground")}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {params.frequency === "once"
            ? "Investissement en une seule fois (one-shot)."
            : "Investissement progressif récurrent (DCA)."}
        </p>
      </div>

      {/* Période */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="start">Date de début</Label>
          <Input
            id="start"
            type="date"
            value={params.startDate}
            min={minDate}
            max={params.endDate}
            disabled={disabled}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="end">Date de fin</Label>
          <Input
            id="end"
            type="date"
            value={params.endDate}
            min={params.startDate}
            max={maxDate}
            disabled={disabled}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
