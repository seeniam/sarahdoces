# Plano de Execução — Sistema "Cereja" · Sarah Rangel Doces

Cole **um prompt por vez** no **Claude Code** (o executor do projeto). Só avance quando a fase anterior tiver as evidências do "Fechamento" e você tiver revisado as telas no navegador.

**Nível visual exigido em TODAS as fases: premium, sob medida, nada genérico.** A referência é `docs/DIRECAO-DE-ARTE.md`.

---

## Antes de começar (tarefa do Neemias)

1. **Logo em alta**: baixar do Instagram/Linktree (ou pedir à cliente) → `public/brand/logo.png` (de preferência PNG transparente). Se só houver JPG, tudo bem, o Claude Code recorta/ajusta.
2. **Fotos reais dos produtos**: 15 a 25 fotos do Instagram da @sarahdoces (café, cuscuz, PF, porções, sucos, bolos, doces, vitrine, fachada/salão) → `public/images/produtos/` com nomes em slug (`cuscuz-completo.jpg`, `bolo-de-pote.jpg`…). **Esse é o maior diferencial da demo**: ela vai ver a comida dela no sistema. Como a demo é só para ela, o uso é de apresentação. Se possível, avise-a ou peça autorização informalmente.
3. **Foto-herói** para login/landing (salão, balcão ou mesa bonita) → `public/images/hero.jpg`.
4. Confirmar com a cliente: nomes reais das 2 lojas e 10 preços principais.

Se algum item faltar, o Claude Code usa o fallback da direção de arte (Unsplash/Pexels baixado, com créditos) e deixa a lista do que falta em `docs/PENDENCIAS-CLIENTE.md`.

---

## Fase 0 — Setup e fundação visual

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- Verification Before Completion

Usar quando aplicável:
- Brainstorming (só para o desenho do módulo de azulejo, se houver dúvida entre variações)

```
Leia CLAUDE.md, docs/PRD.md, docs/DIRECAO-DE-ARTE.md e docs/PLANO-DE-EXECUCAO.md por inteiro.

1. Crie o projeto Next.js (App Router, TS strict, Tailwind v4, ESLint, src/, alias @/*) com pnpm na raiz,
   instale a stack do CLAUDE.md + vitest + @playwright/test (instale o Chromium do Playwright) e inicialize o shadcn/ui
   com os componentes: button card input label badge dialog sheet tabs table select dropdown-menu avatar separator
   tooltip scroll-area skeleton sonner calendar popover command switch progress toggle-group.
2. Implemente a fundação visual EXATAMENTE como na direção de arte:
   - tokens de cor (claro e escuro "cacau"), sombras tingidas de cacau, hierarquia de raios;
   - fontes Gloock + Hanken Grotesk via next/font, com tabular-nums utilitário;
   - components/brand/Azulejo.tsx: módulo de azulejo SVG ORIGINAL (rosácea geométrica que forma novo motivo ao repetir)
     + lib/brand/azulejo.ts exportando data-URI para background; variações de opacidade;
   - components/brand/Logo.tsx: usa public/brand/logo.png se existir, senão um SVG de duas cerejas desenhado por nós;
   - 6 ícones de linha próprios das categorias (xícara, cuscuzeira, prato, coxa de frango, copo de suco, fatia de bolo);
   - pipeline de imagens: next/image com AVIF/WebP, blur placeholder, componente <FotoProduto> com fallback elegante (fundo açúcar + ícone de linha, nunca emoji);
   - se faltarem fotos em public/images/produtos, baixe fotos livres (Unsplash/Pexels) para lá e registre os créditos em public/images/CREDITOS.md.
3. Crie /design-system: paleta, escala tipográfica, número-herói, botões em todos os estados, badges de status, o azulejo, os ícones,
   um card de produto com foto e uma prévia da comanda térmica com borda serrilhada.
4. Crie docs/DECISOES.md e scripts/screenshots.ts (Playwright: recebe lista de rotas, fotografa em 390/1024/1440, claro e escuro, salva em docs/qa/fase-N/).

Fechamento: lint, typecheck e build verdes; screenshots de /design-system revisados contra a seção 9 (PROIBIDOS) e ajustados; commit.
```

## Fase 1 — Tipos, dados mock e regras de negócio

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- Writing Plans
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- code-review

```
Implemente src/types/index.ts com o modelo de dados do PRD §7.3.
Crie lib/mock/data (lojas, usuários, categorias, produtos com adicionais e campo `foto` apontando para public/images/produtos,
~35 insumos com unidades e custos realistas de São Luís/MA, fichas técnicas de TODOS os produtos) e lib/mock/seed.ts determinístico
gerando 30 dias de: comandas+pagamentos, compras (Mateus, Atacadão, Açougue Bom Corte, Hortifruti), perdas, contagens,
sessões de caixa, despesas, encomendas e eventos de auditoria, com as anomalias plantadas do CLAUDE.md.
Padrão de movimento realista: picos 6h30–9h e 11h30–13h30, fim de semana mais forte em doces, Loja 1 ~55% do faturamento.
Stores Zustand com persist por domínio + sincronização entre abas (BroadcastChannel) desde já.
lib/domain com funções puras: baixarEstoquePorComanda, calcularCMV, calcularDivergencia, calcularDRE, scoreDeRisco,
fecharCaixaCego, registrarEvento, resetarDemo.

Fechamento: testes Vitest cobrindo lib/domain (incluindo casos negativos: estoque zerado, desconto sem PIN, caixa com diferença);
um teste que confirma que o seed é determinístico e que as anomalias aparecem nos cálculos; lint, typecheck, build; commit.
```

## Fase 2 — Login, layout e navegação

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- security (só para revisar que as rotas respeitam o perfil, mesmo sendo mock)

```
Login (é o primeiro "uau" da demo): metade da tela é uma parede de azulejo nítida com a foto-herói e o logo por cima;
na outra metade, escolha de perfil por avatar e um PIN pad numérico grande e tátil (feedback de toque, erro com tremida curta).
No celular, a parede de azulejo vira uma faixa no topo.
Sessão mock em Zustand. Redirecionamento: Dona→/painel, Gerente/Atendente→/pdv, Cozinha→/cozinha.
Layout (app): sidebar cacau com azulejo a 5–7% só no rodapé, logo no topo, itens com ícones lucide strokeWidth 1.5, recolhível;
topbar com seletor de loja usando a cor da loja (Loja 1 cereja, Loja 2 azulejo, "Todas" neutro, só Dona/Gerente veem "Todas"),
sino de alertas com contador, menu do usuário (trocar usuário, tema, resetar demo).
Celular: bottom navigation com 5 itens + "Mais". Menu filtrado por perfil (PRD §4). Guarda de rotas por perfil.

Fechamento: screenshots de login, layout vazio e menu em 390/1024/1440, claro e escuro, revisados contra a direção de arte;
teste de navegação por perfil (Playwright); lint, typecheck, build; commit.
```

## Fase 3 — PDV e comanda térmica

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- code-review
- security (fluxo de autorização por PIN)

```
/pdv para tablet em três zonas (ver direção de arte §6):
- trilho vertical de categorias com os ícones próprios;
- grade de produtos com FOTO real 4:3, nome, preço em tabular-nums, busca rápida; toque adiciona com feedback imediato;
- à direita a "comanda viva": papel branco com borda serrilhada, tipo Mesa/Balcão/Viagem + identificador, itens com +/−,
  adicionais e observação via sheet, subtotal grande.
O preço NÃO é editável. "Desconto/Cortesia" e "Cancelar item" abrem modal com PIN de Gerente/Dona + motivo e geram EventoAuditoria.
"Enviar para cozinha": cria Comanda numerada, baixa estoque pela ficha técnica e executa O momento de animação do sistema:
a comanda sai "impressa" (clip-path de cima para baixo, ~700ms) mostrando components/print/TicketTermico.tsx fiel a 80mm
(faixa de azulejo em preto, logo, nº em Gloock grande, mesa/cliente, atendente, hora, QUANTIDADES em destaque, observações em negrito),
com botão Imprimir (window.print + @page 80mm). Depois ela vai para "Comandas abertas".
Pagamento: Pix (QR mock + confirmação), dinheiro (teclado de valor + troco), débito, crédito, misto.
Abertura de caixa obrigatória se não houver sessão aberta. Respeitar prefers-reduced-motion.

Fechamento: teste E2E do fluxo completo (abrir caixa → pedido → enviar → pagar) e do fluxo negativo (desconto sem PIN e PIN errado);
teste de impressão (screenshot da página de impressão 80mm); screenshots 1024/1280 e 390 revisados; lint, typecheck, build; commit.
```

## Fase 4 — Cozinha (KDS)

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- Systematic Debugging (se a sincronização entre abas falhar)

```
/cozinha em tela cheia, fundo cacau, cartões como papel de comanda com faixa da cor da loja no topo.
Colunas Novos | Preparando | Prontos. Cartão: nº grande em Gloock, mesa/cliente, cronômetro com cor
(pistache <8min, doce-de-leite <15, alerta >15), itens com quantidade ENORME ("1× OVO FRITO"), observações destacadas.
Toque avança o status com layout animation. Pedido novo vindo de outra aba (BroadcastChannel) chega com um som suave e um destaque único.
Botão fixo "Registrar perda": item, quantidade, motivo em botões grandes, foto opcional (mock).
Topo: pedidos na fila e tempo médio de hoje.

Fechamento: teste E2E com duas páginas (PDV envia, KDS recebe sem recarregar); screenshots 1024/1280 revisados; lint, typecheck, build; commit.
```

## Fase 5 — Painel da Dona

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- code-review

```
/painel seguindo o wireframe da direção de arte §6 (NÃO é uma grade de cards iguais):
- "Bom dia, Sarah" + seletor de período (Hoje/7 dias/30 dias) e loja;
- número-herói do faturamento em Gloock 61px com R$ menor e comparação com o mesmo dia da semana anterior;
- faixa de alertas do "Olho da Dona" (3 mais graves, link para auditoria), em carrossel no celular;
- vendas por hora (área, 2/3 da largura), Loja 1 × Loja 2 (cereja × azulejo), formas de pagamento, top 8 produtos COM miniatura da foto,
  "Venda × Perda" por dia, pedidos, ticket médio, perdas (R$ e %), lucro estimado, tempo médio de preparo.
Recharts com as cores da marca, eixos discretos, tooltips em BRL e pt-BR, skeletons no carregamento.

Fechamento: conferir 3 números do painel contra cálculo independente em teste; screenshots 390 (prioridade máxima), 1024 e 1440,
claro e escuro, revisados; lint, typecheck, build; commit.
```

## Fase 6 — Estoque, compras, fichas técnicas e perdas

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- code-review

```
/estoque: tabela densa e bem tratada (números à direita, tabular-nums, status com ponto + texto), por loja.
/estoque/compras: lista + nova compra (fornecedor, itens dinâmicos, valor, foto do cupom mock) que soma estoque e lança saída no financeiro.
/estoque/contagem: contagem guiada com campos numéricos grandes; ao concluir, divergência por item em quantidade e R$, com evento de auditoria.
/estoque/transferencias: entre lojas, com as cores das lojas.
/fichas-tecnicas: produtos com foto, CMV, preço e margem; detalhe editável; calculadora de rendimento
("20 kg de carne crua → fator 0,65 → 13 kg → 108 PFs de 120 g").
/perdas: registro + painel por motivo, insumo, pessoa e loja, e o destaque "Carne: comprado × vendido × perdido × sem explicação"
(barras empilhadas, a parte "sem explicação" em alerta). Estados vazios com azulejo.

Fechamento: testes de divergência e rendimento; E2E de compra → estoque → contagem; screenshots revisados; lint, typecheck, build; commit.
```

## Fase 7 — Financeiro e Auditoria

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- security (trilhas de auditoria append-only e autorização)
- code-review

```
/financeiro com abas: Fluxo de caixa; Caixas (sessões com esperado × informado × diferença); Despesas/contas a pagar (CRUD mock);
DRE simplificada em cascata (Faturamento − CMV − Perdas − Despesas = Lucro).
Fechamento cego no PDV: atendente informa valores por forma de pagamento sem ver o esperado; diferença vai para a auditoria.
/auditoria: timeline de eventos com filtros (tipo, loja, pessoa, severidade), detalhe (quem, quem autorizou, valor impactado, antes→depois),
"Score de risco por atendente" com explicação em linguagem simples (ex.: "Bruno cancelou 3× mais que a média da equipe").
Eventos são somente leitura na interface.

Fechamento: E2E do fechamento cego com diferença gerando alerta no painel; screenshots revisados; lint, typecheck, build; commit.
```

## Fase 8 — Comandas, Encomendas, Equipe, Cardápio e Configurações

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

Usar quando aplicável:
- code-review

```
/comandas: histórico com filtros e detalhe com linha do tempo (criada→enviada→pronta→paga, com responsáveis); reimprimir gera log.
/encomendas: kanban por status com fotos 1:1 dos produtos + calendário semanal; formulário completo; "Chamar no WhatsApp" (wa.me).
/equipe: usuários, perfis, loja, PIN mascarado, desempenho resumido.
/cardapio: produtos com foto, categorias e adicionais; alterar preço só Dona/Gerente, gerando evento com preço antigo→novo.
/configuracoes: lojas, impressora (mock), formas de pagamento, resetar demo.

Fechamento: E2E de alteração de preço por atendente (bloqueado) e por gerente (permitido + log); screenshots revisados; lint, typecheck, build; commit.
```

## Fase 9 — Modo Apresentação e landing

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- frontend-design
- QA / Quality Assurance
- Verification Before Completion

```
Landing "/" feita para a Sarah: foto-herói real, logo, uma frase direta ("Cada pedido registrado, cada grama de carne contada.")
e três blocos dor → solução com imagens/recortes reais das telas do sistema: Fila e quadro → comanda na cozinha;
Venda sem registro → nada sai sem comanda + auditoria; Carne que some → estoque contado e perdas registradas.
Botão "Entrar na demonstração". Sem jargão de marketing.
Modo Apresentação (no login e no menu): tour guiado com overlay e destaque de elemento cobrindo os 4 fluxos do PRD §6,
com dados preparados para cada passo e botão "Reiniciar tour".
Metadados, OG image com a marca, favicon de cereja.

Fechamento: rodar o tour inteiro via Playwright sem erros no console; screenshots da landing em 390/1440; Lighthouse ≥ 90; commit.
```

## Fase 10 — Revisão final antes do deploy

**SKILLS RECOMENDADAS**
Obrigatórias neste WP:
- code-review
- QA / Quality Assurance
- frontend-design
- Verification Before Completion

Usar quando aplicável:
- Systematic Debugging (para qualquer falha encontrada)

```
Faça uma revisão final completa:
1. QA exploratório em todas as rotas, em 390/768/1024/1440, claro e escuro: imagens, textos cortados, rolagem horizontal, foco, contraste, estados vazios/loading/erro.
2. Passe cada tela pela lista de PROIBIDOS da direção de arte e corrija o que estiver genérico.
3. Code review do diff inteiro: duplicação, acoplamento, regras fora de lib/domain, any, componentes client desnecessários.
4. Rode lint, typecheck, testes unitários, E2E e build de produção; confirme git status limpo.
5. README com instruções, credenciais de demo (PINs) e roteiro de apresentação de 5 minutos.
Entregue um relatório com as evidências (saídas dos comandos e pasta de screenshots).
```

---

## Deploy (Neemias)
1. `gh repo create <sua-org>/sarah-rangel-doces --private --source=. --push`
2. Vercel → Import → Next.js → Deploy.
3. Testar no celular (painel) e num tablet (PDV e KDS em duas abas para mostrar o pedido chegando "ao vivo").
