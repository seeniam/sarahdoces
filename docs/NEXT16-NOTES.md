# Next.js 16.4.0 — Cheat-Sheet for the "Cereja" Prototype

A durable reference for building this **frontend-only** prototype (React 19.3, App Router, TS strict, `src/`, Tailwind v4, shadcn/ui, Zustand+persist+BroadcastChannel, no backend). Everything below is distilled from the bundled Next 16 docs (`node_modules/next/dist/docs`) and scoped to what actually bites this project. Default memory of Next is probably wrong here — Next 16 has real breaking changes.

> **Palette caveat:** the `globals.css` color example below uses placeholder/legacy tokens. The **authoritative palette and fonts live in `docs/DIRECAO-DE-ARTE.md`** (porcelana/cereja `#9E1B32`/azulejo `#1E4F91`, Gloock + Hanken Grotesk). Use those, not the example literals.

---

## TL;DR rules

1. **`params` and `searchParams` are Promises.** `await` them in Server Components; unwrap with React `use()` in `'use client'` pages (a client page can never be `async`). Direct `.id`/`.foo` access is a TS error → build fails.
2. **`useSearchParams()` must be inside a `<Suspense>` boundary.** Most likely build break for PDV / filter / encomendas pages. Same for `usePathname`/`useParams` on dynamic-param routes.
3. **`cacheComponents: true` inverts rendering:** every route is prerender-validated, nothing is cached by default. In a Server Component, `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()`, or any uncached `await` during render now **fails the build**.
4. **DECISION: `cacheComponents` is turned OFF for this client-mocked app** (see GO/NO-GO). It provides zero benefit with no server data and only adds build-failure risk.
5. **Route segment configs are hard build errors under cacheComponents:** `dynamic`, `revalidate`, `fetchCache`, `dynamicParams`, `experimental_ppr`, `runtime='edge'`. Old escape hatches are gone — do not reach for `force-dynamic`/`force-static`.
6. **`useRouter` imports from `next/navigation`**, never `next/router`. `router.query`/`router.pathname` are gone — use `useSearchParams()`/`usePathname()`.
7. **Exactly ONE root layout** at `app/layout.tsx` renders `<html>`/`<body>`. Route-group layouts `(auth)`/`(app)` must NOT render their own — doing so forces full page reloads between groups.
8. **`metadata`/`generateMetadata` are Server-Component-only.** Any `export const metadata` in a `'use client'` file fails. Give client-heavy pages (PDV, KDS) a server `page.tsx`/`layout.tsx` wrapper that exports metadata.
9. **Set `metadataBase` in the root layout.** A relative OG/twitter/canonical URL without it is a hard build error.
10. **Theme (dark "cacau") via inline `<head>` script + `suppressHydrationWarning`**, not `useEffect` — otherwise you flash the light theme on every load. Never read `cookies()`/`headers()` for theme (opts the whole app out of static prerender).
11. **Gate persisted Zustand reads behind a `hasHydrated` flag.** Rendering a persisted value on first paint throws a hydration mismatch. Wrap every `localStorage` access in try/catch.
12. **Tailwind v4 = CSS config.** `@import "tailwindcss";` + `@theme {}`; NO `tailwind.config.js`, NO `@tailwind base/components/utilities`, NO `content` globs. `postcss.config.mjs` uses only `@tailwindcss/postcss`.
13. **Fonts:** load **Gloock with `weight: '400'`** (single-weight — omitting weight fails the build); **Hanken_Grotesk** is variable (no weight). Bridge to Tailwind with `@theme inline`.
14. **`<Image priority>` is deprecated → use `preload`.** `images.qualities` defaults to `[75]`; any other `quality` is silently downgraded unless listed in config.
15. **jsdom has no `BroadcastChannel`** — polyfill it in a Vitest setup file or every store test throws. Add `vite-tsconfig-paths` or `@/*` imports won't resolve in tests.

Run `pnpm build` (not just `pnpm dev`) at the end of every phase — prerender insights appear only at build time; dev returns 200 and hides them.

---

## cacheComponents — GO / NO-GO

**DECISION: OFF.** Removed `cacheComponents` and `partialPrefetching` from `next.config.ts` (recorded in `docs/DECISOES.md`).

**Reasoning:** `cacheComponents` enables Partial Prerendering + the `use cache` model. Its entire value is caching *server* data (fetch/DB/server actions). This app has **none** — all data is mocked client-side via Zustand + `persist(localStorage)` + BroadcastChannel. So PPR/`use cache` buys literally nothing, while it adds:

- A class of build failures: any sync IO (`Date`/`random`/`crypto`) or uncached await in a Server Component (layouts, footers, metadata) fails the prerender.
- A mandatory `<Suspense>` wrapper around every `useSearchParams()` — easy to forget, breaks `next build`.
- The **React `<Activity>` state-persistence surprise**: routes are hidden (`display:none`), not unmounted, so carts/dialogs/filters keep stale state on back-navigation.

```ts
// next.config.ts — recommended for this client-mocked app
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  // No server data to cache → PPR/use cache add only risk. Omit both:
  // cacheComponents: true,
  // partialPrefetching: true,
}

export default nextConfig
```

---

## Rendering & cacheComponents (IF ever re-enabled)

- `experimental.dynamicIO`, `experimental.useCache`, `experimental.ppr`, and the `experimental_ppr` segment are **removed**. The single flag `cacheComponents: true` turns on PPR + the `use cache` model.
- Default rendering **inverts**: with it on, every route is prerendered to a static shell and data is uncached by default. Uncacheable work must be cached (`use cache`), wrapped in `<Suspense>`, or deferred with `connection()`.
- `generateStaticParams` returning `[]` now errors — it must return ≥1 real param. Don't export `dynamicParams`.
- `output: 'export'` is **incompatible** with cacheComponents.
- A Server Component footer computing `new Date().getFullYear()` during render **fails `next build`** — move it into a client component or compute at module scope from a constant.
- `useSearchParams()` with no `<Suspense>` → build break (not a warning).

```tsx
// IF re-enabled: useSearchParams must sit inside <Suspense>
'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function Filtro() {
  const q = useSearchParams().get('q') ?? ''
  return <input defaultValue={q} />
}

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <Filtro />
    </Suspense>
  )
}
```

---

## Routing, layouts & TS types

- `params`/`searchParams` are **Promises** in `page.tsx`/`layout.tsx`, `generateMetadata`, `generateViewport`, and icon/OG image functions.
- Global `PageProps<'/route'>` and `LayoutProps<'/route'>` are generated (no import) — they infer typed `params`, `searchParams`, `children`, slots. Static routes resolve `params` to `{}`.
- `typedRoutes` is now a **top-level** `NextConfig` key (was `experimental.typedRoutes`). It types `<Link href>` and `router.push/replace/prefetch`.

**Rules**

- One root layout at `app/layout.tsx` with `<html>`/`<body>`. `(auth)` and `(app)` group layouts nest inside and render chrome only (sidebar/topbar vs login), no `<html>`/`<body>`.
- Groups are stripped from the URL: `(app)/painel/page.tsx` → `/painel`. Never let two groups resolve to the same path.
- Put the **fullscreen KDS (`cozinha`) outside the `(app)` sidebar layout** — own segment/group with a chrome-free layout.
- Type pages/layouts with the global helpers; always `await props.params` (server) or `use(props.params)` (client).
- Layouts don't re-render on navigation — extract active-link / query logic into a `'use client'` child calling `usePathname()`/`useSearchParams()`.
- `tsconfig` `include` must have `next-env.d.ts` and `.next/types/**/*.ts`, or `PageProps`/`LayoutProps`/`Route` are undefined → build errors. Never edit `next-env.d.ts` (regenerated).

**Gotchas**

- Reading `params.id` without `await`/`use()` → TS error → build fails.
- Marking a client page `async` is invalid — use `use()`.
- `<html>`/`<body>` in both root and a group layout → multiple root layouts → full reload between groups (kills the persisted-Zustand SPA feel).
- `typedRoutes` on: a typo'd literal `href` is a compile error; computed hrefs need `as Route` (`import type { Route } from 'next'`).

```tsx
// app/(app)/layout.tsx — nested group layout, NO <html>/<body>
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1"><Topbar /><main>{children}</main></div>
    </div>
  )
}
```

```tsx
// Client page — unwrap params with use() (never async)
'use client'
import { use } from 'react'

export default function Page(props: PageProps<'/comandas/[id]'>) {
  const { id } = use(props.params)
  return <ComandaDetalhe id={id} />
}
```

```tsx
// Active nav link — client child of a server layout
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label }: { href: string; label: string }) {
  const active = usePathname() === href
  return <Link href={href} aria-current={active ? 'page' : undefined}>{label}</Link>
}
```

---

## Client components, state & dark-mode

- React context (incl. Zustand providers) is client-only; a provider is a `'use client'` component rendered from a server layout, wrapping `{children}` — never put the directive on the layout itself.
- Server Components passed as `children`/props into a Client Component render on the server and are handed in as output (not pulled into the client bundle). Keep `'use client'` at the entry of each interactive subtree, not on every file.
- `next/dynamic` with `{ ssr: false }` loads browser-only libs (Recharts, anything touching `window`) only in the browser.
- Server-action machinery (`useOptimistic`/`useActionState`/`refresh()`) is **N/A** — Zustand mutations are synchronous. Keep only `useTransition` for heavy filtering if needed.

**Rules**

- No-flash theme = inline `<head>` script + `suppressHydrationWarning` on `<html>`. Re-apply the class in a `useLayoutEffect` in the theme component (Strict Mode dev remount strips it; no-op in prod).
- Never render a persisted value during SSR — gate behind `hasHydrated`. Wrap every storage access in try/catch.
- Dynamically import Recharts & window-dependent components with `{ ssr: false }`.
- "Resetar demo" should clear `localStorage`, re-seed, then `window.location.reload()`.

**Gotchas that break build/console**

- Rendering a persisted Zustand value on first paint → hydration mismatch (breaks). Gate with `hasHydrated` or `skipHydration`.
- Module-scope `window`/`localStorage`/`document` access in *any* imported file runs during SSR and crashes — guard with `typeof window` or import dynamically.
- Passing an event-handler function from a Server Component to a Client Component throws; the TS plugin only allows prop names `action` or `*Action`. Keep handlers inside client components.
- The lazy `useState` initializer and the inline theme script must read the **same** storage key/default, or you still get a mismatch.

```tsx
// app/layout.tsx — no-flash theme + fonts + providers (canonical root layout)
import './globals.css'
import type { Metadata } from 'next'
import { gloock, hanken } from '@/lib/fonts'
import { Providers } from '@/components/providers'

export const metadata: Metadata = { /* see Metadata section */ }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${gloock.variable} ${hanken.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tema');if(t==='cacau')document.documentElement.classList.add('cacau')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

```tsx
// components/providers.tsx — client boundary (Zustand stores are module singletons; no React provider needed)
'use client'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  )
}
```

```tsx
// lib/store/useHydrated.ts — render skeletons until persisted state rehydrates
'use client'
import { useEffect, useState } from 'react'
import { useLojaStore } from './loja'

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(useLojaStore.persist.hasHydrated())
    return useLojaStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])
  return hydrated
}
```

```tsx
// Browser-only chart (avoids SSR/hydration issues with Recharts)
import dynamic from 'next/dynamic'

const GraficoVendas = dynamic(() => import('@/components/charts/grafico-vendas'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-[14px] bg-acucar" />,
})
```

---

## Styling, fonts & images (Tailwind v4)

- Tailwind v4 is the default: `@import "tailwindcss";` at the top of `globals.css`, config lives in CSS via `@theme`. **No `tailwind.config.js`, no `@tailwind` directives, no `content` globs** (that's the v3 path).
- next/font → Tailwind bridge is `@theme inline { --font-sans: var(--font-...) }`.
- `<Image priority>` is **deprecated → use `preload`** for LCP/hero.
- `images.qualities` defaults to `[75]`; a `quality` prop outside the list is silently coerced.
- `images.formats` defaults to `['image/webp']`; AVIF is opt-in. `images.domains` is deprecated → use `remotePatterns`.
- **Turbopack is the default bundler** for dev and build; it auto-processes `postcss.config.*` and uses Lightning CSS. Zero config for Tailwind v4.

**Rules**

- `postcss.config.mjs` exports only `@tailwindcss/postcss` (no autoprefixer, no `tailwindcss` entry — v4 bundles both).
- Brand tokens go in `@theme { --color-cereja: #9E1B32; … }` (see DIRECAO-DE-ARTE.md for the full authoritative palette). Font vars pointing at another var need `@theme inline`.
- Load each Google font **once** in `lib/fonts.ts`, apply variables on `<html>`, always pass `subsets: ['latin']`.
- `<Image>` needs `width`+`height` unless static-import or `fill` (then parent is `position: relative` and pass `sizes`). `placeholder="blur"` auto-works only for static-imported jpg/png/webp/avif; remote src needs your own tiny `blurDataURL`.
- Prefer static image imports for demo assets (auto width/height/blurDataURL, no config).

**Gotchas that break lint/build**

- **Gloock has only weight 400** — `Gloock({ subsets: ['latin'] })` without `weight: '400'` fails the build. Hanken_Grotesk is variable — don't pass `weight`.
- `@theme` vs `@theme inline` mix-up breaks generated utilities (font vars → `inline`; color literals → plain `@theme`).
- Class-based dark mode (`cacau`) is **not** Tailwind v4's default (`dark:` follows `prefers-color-scheme`). Add a custom variant in `globals.css`.
- Leftover v3 fragments (`@tailwind` directives / `content` array) break utility output under v4.
- SVGs are auto-`unoptimized` via `<Image>` — for the custom cherry logo use an **inline React SVG component**, not next/image.
- Turbopack doesn't type-check — rely on `tsc`/IDE + `pnpm lint`.

```js
// postcss.config.mjs
export default { plugins: { '@tailwindcss/postcss': {} } }
```

```css
/* globals.css shape (tokens here are illustrative — use DIRECAO-DE-ARTE.md) */
@import "tailwindcss";

@theme {
  --color-cereja: #9E1B32;
  /* …full palette from docs/DIRECAO-DE-ARTE.md… */
}

@theme inline {
  --font-display: var(--font-gloock);
  --font-sans: var(--font-hanken);
}

/* class-based dark ("cacau") instead of OS setting */
@custom-variant dark (&:where(.cacau, .cacau *));
```

```ts
// lib/fonts.ts — load once, export instances
import { Gloock, Hanken_Grotesk } from 'next/font/google'

export const gloock = Gloock({
  subsets: ['latin'],
  weight: '400', // single-weight display font — REQUIRED
  display: 'swap',
  variable: '--font-gloock',
})

export const hanken = Hanken_Grotesk({
  subsets: ['latin'], // variable font — no weight
  display: 'swap',
  variable: '--font-hanken',
})
```

```tsx
// Static local image with blur-up
import Image from 'next/image'
import bolo from '@/public/images/produtos/bolo-de-pote.jpg'

export function Hero() {
  return (
    <Image
      src={bolo}            // width/height/blurDataURL auto
      alt="Bolo de pote"
      placeholder="blur"
      preload               // replaces deprecated `priority`
      sizes="(max-width: 768px) 100vw, 400px"
    />
  )
}
```

---

## Metadata / OG / build / deploy

- `params` is a Promise in `generateMetadata`/`generateViewport` and icon/OG image functions (await it).
- `themeColor`/`colorScheme`/viewport moved OUT of `metadata` into a separate `export const viewport: Viewport`.
- `ImageResponse` imports from **`next/og`** (not `next/server`).
- Build symbols: ○ Static, ◐ Partial, ƒ Dynamic. Generated `opengraph-image`/`icon` routes show **ƒ — that is normal**.

**Rules**

- `metadata`/`generateMetadata` are **Server-Component-only**. Client-heavy pages (PDV, KDS) get a server `page.tsx` that exports metadata and renders the client component.
- Root layout: static `export const metadata` with `metadataBase: new URL('https://<domain>')`, a title template (`default` is **required** when you set `template`), and `openGraph`.
- Declare `themeColor`/`colorScheme` via `export const viewport`.
- Favicon: `app/favicon.ico` at top level only. File-based icons: `app/icon.(ico|jpg|png|svg)`, `app/apple-icon.(jpg|png)` — SVG allowed for `icon` but NOT `apple-icon`/`favicon`.
- Generated image routes `export default` a function returning `ImageResponse`, plus `size`/`contentType` (`alt` for OG/twitter). OG default 1200×630 `image/png`.
- **Do NOT add `output: 'export'` or `output: 'standalone'`** — Vercel is a verified adapter. Standard `next build`/`next start`.

**Gotchas that break lint/build**

- `export const metadata` in any `'use client'` file fails — the #1 trap here.
- Relative OG/twitter/canonical URL **without `metadataBase`** = hard build error.
- `opengraph-image` > 8 MB or `twitter-image` > 5 MB → build fails. `ImageResponse` supports only flexbox + a CSS subset — **`display: grid` does not work**.
- `ImageResponse` fonts: only ttf/otf/woff; next/font fonts are NOT auto-available — `readFile` the `.ttf` and pass it in `fonts`.

```tsx
// app/layout.tsx — static metadata (Server Component)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://sarahrangel.vercel.app'),
  title: {
    default: 'Sarah Rangel — Café & Confeitaria Artesanal',
    template: '%s · Sarah Rangel',
  },
  description: 'Sistema de gestão para café & confeitaria.',
  applicationName: 'Cereja',
}
```

```tsx
// app/viewport (theme-color for light/dark "cacau")
import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F6F8' }, // porcelana
    { media: '(prefers-color-scheme: dark)', color: '#1C1210' },  // cacau escuro
  ],
}
```

---

## Testing (Vitest + Playwright)

- Next 16's bundled testing docs are **identical to 13/14/15** — no Next-16-specific test wiring. Any breakage comes from React 19 / Vite plugin version skew.
- Vitest config should be `vitest.config.mts` (ESM). For `@/*` aliases you **must** add `vite-tsconfig-paths`.
- Vitest does **not** support `async` Server Components — cover those with Playwright (low risk here).
- Run Playwright against the **production build** (`next build && next start`) via `webServer`; use `next dev` only for fast local iteration.

**Gotchas that break tests**

- **jsdom has no `BroadcastChannel`** — this app uses it for cross-tab sync, so any store/component test throws `BroadcastChannel is not defined`. Polyfill in a setup file.
- Zustand `persist` leaks `localStorage` between tests — `localStorage.clear()` and reset the store in `beforeEach`.
- `@/*` won't resolve without `vite-tsconfig-paths`.
- `toBeInTheDocument()` needs `@testing-library/jest-dom` imported in `setupFiles`.

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./vitest.setup.ts'] },
})
```

```ts
// vitest.setup.ts — jest-dom + BroadcastChannel polyfill (required for this app)
import '@testing-library/jest-dom/vitest'

if (typeof globalThis.BroadcastChannel === 'undefined') {
  class BC {
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    onmessage: ((e: MessageEvent) => void) | null = null
  }
  // @ts-expect-error test polyfill
  globalThis.BroadcastChannel = BC
}
```

```ts
// Pure-domain test (node env, no DOM) — ideal for lib/domain
// @vitest-environment node
import { expect, test } from 'vitest'
import { calcularDivergencia } from '@/lib/domain/estoque'

test('divergência teórico vs contado', () => {
  expect(calcularDivergencia({ teorico: 10, contado: 7.6 })).toBeCloseTo(2.4)
})
```

```ts
// playwright.config.ts — webServer against the production build
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```
