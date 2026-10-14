# Sarah Rangel · Gestão — protótipo "Cereja"

Protótipo navegável do sistema de gestão para a **Sarah Rangel — Café & Confeitaria
Artesanal** (duas lojas em São Luís/MA). É uma **demonstração frontend-only**: não há
backend, banco de dados nem API. Todos os dados vêm de um *seed* determinístico em
memória, persistido no `localStorage` do navegador.

> **Cada pedido registrado, cada grama de carne contada.**

## Como rodar

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Outros comandos:

```bash
pnpm build        # build de produção
pnpm start        # serve o build
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test:run     # testes unitários (Vitest)
pnpm e2e          # testes end-to-end (Playwright) — precisa de `pnpm build` antes
```

## Entrar na demonstração

O login é por **perfil + PIN** (todos os usuários são fictícios):

| Pessoa        | Perfil     | PIN    | Abre em          |
| ------------- | ---------- | ------ | ---------------- |
| Sarah         | Dona       | `1234` | Painel           |
| Marta         | Gerente    | `2222` | PDV              |
| Larissa       | Atendente  | `3333` | PDV              |
| Thiago        | Atendente  | `3334` | PDV              |
| Camila        | Atendente  | `3335` | PDV              |
| Rafael        | Atendente  | `3336` | PDV              |
| Seu Antônio   | Cozinha    | `4444` | Cozinha (KDS)    |
| Dona Lúcia    | Cozinha    | `4445` | Cozinha (KDS)    |

Para ver o pedido chegando "ao vivo", abra **duas abas**: uma no PDV (Larissa) e
outra na Cozinha (Seu Antônio). Os dados sincronizam entre abas.

**Resetar demo**: em *Configurações* ou no menu do usuário — regenera o seed e
devolve a demonstração ao estado inicial.

## Dados da demonstração

O seed é **determinístico** (`mulberry32(42)`), ancorado em "hoje": são 30 dias de
movimento com picos de café (6h30–9h) e almoço (11h30–13h30), fins de semana mais
fortes em doces. Alguns pontos são plantados de propósito para a conversa com a
cliente:

- um atendente com **cancelamentos acima da média** da equipe;
- **2,4 kg de carne** sem explicação na contagem da semana (Loja 1);
- um **fechamento de caixa com diferença**;
- **perdas de ovo** acima do normal.

## Stack

Next.js (App Router) · TypeScript `strict` · Tailwind CSS v4 · shadcn/ui sobre
Base UI · Recharts · framer-motion · sonner · Zustand (`persist`) · date-fns ·
Vitest · Playwright.

## Documentação

| Arquivo                      | O que é                                  |
| ---------------------------- | ---------------------------------------- |
| `docs/PRD.md`                | Especificação do produto                 |
| `docs/DIRECAO-DE-ARTE.md`    | Identidade visual (manda na aparência)   |
| `docs/PLANO-DE-EXECUCAO.md`  | Plano por fases                          |
| `docs/DECISOES.md`           | Decisões tomadas durante a execução      |
| `docs/qa/`                   | Screenshots de QA por fase               |

## Deploy na Vercel

O projeto é **100% estático do ponto de vista do servidor**: não precisa de banco,
de variáveis de ambiente nem de integrações. Dá para publicar direto.

1. Suba o repositório (privado):

   ```bash
   gh repo create <org>/sarah-rangel-doces --private --source=. --push
   ```

2. Na Vercel: **Add New → Project → Import** o repositório.
   O framework é detectado como **Next.js** — mantenha os padrões:

   | Campo             | Valor          |
   | ----------------- | -------------- |
   | Framework Preset  | Next.js        |
   | Build Command     | `next build`   |
   | Output Directory  | (padrão)       |
   | Install Command   | `pnpm install` |
   | Environment Vars  | **nenhuma**    |

3. **Deploy**. O preview sai em `https://<projeto>.vercel.app`.

### Antes de publicar — checklist

- [x] `pnpm build` passa limpo (sem erros de tipo nem de lint).
- [x] Nenhuma referência a `localhost`/porta no código do app
      (só nas ferramentas de teste: `playwright.config.ts`, `scripts/`).
- [x] Imagens em `public/images/`, servidas por `next/image` **sem domínio
      remoto** (nenhum `remotePatterns` é necessário).
- [x] Metadados: título `Sarah Rangel · Gestão`, descrição, Open Graph e
      favicon de cereja (`src/app/icon.svg`).
- [x] `noindex`: a demo é privada — `src/app/robots.ts` bloqueia tudo e o
      layout manda `robots: { index: false, follow: false }`.

### Depois do deploy

Teste no aparelho em que a demonstração vai acontecer:

- **celular** → `/painel` (é a tela da Sarah);
- **tablet** → `/pdv` e `/cozinha` em duas abas, para mostrar o pedido chegando.

Se a demonstração ficar com dados estranhos (porque alguém mexeu antes), use
**Resetar demo** para voltar ao estado inicial.

---

Protótipo para apresentação. Nomes de funcionários, preços e movimento são
fictícios ou aproximados.
