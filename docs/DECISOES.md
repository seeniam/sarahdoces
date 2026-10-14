# Decisões — Sistema "Cereja"

Registro curto de escolhas feitas quando algo era ambíguo ou precisava ser
resolvido (CLAUDE.md: "escolha o mais simples e anote aqui"). Seções em ordem de
fase.

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

### D0.7 — Imagens de fallback
Sem o logo e as fotos reais ainda, usamos a marca SVG própria e 7 fotos de banco
livre (Unsplash) baixadas para `public/images`. Créditos em
`public/images/CREDITOS.md`; pendências em `docs/PENDENCIAS-CLIENTE.md`.

## Fase 1 — Tipos, dados mock e regras de negócio

### D1.1 — Stores: consolidados + hidratação pós-montagem
Em vez de um store persistido por domínio (duplicaria o histórico de 30 dias no
localStorage), um `useDadosStore` (banco inteiro) + `useSessaoStore` (usuário/
loja). Os domínios são acessados por seletores. Ambos usam `skipHydration: true`
e re-hidratam no hook `useHidratado` (pós-montagem) — assim servidor e primeiro
render do cliente mostram o mesmo estado inicial (sem mismatch). Sincronização
entre abas por `storage`/BroadcastChannel (reaplica o estado nas outras abas).

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

### D3.2 — Autorização por PIN: desconto/cortesia (carrinho) e cancelamento
No carrinho, editar +/−/remover é livre (é rascunho). O que exige PIN de
gerente/dona + motivo e gera EventoAuditoria é **Desconto/Cortesia** (vetor de
fraude de preço) e o **cancelamento de uma comanda já ENVIADA**; o cancelamento
de **item** após o envio entrou no escopo na Fase 4 (ver D4.2). O PIN de
atendente é recusado (demonstra "desconto sem PIN"). Preço nunca é editável.

### D3.3 — Impressão da comanda (80mm)
`components/print/TicketTermico.tsx` tem a classe `ticket-print`, isolada pelo
CSS `@media print` (@page 80mm). O "momento" (comanda saindo impressa) é um
clip-path de ~700ms, respeitando prefers-reduced-motion. O `window.print()`
imprime só o cupom.

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

### D3.6 — "Cancelar" após envio ~~é no nível da comanda~~ **SUBSTITUÍDA por D4.2**
**SUBSTITUÍDA por D4.2** (cancelar item após envio entrou no escopo na Fase 4).
Registro original: na Fase 3, só o cancelamento da **comanda inteira** (com PIN +
motivo) foi implementado; o cancelamento de item isolado ficou como pendência —
que o arquiteto trouxe para o escopo na Fase 4.

## Fase 4 — KDS + cancelar item (decisões do arquiteto)

### D4.1 — Item da comanda é referenciado por índice (sem id próprio)
`ItemComanda` ganhou campos opcionais de cancelamento (`cancelado`,
`canceladoPor`, `motivoCancelamento`, `canceladoEm`, `canceladoAposPreparo`),
mas **não** ganhou `id`. As stores já operam por índice e o seed não gera ids;
o cancelamento referencia `{comandaId, itemIndex}`. Campos opcionais = seed e
persistência antigos continuam válidos. `MotivoPerda` ganhou
`cancelado_apos_preparo`. `persist.version` subiu 2→3 (sem migração destrutiva).

### D4.2 — Estorno × perda decidido pelo status ATUAL da comanda
Ao cancelar um item: comanda ainda `enviada` (na fila) → **estorna** o estoque;
`preparando`/`pronta` (já foi para a chapa) → vira **Perda** automática
(`cancelado_apos_preparo`). A `cancelarItemComanda` relê o status do estado
fresco (não de um snapshot) para não errar o ramo se o KDS avançar o status
enquanto o PIN está aberto, e retorna `{ok, jaPreparado}` para o PdvClient só
gerar EventoAuditoria + ticket quando o cancelamento realmente ocorre. Se o
último item ativo for cancelado, a comanda inteira vira `cancelada`.

### D4.3 — /cozinha fora do AppShell, com guard próprio
A rota `/cozinha` já fica fora do grupo `(app)` (tela cheia, sem sidebar). O KDS
replica o guard do AppShell (useHidratado → sessão → `podeAcessarRota`). Só o
perfil **cozinha** acessa; cada cozinheiro vê a sua loja (Seu Antônio = Loja 1,
Dona Lúcia = Loja 2). O destaque/som de "pedido novo" só dispara após a
hidratação, para não acender todos os cartões ao carregar.

### D4.4 — Sons sintetizados (sem asset) e o desbloqueio do autoplay
Som de impressão (pendência 16) e sino de pedido novo do KDS são **sintetizados
via Web Audio API** (sem mp3 em `public/`). O toggle "Som de impressão" (menu do
usuário, OFF por padrão) governa o som de impressão do PDV. O sino do KDS é um
recurso central da cozinha, mas o autoplay é bloqueado pelo navegador até um
gesto do usuário; por isso o KDS mostra uma faixa discreta "Toque para ativar o
som dos pedidos" que some após o primeiro toque e lembra a escolha na sessão da
aba (`sessionStorage`).

### D4.5 — QR do Pix com selo "Demonstração" (pendência 14)
Selo diagonal discreto sobre o QR, em cinza (não vermelho — a direção de arte
evita confundir a marca com erro).

## Fase 5 — Painel da Dona

### D5.1 — Comparação justa e janelas no fuso de Fortaleza
As métricas vivem em `lib/domain/painel.ts` (puras, testadas). "Hoje" compara
com o MESMO dia da semana passada até o mesmo horário decorrido; "7/30 dias"
comparam com o período imediatamente anterior de mesmo tamanho. Tudo calculado
no fuso América/Fortaleza. Faturamento = itens ativos − desconto (cancelados
fora); descontos aparecem como linha própria.

### D5.2 — Lucro estimado e rateio das despesas fixas
`Lucro estimado = faturamento − CMV − perdas − despesas`, com as despesas fixas
mensais rateadas por dia (mensal/30 × dias do período). O aluguel é marcado por
loja no seed (P&L por loja correto); despesas sem loja dividem 50/50. Rotulado
"estimado" + sheet "Como calculamos".

### D5.3 — Volume do seed calibrado para um negócio saudável
A base de comandas/dia subiu para 56 (Centro) / 46 (Cohama) para que o
faturamento supere com folga as despesas fixas (R$ 21.700/mês) e o painel mostre
um lucro plausível — antes o volume era baixo demais e o "lucro estimado" saía
negativo. As compras do seed escalam com o consumo, então o estoque continua
saudável. Determinismo preservado (contagem por índice/dia estável).

### D5.4 — Ao vivo entre abas
O painel recalcula tudo a partir do `useDadosStore` (sincronizado entre abas por
`sync.ts`). Uma venda paga noutra aba aparece sem recarregar; um efeito observa o
último pagamento e mostra o aviso "Nova venda · … · R$ …" (só para vendas novas
da loja filtrada, nunca na carga inicial nem antes da abertura). O número-herói
só anima quando há venda nova de fato (gatilho = id do último pagamento), nunca
pelo tique do relógio.

### D5.5 — Estados
Antes das 6h30 (Fortaleza), "hoje" mostra um estado próprio ("A loja ainda não
abriu. Ontem: R$ X") em vez de gráficos zerados. A hidratação é coberta pelo
skeleton do AppShell.

## Fase 6 — Estoque, compras, contagem, fichas técnicas e perdas

### D6.1 — Movimentação é uma visão DERIVADA (não uma coleção persistida)
O estoque teórico "= soma das movimentações" (compra, consumo, perda,
transferência, ajuste de contagem, saldo inicial), mas **não** refizemos o
modelo de persistência: `construirMovimentacoes()` (em `lib/domain/estoque.ts`)
monta o extrato de um insumo/loja a partir das coleções que já existem (compras,
comandas, perdas, transferências, contagens). O **saldo inicial** é o "plug" que
reconcilia a soma ao teórico gravado (`EstoqueLoja.qtdTeorica`), de modo que
`estoqueTeorico(now)` sempre bate com `qtdTeorica` (teste cobre todos os pares).
Motivo: ganhar o extrato e o balanço exigidos sem um refactor destrutivo da store
(que já mantém `qtdTeorica` nas mutações). O consumo por venda é **agregado por
dia** no extrato (uma linha por dia), para ficar legível.

### D6.2 — "Sem explicação" é a mesma conta do painel
O balanço "Para onde foi a carne?" (`balancoInsumo()`) e o alerta de divergência
do painel usam o **mesmo** número: `teórico ao fim do período − contado`. Para
isso o período do balanço **termina na data da contagem** e o seed passou a
gravar o `teorico` da contagem **no momento da contagem** (não o teórico final de
hoje). A contagem física é dada às **23h** do dia (depois do último pedido), para
o consumo diário agregado cair inteiro antes dela e a conta reconciliar exata
(teste: carne Loja 1 = 2,4 kg = R$ 91,20, igual ao painel).

### D6.3 — A contagem NÃO sobrescreve o teórico
Registrar uma contagem grava o físico (`qtdUltimaContagem` + `dataContagem`) e
expõe a divergência, mas **não** acerta o teórico ao contado. Isso mantém a
história "a carne que some" visível (teórico 10 × contado 7,6) e mantém a
reconciliação do extrato. Divergência relevante (> 3% ou > R$ 20) gera
`EventoAuditoria` crítico.

### D6.4 — Contagem cega = mesmo princípio do caixa cego
Na `/estoque/contagem` o gerente digita o contado **sem ver o teórico**; a
divergência (qtd e R$) só aparece ao concluir. Conta um subconjunto de insumos de
maior valor/giro (não os ~40), com campos numéricos grandes e progresso.

### D6.5 — Compra atualiza custo médio e lança saída no financeiro
`registrarCompra` entra no estoque, recalcula o **custo médio ponderado** do
insumo (estoque negativo não credita custo) e lança uma **despesa paga** (saída
no financeiro). Simplificação da demo: a despesa usa a categoria "outros"; o DRE
da Fase 7 refina a relação compra × CMV.

### D6.6 — Fichas editáveis só na sessão (não persistem)
No detalhe da ficha técnica dá para simular quantidades e ver o CMV/margem
recalcularem ao vivo, mas os ajustes **não são salvos** (demo). A calculadora de
rendimento vem pré-preenchida com a quantidade de carne da última compra.

### D6.7 — Sub-navegação do estoque por abas de rota
`/estoque`, `/estoque/compras`, `/estoque/contagem` e `/estoque/transferencias`
compartilham uma barra de abas (`EstoqueNav`). O menu lateral mantém só a entrada
`/estoque` (o resto é sub-rota, já coberto por `podeAcessarRota`).

### D6.8 — Correções da revisão adversarial da Fase 6
Revisão em workflow (4 dimensões + verificação por achado). Aplicados:
- **Saldo inicial determinístico**: insumos sem movimentação própria tinham o
  saldo inicial carimbado com `new Date()` (relógio real) — quebrava o seed
  determinístico e `estoqueTeorico(ate)`. Agora a âncora é o início do banco
  (1ª data de comanda/compra), coberto por teste.
- **Custo médio global ponderado por TODAS as lojas**: como `custoMedio` é por
  insumo (global), a compra numa loja pondera com o estoque das duas, senão
  distorceria o valor em R$ da outra (inclusive o R$ 91,20 do painel).
- Fichas: edição de quantidade como texto (permite decimais ao digitar).
- Contagem: trocar de loja zera a contagem em andamento.
- "Repetir última do Mateus" abre a folha já preenchida.
- Extrato: rótulo "Em estoque (contado/teórico)" conforme houve contagem.
- Compra: total exibido só soma linhas válidas; inputs com `aria-label`.

Mantido de propósito: o bloco "Para onde foi a carne?" é **sempre 7 dias até a
contagem** (não segue o seletor 7/30 do painel de perdas), para a conta bater
exatamente com o alerta do painel; o cabeçalho diz "Últimos 7 dias".

## Fase 7 — Financeiro e Auditoria

### D7.1 — Fechamento de caixa é por forma de pagamento (Pix fora)
`SessaoCaixa` ganhou `esperadoPorForma`/`informadoPorForma`/`diferencaPorForma`
(dinheiro, débito, crédito). O atendente informa às cegas os três; **Pix não
entra** ("confere direto pelo banco"). O dinheiro esperado considera o troco
inicial, as sangrias (saem) e os suprimentos (entram); débito/crédito são as
vendas na forma. `diferenca` (escalar, compat) passou a ser a soma das três.
Função única: `fecharCaixaCegoPorForma` (seed e store usam a mesma).

### D7.2 — Qualquer diferença gera evento; o painel só alerta se relevante
`fecharCaixa` cria um `EventoAuditoria` sempre que a diferença ≠ 0 (crítico se
|dif| ≥ R$ 15, senão info). O alerta do painel continua filtrando por |dif| ≥ 15,
então diferenças pequenas ficam na auditoria sem "gritar" na tela da Dona.

### D7.3 — DRE e lucro do painel são a MESMA função
`dreDoPeriodo()` (em `lib/domain/painel.ts`) é a fonte única: o "lucro estimado"
do painel e a cascata da `/financeiro` chamam-na. Teste cobre que batem nos três
períodos. A cascata é um waterfall clicável (cada degrau abre o detalhe).

### D7.4 — Auditoria é só leitura (imutável)
Não existe ação de editar/apagar evento no store nem na UI; a tela diz
"Registros de auditoria não podem ser alterados". O `registrarEvento` só
acrescenta (append-only). Teste garante que `pontosDeAtencao` não muta o banco.

### D7.5 — "Pontos de atenção" em linguagem neutra
A tela e a função `pontosDeAtencao` nunca usam "suspeito", "fraude" ou "risco"
no texto visível (teste verifica). Mostra indicadores vs. a média da equipe e a
observação fixa: "Padrões fora da média indicam onde conversar e acompanhar, não
comprovam irregularidade." Motivo: a Sarah usa isso com funcionários reais.

### D7.6 — Alertas do painel são deep-links
O alerta de cancelamentos leva a `/auditoria?aba=atencao&pessoa=<id>`; o de caixa
a `/auditoria?tipo=caixa_diferenca`; o de divergência continua indo ao extrato
em `/estoque` (onde se investiga a falta). A `/auditoria` lê esses parâmetros.

### D7.7 — "Fechar caixa" vive no PDV, não no menu global
O controle de caixa (status + sangria/suprimento/fechar) fica na coluna da
comanda no desktop e numa faixa no topo no celular. Sangria exige PIN de
gerente/dona (reusa `PinAutorizacao`); suprimento não.

### D7.8 — Correções da revisão adversarial da Fase 7
- **Despesa recorrente × avulsa**: `Despesa` ganhou `recorrente`. Custos fixos
  (aluguel, folha…) são rateados por dia na DRE; contas avulsas contam pelo
  valor cheio só quando caem no período (por `pagoEm`/vencimento). Antes, as
  avulsas eram amortizadas como se fossem mensais, distorcendo o lucro.
- **Fluxo de caixa**: despesas sem loja passaram a ser rateadas (÷2) quando se
  filtra uma loja, em vez de sumirem (igual à DRE).
- **Sangria na auditoria**: a retirada guarda quem autorizou (`Sangria.autorizadorId`)
  e gera um `EventoAuditoria` do tipo novo `"sangria"` (o PIN agora deixa rastro).
- Menores: "Pago no mês" conta só pagamentos do mês corrente; DRE do Faturamento
  mostra "Pix" (não o id cru); filtro de tipo da URL validado; quebra do fluxo em
  cartões no 390; keys estáveis no detalhe da DRE.
