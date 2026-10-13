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

### D1.4 — Âncora relativa a "hoje" + política de cache
`gerarSeed(agora)` ancora os 30 dias em **hoje** (São Luís): os 29 dias
anteriores + o dia corrente (índice 29). Os **valores** são determinísticos por
índice de dia (RNG com semente fixa), e o padrão também depende do **dia da
semana real** da data. O dia de hoje é **parcial**: só gera comandas até o
horário atual (o painel nunca mostra vendas no futuro). As anomalias plantadas
ficam sempre nos últimos 7 dias (contagem da carne = ontem; caixa −R$ 37 = 3
dias atrás).

O estado persistido guarda `dataAncora` (YYYY-MM-DD, São Luís) e `versaoSeed`.
Ao montar, `useHidratado` re-hidrata e, se `cacheInvalido` (virou o dia ou a
versão mudou), **regenera o seed para hoje**. **Escolha: reset total** — as
ações do dia anterior não são preservadas (mais simples; dentro do mesmo dia as
ações do usuário persistem normalmente entre recarregamentos). Para o estado
inicial (SSR + 1º render), o store usa uma **âncora fixa** só para servidor e
cliente baterem; a troca para "hoje" real acontece pós-montagem.

## Fase 2 — Login, layout e navegação

### D2.1 — Cozinha fora do grupo com sidebar
A tela cheia `/cozinha` (KDS) fica em `app/cozinha/` (fora do grupo `(app)`),
então usa só o layout raiz — sem sidebar/topbar. O grupo `(app)` tem a sidebar
cacau + topbar; o `(auth)/login` usa só o layout raiz.

### D2.2 — Guarda de rotas no cliente (AppShell)
Sem backend, a guarda é client-side: `AppShell` usa `useHidratado` (não pisca),
lê a sessão e, se não houver usuário → `/login`; se o perfil não pode acessar a
rota → `rotaInicial(perfil)`. Enquanto hidrata/redireciona, mostra skeleton.
Mapa de permissões por perfil em `lib/auth/navegacao.ts` (PRD §4).

### D2.3 — sharp habilitado para otimização de imagem
Sem sharp, a otimização AVIF do next/image degradava (herói do login saía
borrado/pequeno). Habilitado `sharp` (a Vercel também o usa em produção). O
herói tem `placeholder="blur"` para aparecer instantâneo.

## Fase 3 — PDV e comanda térmica

### D3.1 — Comanda em edição (carrinho) em store próprio, não persistido
`useComandaStore` guarda a comanda sendo montada (tipo, identificador, itens,
desconto). É transitório — não persiste (recarregar limpa o rascunho; as
comandas ENVIADAS ficam no `useDadosStore`). Mutações de runtime (enviar
comanda + baixa de estoque, pagamento, abrir caixa, evento) ficam em ações do
`useDadosStore`.

### D3.2 — Autorização por PIN: desconto/cortesia (carrinho) e cancelar comanda
No carrinho, editar +/−/remover é livre (é rascunho). O que exige PIN de
gerente/dona + motivo e gera EventoAuditoria é **Desconto/Cortesia** (vetor de
fraude de preço) — e o cancelamento de uma comanda já ENVIADA (Fase 8). O PIN de
atendente é recusado (demonstra "desconto sem PIN"). Preço nunca é editável.

### D3.3 — Impressão da comanda (80mm)
`components/print/TicketTermico.tsx` tem a classe `ticket-print`, isolada pelo
CSS `@media print` (@page 80mm). O "momento" (comanda saindo impressa) é um
clip-path de ~700ms, respeitando prefers-reduced-motion. O `window.print()`
imprime só o cupom.

### D0.7 — Imagens de fallback
Sem o logo e as fotos reais ainda, usamos a marca SVG própria e 7 fotos de banco
livre (Unsplash) baixadas para `public/images`. Créditos em
`public/images/CREDITOS.md`; pendências em `docs/PENDENCIAS-CLIENTE.md`.

## Fase 3 — correções da revisão

### D3.4 — Fotos só quando batem com o produto
Na revisão, várias fotos não correspondiam ao item (cuscuz = sopa verde, PF =
salmão, café com leite = foto de café, brigadeiro = pedaços de chocolate). Foram
removidas; ficaram só as que batem claramente (suco natural, fatia de bolo). O
resto usa o placeholder elegante (fundo nível 2 `#F1EEEC`, ícone de linha da
categoria em cacau 35% + azulejo discreto no canto). A grade fica intencional
mesmo 100% sem fotos. `CREDITOS.md` atualizado.

### D3.5 — Shell travado no viewport; rolagem interna por painel
`AppShell` passou de `min-h-dvh` (página rolava) para `h-dvh overflow-hidden`,
com o `<main>` rolando por conta própria. Assim o PDV fica como um POS de tablet:
a grade e a comanda rolam cada uma no seu painel e o rodapé da comanda (Total +
"Enviar para cozinha") fica **sempre visível**, sem rolar a página. Efeito
colateral corrigido: numa grade `grid` com altura definida, itens com
`aspect-ratio` colapsavam e cortavam nome/preço — o scroll foi movido para um
wrapper (a grade mantém altura natural), igual ao padrão já usado na comanda.

### D3.6 — "Cancelar" após envio é no nível da comanda
O pedido falava em "cancelar item com PIN após envio". Antes do envio, mexer no
item (+/−/remover) é livre (rascunho). Depois do envio a comanda está na cozinha;
o que faz sentido operacional é **cancelar a comanda inteira** com PIN de
gerente/dona + motivo, gerando `EventoAuditoria` (impacto negativo). Cancelar um
item isolado de um pedido já na cozinha ficou fora de escopo — anotado em
`docs/PENDENCIAS-CLIENTE.md` caso a cliente queira granularidade por item.
