# Decisões — Sistema "Cereja"

Registro curto de escolhas feitas quando algo era ambíguo ou precisava ser
resolvido (CLAUDE.md: "escolha o mais simples e anote aqui").

## Fase 0 — Setup e fundação visual

### D0.1 — Documentos movidos para `docs/`
CLAUDE.md, PRD e plano referenciam `docs/PRD.md`, `docs/PLANO-DE-EXECUCAO.md`,
`docs/DIRECAO-DE-ARTE.md`, `docs/qa/`, `docs/DECISOES.md`. Os `.md` estavam na
raiz; movidos para `docs/`. `CLAUDE.md` permanece na raiz (convenção).

### D0.2 — Paleta/fontes: vence a DIREÇÃO DE ARTE ✅ RESOLVIDO (confirmado pelo arquiteto)
`CLAUDE.md` traz uma paleta antiga (cereja `#B3263A`, fundo **creme**, fontes
Fraunces/Plus Jakarta/Parisienne). `docs/DIRECAO-DE-ARTE.md` define o conceito
atual "Confeitaria de azulejo" (porcelana `#F5F6F8`, cereja `#9E1B32`, azulejo
`#1E4F91`, **Gloock + Hanken Grotesk**) e **proíbe fundo creme**. O PRD §8 e a
direção de arte dizem explicitamente que, em aparência, a direção de arte vence;
o plano da Fase 0 manda implementar "EXATAMENTE como na direção de arte".
**Decisão:** seguir `DIRECAO-DE-ARTE.md`. **Resolvido: direção de arte
confirmada pelo arquiteto** (aprovação da Fase 0). A seção "## Design" do
CLAUDE.md foi atualizada para a direção de arte; removidas as menções a creme,
Fraunces, Plus Jakarta Sans e Parisienne.

### D0.3 — Next.js 16 com `cacheComponents` DESLIGADO
O `create-next-app` veio com `cacheComponents: true` + `partialPrefetching`.
Como o app é 100% mockado no cliente (Zustand + localStorage + BroadcastChannel,
sem backend), PPR/`use cache` não cacheiam nada e só adicionam risco de quebra de
build (IO síncrono em Server Components, `<Suspense>` obrigatório em
`useSearchParams`, preservação de estado via `<Activity>`). Ambos desligados.
`typedRoutes` ligado. Detalhes e regras em `docs/NEXT16-NOTES.md`.

### D0.4 — shadcn/ui com Base UI + preset base-nova
O CLI novo do shadcn usa presets. Escolhido **Base UI** (recomendado, React 19 /
Next 16) com preset **base-nova** (Lucide). Tokens semânticos do shadcn
remapeados para a paleta de marca em `globals.css`. `cn` vem do pacote `cn`
(padrão base-nova).

### D0.5 — Tema por `next-themes` (classe `.dark`)
O componente Sonner já depende de `next-themes`. Usamos `next-themes` como fonte
única do tema (classe `.dark`, sem flash, `storageKey: "cereja-tema"`,
`defaultTheme: "light"`, sem seguir o sistema para a demo ser previsível). O modo
escuro é o "cacau" da direção de arte.

### D0.6 — Tailwind v4 via loader do Turbopack
O scaffold ligou o Tailwind v4 pelo loader `@tailwindcss/turbopack` no
`next.config.ts` (sem `postcss.config`/`tailwind.config`). Mantido assim.

## Fase 1 — Tipos, dados mock e regras de negócio

### D1.1 — Stores: consolidados + hidratação pós-montagem
Em vez de um store persistido por domínio (duplicaria o histórico de 30 dias no
localStorage), um `useDadosStore` (banco inteiro) + `useSessaoStore` (usuário/
loja). Os domínios são acessados por seletores. Ambos usam `skipHydration: true`
e re-hidratam no hook `useHidratado` (pós-montagem) — assim servidor e primeiro
render do cliente mostram o mesmo estado inicial (sem mismatch). Sincronização
entre abas por BroadcastChannel (avisa "mudou" → as outras re-hidratam).

### D1.2 — Datas do seed no fuso de São Luís (determinístico)
O seed constrói instantes com offset explícito `-03:00` e aritmética de
calendário em UTC, então a saída é idêntica em qualquer fuso (servidor UTC ou
navegador local). A UI formata datas sempre em `America/Fortaleza`
(`lib/format.ts`), evitando horários divergentes e mismatch de hidratação.

### D1.3 — Code-review da Fase 1 aplicado
Revisão adversarial (workflow) encontrou e corrigimos: hidratação dos stores
(D1.1), fuso/determinismo do seed e atribuição de dinheiro por dia (D1.2),
comparação cruzada descontos×cancelamentos e redação do score de risco em
`lib/domain/auditoria.ts`.

### D0.7 — Imagens de fallback
Sem o logo e as fotos reais ainda, usamos a marca SVG própria e 7 fotos de banco
livre (Unsplash) baixadas para `public/images`. Créditos em
`public/images/CREDITOS.md`; pendências em `docs/PENDENCIAS-CLIENTE.md`.
