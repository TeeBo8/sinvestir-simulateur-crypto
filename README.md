# Simulateur de plus-value crypto — S'investir

Transposition du [simulateur crypto S'investir](https://sinvestir.fr/simulateur-crypto-monnaie/)
au format et à l'identité visuelle de la suite [simulateurs.sinvestir.fr](https://simulateurs.sinvestir.fr/).

Simulez la performance passée d'un investissement crypto — en une fois (one-shot) ou progressif
(DCA) — sur données historiques : évolution du portefeuille, montant investi vs valeur finale,
plus/moins-value en € et %.

**🔗 Démo en ligne : https://sinvestir-simulateur-crypto-nine.vercel.app**
&nbsp;·&nbsp; Version intégrable : [`/embed`](https://sinvestir-simulateur-crypto-nine.vercel.app/embed)

---

## Lancer en local

```bash
pnpm install
pnpm dev          # http://localhost:3000  (et /embed)
```

Autres scripts :

```bash
pnpm build        # build de production
pnpm lint         # ESLint (0 erreur / 0 warning)
pnpm test         # Vitest (logique de calcul + robustesse data)
```

**Variable d'environnement (optionnelle).** Copier `.env.example` en `.env.local` :

```bash
COINGECKO_API_KEY=   # facultatif — la démo fonctionne sans, grâce au fallback bundlé
```

> Aucune base de données, aucun compte, aucune clé requise pour faire tourner la démo.

---

## Partis pris techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TS strict | Match exact avec la stack interne S'investir |
| **UI** | Tailwind v4 + shadcn/ui | Composants accessibles, cohérence, rapidité |
| **Graphe** | Recharts | Léger, déclaratif, responsive |
| **Animations** | Framer Motion (dosé) | Finitions premium sans surcharge |
| **Données** | **Hybride** : snapshot bundlé + refresh live CoinGecko | Démo qui ne tombe jamais + jugement d'ingé (voir ci-dessous) |
| **Base de données** | Aucune | La démo n'en a pas besoin ; le brief demande de ne pas faire les vraies intégrations |
| **Thème** | Light/dark (navy / bleu roi `#0049C6` / doré) | Fidélité à l'identité S'investir, sur les deux modes |

### Stratégie data hybride (le point technique clé)

La donnée est **découplée de l'UI** : le moteur de calcul ne connaît que des séries de prix.

1. **Snapshot bundlé** (`src/data/crypto-history/*.json`) — historique journalier EUR **multi-années**
   par crypto, commité dans le repo. Source : [Binance klines](https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data)
   (libre, sans clé, historique profond — jusqu'en 2020 pour BTC/ETH). C'est la **source de vérité**
   qui garantit que la démo fonctionne *toujours*, même hors-ligne.
2. **Refresh live CoinGecko** (`src/lib/coingecko.ts`) — par-dessus le snapshot, on rafraîchit les
   prix récents quand l'API répond (cache 1 h). CoinGecko est la source *live* demandée par le brief.
3. **Fallback total** — toute erreur réseau / rate-limit → on sert le snapshot seul. Un badge
   « Données live / Données de secours » reflète l'état en direct. (Comportement **testé** :
   `src/lib/coingecko.test.ts`.)

> **Pourquoi deux sources ?** L'API publique CoinGecko plafonne l'historique gratuit à **365 jours** ;
> le snapshot Binance apporte la profondeur multi-années nécessaire à des backtests DCA pertinents,
> pendant que CoinGecko assure la fraîcheur. C'est exactement le genre d'arbitrage que le test évalue :
> choisir une source, anticiper la fragilité d'une API externe, concevoir un fallback robuste.

### Intégrabilité (composant autonome)

Le simulateur est un **composant React autonome, props-driven, à dépendances minimales** :

- `src/components/crypto-simulator/CryptoSimulator.tsx` — le cœur réutilisable, exportable tel quel.
- Route [`/embed`](src/app/embed/page.tsx) — le simulateur seul, sans header/footer, prêt à être
  mis en **iframe** depuis `sinvestir.fr`.
- Logique de calcul **pure et isolée** dans [`src/lib/simulation.ts`](src/lib/simulation.ts)
  (testable, sans UI ni réseau).

```
src/
  components/crypto-simulator/   # composant autonome (Inputs · Results · Chart · Disclaimer)
  lib/
    simulation.ts                # moteur de calcul PUR (one-shot + DCA) — testé
    coingecko.ts                 # data hybride : snapshot + refresh live + fallback
    cryptos.ts · types.ts · format.ts
  data/crypto-history/*.json     # snapshots fallback (8 cryptos)
  app/
    page.tsx                     # vitrine + simulateur
    embed/page.tsx               # version intégrable (iframe)
    api/history/[id]/route.ts    # historique de prix (serveur)
```

---

## Limites assumées

- **8 cryptos curatées** (BTC, ETH, SOL, BNB, XRP, ADA, DOGE, POL) au lieu de ~7000 — démo propre
  et rapide. *Scaler* = brancher la recherche CoinGecko (`/coins/list`) sur le même moteur.
- **Données historiques uniquement** — aucune prédiction, aucun conseil en investissement.
- **CoinGecko live plafonné à 365 j** (tier gratuit) — d'où le snapshot Binance pour la profondeur.
  Une clé payante CoinGecko débloquerait l'historique complet en live.
- Cas **Polygon (MATIC → POL)** : rebrand géré en raccordant les deux paires Binance (1:1).

---

## Suggestions d'amélioration (regard de partenaire)

> Le poste est « Dev IA » et les vrais besoins sont des **agents IA + automatisations**. Au moins
> une piste a donc une dimension IA forte.

1. **Assistant IA d'analyse** *(angle IA)* — un agent qui commente la simulation en langage naturel
   (« sur cette période, un DCA aurait lissé la volatilité de X % vs un one-shot »), via Claude +
   Vercel AI SDK. Transforme un outil de calcul en outil de pédagogie.
2. **Simulations partageables** — lien public + image Open Graph dynamique du résultat (acquisition
   / viralité), cohérent avec leur fonctionnalité « Partagez vos résultats ».
3. **Design system / lib de calcul commune** — factoriser une base partagée entre leurs ~8
   simulateurs (gain de maintenance, cohérence visuelle).
4. **Automatisation n8n** — pipeline de refresh des données + alerting si une source de prix tombe
   (cohérent avec leur stack n8n).

---

## Mentions légales

Les résultats sont une **simulation rétrospective** sur données historiques. Ils ne constituent pas
un indicateur fiable des performances futures, ni un conseil en investissement. Les crypto-actifs
présentent une volatilité élevée et un risque de perte en capital partielle ou totale.
