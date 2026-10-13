# CLAUDE.md — Sarah Rangel Doces · Sistema "Cereja"

Você é o **Claude Code, executor** deste projeto (o arquiteto é o Claude no chat; o Neemias revisa e aprova cada fase). A especificação completa está em `docs/PRD.md`, a identidade visual em `docs/DIRECAO-DE-ARTE.md` e o plano por fases em `docs/PLANO-DE-EXECUCAO.md`. **Leia os três antes de qualquer tarefa.** Em produto, o PRD manda; em aparência, a direção de arte manda.

## Objetivo desta fase
Protótipo **frontend-only, muito bonito, com dados mockados e interativo**, para apresentar à cliente (dona de café & confeitaria com 2 lojas em São Luís/MA). Deploy na Vercel. Não existe backend.

## Stack (não trocar sem pedir)
- Next.js (App Router, última versão estável) + TypeScript `strict`
- Tailwind CSS v4 + shadcn/ui + lucide-react
- Recharts · framer-motion · sonner · zod · react-hook-form · date-fns (locale `ptBR`)
- Zustand com `persist` (localStorage) como banco mock
- pnpm como gerenciador de pacotes

## Estrutura de pastas
```
src/
  app/
    (auth)/login/            # escolha de perfil + PIN pad
    (app)/                   # layout com sidebar/topbar
      painel/                # M9 Dashboard da Dona (rota inicial após login de Dona)
      pdv/                   # M1
      cozinha/               # M2 KDS (layout fullscreen, sem sidebar)
      comandas/              # M3
      estoque/ (compras, contagem, transferencias)   # M4
      fichas-tecnicas/       # M5
      perdas/                # M6
      financeiro/ (caixa, despesas, dre)              # M7
      auditoria/             # M8
      encomendas/            # M10
      equipe/  configuracoes/ cardapio/               # M11
  components/
    ui/                      # shadcn
    layout/                  # Sidebar, Topbar, StoreSwitcher, UserMenu
    pdv/ kds/ charts/ shared/
    print/TicketTermico.tsx  # comanda 80mm
  lib/
    mock/seed.ts             # gerador determinístico (seed fixa) de 30 dias
    mock/data/*.ts           # produtos, insumos, usuários, lojas, fichas
    store/*.ts               # stores Zustand por domínio
    domain/*.ts              # regras puras: baixa de estoque, CMV, divergência, risco
    format.ts                # moeda BRL, datas pt-BR, unidades
  types/index.ts             # tipos do modelo de dados (PRD §7.3)
```

## Regras de código
- Idioma do **domínio e da UI: português do Brasil** (nomes de tipos e campos em PT, ex.: `Comanda`, `insumoId`). Código utilitário genérico pode ficar em inglês.
- Regras de negócio em `lib/domain` como **funções puras e testáveis**; componentes só chamam.
- Moeda sempre via `formatBRL()` (`Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`).
- Nada de `any`. Componentes server por padrão; `"use client"` só onde há estado/interação.
- Toda ação sensível (cancelar, desconto, cortesia, reimpressão, alterar preço, fechar caixa com diferença, perda) **gera `EventoAuditoria`** pela função `registrarEvento()`.
- Ao enviar comanda: baixar insumos pela ficha técnica (estoque teórico).
- Seed determinístico (ex.: `mulberry32(42)`) — a demo sempre mostra os mesmos números. Botão "Resetar demo" em Configurações e no menu do usuário.
- Rodar `pnpm lint` e `pnpm build` ao fim de cada fase; build não pode quebrar.

## Design (obrigatório e inegociável)
**Toda a parte visual segue `docs/DIRECAO-DE-ARTE.md`.** Leia esse arquivo antes de qualquer tela. O nível esperado é **premium**: um produto que pareça feito sob medida para esta confeitaria, nunca um template de admin.

Resumo (detalhes no documento):
- Conceito "Confeitaria de azulejo": cereja do logo + azulejo de São Luís + fotos reais da comida.
- Tokens em `globals.css` (`@theme`): `porcelana #F5F6F8`, `superficie #FFFFFF`, `cereja #9E1B32`, `cereja-calda #6F0F22`, `azulejo #1E4F91`, `acucar #F6DDDF`, `cacau #2B1B18`, `pistache #5E7F36`, `doce-de-leite #C98A2E`, `alerta #C8372D`.
- Fontes: **Gloock** (display e números-herói) + **Hanken Grotesk** (interface, `tabular-nums`). Logo real da cliente em `public/brand/` (fallback: SVG de cerejas).
- Loja 1 = cereja, Loja 2 = azulejo, em todos os gráficos e indicadores.
- Fotos reais em `public/images/produtos/<slug>.jpg` via `next/image`, com créditos em `public/images/CREDITOS.md`.
- Um único momento de animação orquestrado: a comanda "sendo impressa". O resto só anima em resposta a ações.
- PDV/KDS: alvos ≥ 56px. Painel impecável em 390px.
- Respeite a lista de PROIBIDOS (seção 9 da direção de arte).
- Toda fase termina com QA visual por screenshots (seção 11 da direção de arte).

## Dados mock — referências
- Lojas: "Loja 1 — Centro" e "Loja 2 — Cohama" (placeholders; ficam fáceis de renomear em `mock/data/lojas.ts`).
- Usuários: Sarah (Dona, PIN 1234), Glenda (Gerente, 2222), Ana, Bruno, Carla, Diego (Atendentes, 3333…), Seu Raimundo e Dona Lúcia (Cozinha, 4444).
- Preços: Café R$ 3, Café com leite R$ 4, Cuscuz c/ ovo R$ 8, Cuscuz completo R$ 14, Tapioca R$ 7–12, Ovo frito adicional R$ 2, PF de carne/frango R$ 20, Porção de frango R$ 25, Porção de carne R$ 30, Suco natural R$ 6, Fatia de bolo R$ 9, Brigadeiro gourmet R$ 4, Torta de limão (fatia) R$ 10, Bolo de pote R$ 12.
- Histórico de 30 dias com padrão realista: picos 6h30–9h (café) e 11h30–13h30 (almoço), fim de semana mais forte em doces.
- Plantar "anomalias" para a demo: Atendente "Bruno" com cancelamentos 3× acima da média; carne com 2,4 kg de divergência na semana; um fechamento de caixa com −R$ 37,00; perdas de ovo acima do normal.

## Fluxo de trabalho
1. Execute **uma fase por vez** conforme `docs/PLANO-DE-EXECUCAO.md`, usando as skills indicadas no bloco "SKILLS RECOMENDADAS" de cada fase.
2. Ao terminar a fase: lint + typecheck + testes + build + QA visual (screenshots revisados), resumo do que foi feito com as evidências, e commit com mensagem `feat(fase-N): ...`.
3. Não invente módulos fora do PRD. Se algo estiver ambíguo, escolha o mais simples e anote em `docs/DECISOES.md`.
