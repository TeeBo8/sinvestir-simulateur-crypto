import { Button } from "@/components/ui/button";

/**
 * Header de la démo — reprend l'esprit de simulateurs.sinvestir.fr (logo
 * "SIMULATEURS" + actions de compte). Boutons factices : ils servent la
 * fidélité visuelle, la démo n'a ni compte ni auth.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-md border border-border font-serif text-lg font-semibold"
          >
            S
          </span>
          <span className="text-sm font-semibold tracking-[0.2em]">SIMULATEURS</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-full">
            Se connecter
          </Button>
          <Button size="sm" className="rounded-full">
            Créer un compte
          </Button>
        </nav>
      </div>
    </header>
  );
}
