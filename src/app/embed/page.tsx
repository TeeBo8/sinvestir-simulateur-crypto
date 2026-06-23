import type { Metadata } from "next";
import { CryptoSimulator } from "@/components/crypto-simulator/CryptoSimulator";

export const metadata: Metadata = {
  title: "Simulateur crypto — Embed",
  description: "Version intégrable (iframe) du simulateur de plus-value crypto S'investir.",
};

/**
 * Version embeddable : le simulateur seul, sans header ni footer, prête à être
 * placée en iframe depuis sinvestir.fr. Démontre l'intégrabilité du composant.
 */
export default function EmbedPage() {
  return (
    <main className="w-full p-3 sm:p-4">
      <CryptoSimulator />
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Propulsé par les simulateurs S&apos;investir
      </p>
    </main>
  );
}
