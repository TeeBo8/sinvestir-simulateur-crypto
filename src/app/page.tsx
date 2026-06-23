import { CryptoSimulator } from "@/components/crypto-simulator/CryptoSimulator";
import { SiteHeader } from "@/components/site-header";
import { FadeIn } from "@/components/fade-in";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {/* Hero */}
        <FadeIn>
          <section className="mx-auto mb-10 max-w-2xl text-center">
            <Badge
              variant="secondary"
              className="mb-4 rounded-full border-gold/30 text-gold"
            >
              Les simulateurs S&apos;investir
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Simulateur de plus-value crypto
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground">
              Chiffrez la performance passée d&apos;un investissement crypto, en une fois
              (one-shot) ou progressivement (DCA), sur des données historiques.
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.12}>
          <CryptoSimulator />
        </FadeIn>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          Démo — transposition du simulateur crypto aux standards S&apos;investir. Données
          historiques à titre indicatif, sans valeur de conseil en investissement.
        </div>
      </footer>
    </>
  );
}
