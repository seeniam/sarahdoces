# Pendências com a cliente (Neemias → Glenda/Sarah)

Itens que faltam para a demo ficar 100% "a cara da loja". Enquanto não chegam,
o sistema usa os fallbacks da direção de arte (e fica fácil de trocar depois).

## Prioridade máxima (maior diferencial da demo)

- [ ] **Logo em alta** → `public/brand/logo.png` (PNG transparente de preferência).
      Hoje: marca SVG de duas cerejas desenhada por nós (`components/brand/Logo.tsx`).
      Ao chegar o arquivo, trocar a `CerejaMark` por `<Image>` em `Logo.tsx`.
- [ ] **15–25 fotos reais dos produtos** (Instagram/WhatsApp @sarahdoces) →
      `public/images/produtos/<slug>.jpg` (café, cuscuz, PF, porções, sucos, bolos,
      doces, vitrine, fachada/salão). Hoje: 7 fotos de banco livre (ver
      `public/images/CREDITOS.md`). Substituir mantendo os mesmos nomes de arquivo.
- [ ] **Foto-herói** (salão, balcão ou mesa bonita) → `public/images/hero.jpg`.
      Hoje: foto de banco livre.

## Confirmar com a Glenda

- [ ] Nomes reais das 2 lojas (hoje: "Loja 1 — Centro" e "Loja 2 — Cohama",
      editáveis em `lib/mock/data/lojas.ts` na Fase 1).
- [ ] Os 10 preços principais do cardápio.

## Observação

As fotos de banco são de uso provisório e de apresentação. Como a demo é só para
a Sarah, assim que possível avisar/pedir autorização informal para usar as fotos
dela no sistema.
