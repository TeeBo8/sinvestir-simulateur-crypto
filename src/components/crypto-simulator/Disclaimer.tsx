import { cn } from "@/lib/utils";

/**
 * Avertissement légal — texte officiel repris de S'investir (fidélité au
 * standard maison : données historiques, pas de conseil, perte en capital).
 */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <p className="mb-1 font-medium text-foreground">Avertissement</p>
      <p>
        L&apos;illustration graphique et les résultats présentés par ce simulateur ne constituent
        pas un indicateur fiable des performances futures. Ils ont uniquement pour objectif
        d&apos;illustrer les mécanismes d&apos;un investissement sur une période donnée. La valeur
        de votre investissement peut évoluer à la hausse comme à la baisse et s&apos;écarter
        significativement des résultats affichés. Les crypto-actifs présentent une volatilité
        particulièrement élevée et comportent des risques spécifiques (piratage, perte des clés
        privées, défaillance de plateforme). Investir en crypto-actifs comporte un risque de perte
        en capital partielle ou totale. Ceci ne constitue pas un conseil en investissement.
      </p>
    </div>
  );
}
