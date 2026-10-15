# QA — Fase 10

## A) Fotos dos produtos
Todos os 18 produtos que usavam placeholder ganharam foto (banco livre, baixada
para `public/images/produtos/`, créditos em `public/images/CREDITOS.md`). Grade
do PDV conferida por screenshot em 1280 e 390 (`pdv-grade-1280.png`,
`pdv-grade-390.png`). Trocas feitas após a conferência visual:
- **cuscuz completo**: 1ª opção lia como "sopa verde" (o erro que a Fase 3 teve) →
  trocada por tigelas de cuscuz com tomate/salsa, claramente cuscuz.
- **bolo de pote**: 1ª opção era fatia de bolo (igual a "fatia de bolo") →
  trocada por bolo em camadas num pote de vidro.
- **ovos mexidos**: 1ª opção eram ovos fritos → trocada por ovos mexidos.
Lata e água são genéricas, sem marca/logo real.

## B) Toast — contraste da descrição (bug reportado)
Causa real: o `sonner` injeta, em runtime, uma regra de mesma especificidade que
deixava a descrição em `#3f3f3f` (cinza escuro) sobre o fundo colorido — a
correção anterior perdia para ela. Agora a regra mira `[data-sonner-toast]
[data-type] [data-description]` (especificidade maior) + `!important`, e os fundos
coloridos são hexes fixos (iguais nos dois temas). Medido no toast **real**
(disparado no app), descrição = `rgba(255,255,255,.88)`:

| Variante | Fundo | Contraste descrição × fundo | AA (≥4,5) |
|----------|-------|------------------------------|-----------|
| Sucesso (resetar demo) | `#476129` | **5,85:1** | ✅ |
| Erro | `#a82e26` | **5,61:1** | ✅ |
| Atenção | `#855b1e` | ~5,0:1 | ✅ |
| Info | `#1a4680` | ~7,9:1 | ✅ |

Fundos fixos ⇒ contraste independe do tema (claro/escuro iguais). Evidências:
`toast-real-sucesso-claro.png`, `toast-real-sucesso-escuro.png`, `toast-erro-claro.png`.

## C) "Glenda"
Busca no projeto inteiro (case-insensitive): só aparecia em
`docs/PLANO-DE-EXECUCAO.md` (2×, "pedir à Glenda" / "confirmar com a Glenda").
Trocado por "a cliente". Nenhuma outra ocorrência.

## D) QA exploratório (390 e 1280)
`/estoque` + extrato, `/encomendas` (quadro + WhatsApp), `/cardapio`,
`/configuracoes`. Um problema real encontrado e corrigido:
- **Erro de console (Base UI)** em `/encomendas`: `Button` com `render={<a>}` sem
  `nativeButton={false}` (impacta semântica/acessibilidade). Corrigido no botão
  do WhatsApp e, pelo mesmo motivo, nos CTAs da landing e no "Ver no extrato"
  das perdas. `/encomendas` agora abre sem erro de console.
Demais telas: sem texto cortado, sem overflow-x, estados vazios e foco/contraste ok.

Evidências: `estoque-1280.png`, `estoque-390.png`, `estoque-extrato-1280.png`,
`encomendas-1280.png`, `encomendas-390.png`, `cardapio-1280.png`,
`configuracoes-390.png`, `configuracoes-390-b.png`.

Também: `metadataBase` corrigido para `https://sarahdoces.vercel.app` (o domínio
antigo dava 404 e quebrava a URL da OG image).
