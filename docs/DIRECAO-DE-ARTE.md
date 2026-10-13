# Direção de Arte — Sistema "Cereja" · Sarah Rangel Doces

> Este documento manda em tudo que é visual. Se o PRD e este arquivo divergirem em aparência, **este arquivo vence**.
> Meta: a dona olhar e pensar *"isso é a minha loja"*, e não *"isso é um painel administrativo qualquer"*.

---

## 1. Conceito: "Confeitaria de azulejo"

A Sarah Rangel é um **café & confeitaria artesanal de São Luís**, a cidade dos azulejos portugueses. O sistema junta três coisas que são dela:

1. **A cereja do logo**: vermelho profundo, brilhante, de calda.
2. **O azulejo ludovicense**: azul-cobalto sobre branco de porcelana, com padrão geométrico. É a textura da marca.
3. **A comida de verdade**: fotos reais dos produtos (cuscuz, PF, bolos, doces) em todo lugar onde existir produto.

O resultado deve parecer **uma confeitaria fina que tem um sistema**, e não um sistema com uma cor de confeitaria.

## 2. Paleta (tokens)

| Token | Hex | Papel |
|-------|-----|-------|
| `porcelana` | `#F5F6F8` | Fundo da aplicação (branco frio de louça, **não** creme) |
| `superficie` | `#FFFFFF` | Painéis e superfícies |
| `cereja` | `#9E1B32` | Primária: ações principais, Loja 1 nos gráficos, marca |
| `cereja-calda` | `#6F0F22` | Hover/pressed, títulos de destaque |
| `azulejo` | `#1E4F91` | Secundária: informação, Loja 2 nos gráficos, padrão de azulejo |
| `acucar` | `#F6DDDF` | Realces suaves, seleção, fundos de destaque |
| `cacau` | `#2B1B18` | Texto principal, sidebar, modo escuro |
| `pistache` | `#5E7F36` | Positivo / dentro da meta / "pronto" |
| `doce-de-leite` | `#C98A2E` | Atenção / "preparando" / estoque baixo |
| `alerta` | `#C8372D` | Crítico (diferente da cereja: mais alaranjado, para não confundir marca com erro) |

- Texto secundário: `cacau` a 62%. Bordas: `cacau` a 10%.
- **Sombras tingidas de cacau**, nunca cinza puro: `0 1px 2px rgb(43 27 24 / .06), 0 8px 24px -12px rgb(43 27 24 / .18)`.
- **Modo escuro** = "cacau": fundo `#1C1210`, superfícies `#261916` (nível 1) e `#2F201C` (nível 2), cereja clareada `#D2475D`, azulejo clareado `#6E9BD8`.
- Gráficos: **Loja 1 = cereja, Loja 2 = azulejo** em TODOS os gráficos. Essa cor por loja vira linguagem do sistema (chip do seletor de loja, badge na comanda, borda do card de pedido no KDS).

## 3. Tipografia

| Papel | Fonte (Google Fonts via `next/font`) | Uso |
|-------|------|-----|
| Display | **Gloock** | Títulos de página, números-herói (faturamento do dia, nº da comanda), nomes de produto em destaque |
| Interface | **Hanken Grotesk** (400/500/600/700) | Todo o resto. `font-variant-numeric: tabular-nums` em valores, tabelas e preços |
| Marca | **Logo real da cliente** (imagem) | Apenas login, sidebar e comanda. **Nenhuma fonte manuscrita no restante do sistema.** |

Escala (base 16px, razão ~1.25): 12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61.
- Números-herói em Gloock 49–61px, com o "R$" menor (60% do tamanho) e alinhado no topo.
- Títulos em sentence case. **Sem labels em CAIXA ALTA espaçada** acima de títulos.
- Linhas de texto com no máximo ~70 caracteres.

## 4. O padrão de azulejo (assinatura visual)

- Criar `components/brand/Azulejo.tsx`: SVG **original** de um módulo de azulejo 4×4 (rosácea geométrica + cantos que formam um novo motivo ao repetir), em `azulejo` sobre transparente, exportável como `background-image` (data-URI) via `lib/brand/azulejo.ts`.
- Onde aparece:
  - **Login**: metade da tela é uma parede de azulejo inteira e nítida, com a foto-herói e o logo por cima. É o momento "uau".
  - **Sidebar (cacau)**: padrão a 5–7% de opacidade, só no rodapé, sumindo em gradiente.
  - **Estados vazios**: um único azulejo grande com uma frase curta e um botão de ação.
  - **Cabeçalho da comanda térmica**: faixa fina com o padrão em preto (que imprime bem).
- **Proibido** usar o azulejo como papel de parede em telas de trabalho (PDV, tabelas). É tempero, não prato principal.

## 5. Fotos reais

Fotos são obrigatórias em: cards de produto do PDV, cardápio, encomendas, login e landing.

**Fonte preferencial (mais impacto na venda):** fotos do próprio Instagram/WhatsApp da Sarah Rangel Doces. Ela vai ver **a comida dela** no sistema. O Neemias providencia e coloca em `public/images/produtos/` (nome = slug do produto, ex.: `cuscuz-completo.jpg`).

**Fallback:** fotos de bancos com licença livre (Unsplash/Pexels), **baixadas** para `public/images/` (nunca hotlink), com crédito registrado em `public/images/CREDITOS.md`. Para pratos regionais sem foto boa (cuscuz nordestino, PF), preferir foto da própria cliente.

Tratamento das imagens:
- `next/image`, formato AVIF/WebP, `sizes` corretos, `placeholder="blur"` (gerar blurDataURL com `plaiceholder` ou um blur fixo).
- Proporção fixa por contexto: produto PDV **4:3**, encomenda **1:1**, login **retrato 4:5**.
- Leve correção uniforme via CSS (`saturate(1.05) contrast(1.03)`) para dar unidade a fotos de origens diferentes.
- Sem foto? Placeholder elegante: fundo `acucar` + ícone de linha fino da categoria. **Nunca emoji.**

## 6. Layout e forma

- **Hierarquia de raios** (não usar o mesmo em tudo): contêineres grandes 20px · cards 14px · controles 10px · chips e badges `full`.
- Grid base de 8px. Respiro generoso no Painel; densidade maior em tabelas e no PDV.
- **Painel da Dona** — sem grade de cards idênticos:
  ```
  ┌───────────────────────────────────────────────┐
  │ Bom dia, Sarah            [Hoje ▾] [Todas ▾]  │
  │ R$ 4.812,50  ← Gloock 61px                    │
  │ faturado hoje · +12% vs terça passada         │
  ├──────────────────────────┬────────────────────┤
  │ Faixa de alertas (cereja/alerta), rolável      │
  ├──────────────────────────┴────────────────────┤
  │ Vendas por hora (área grande, 2/3) │ Loja 1×2 │
  │                                    │ (1/3)    │
  ├───────────┬───────────┬───────────────────────┤
  │ Pedidos   │ Ticket    │ Perdas hoje (R$ e %)   │
  │ Lucro est.│ Tempo méd.│ ↳ mini "Venda×Perda"  │
  └───────────┴───────────┴───────────────────────┘
  ```
  No celular (390px): número-herói em cima, alertas em carrossel horizontal, depois os gráficos empilhados.
- **PDV** (tablet): três zonas: categorias (trilho vertical com ícones de linha) · grade de produtos com foto · pedido como uma **"comanda viva"** (papel branco, borda serrilhada embaixo, tipografia de cupom para os itens).
- **KDS**: fundo `cacau` escuro, cartões brancos como papel de comanda, faixa de cor da loja no topo, quantidade enorme em Gloock.

## 7. Movimento (pouco e com intenção)

- **Um momento orquestrado**: ao tocar "Enviar para cozinha", a comanda sai "impressa" de cima para baixo (clip-path + leve translate, ~700ms, easing `cubic-bezier(.2,.8,.2,1)`). Depois ela voa para "Comandas abertas". Esse é o momento da demo.
- No restante, só **movimento que responde a uma ação**: adicionar item (o item entra na comanda), mudar status no KDS (layout animation), abrir sheet/modal.
- **Proibido**: fade-in + slide-up em cada seção ao carregar, hover que levanta todos os cards, contadores animando números em todo lugar. Respeitar `prefers-reduced-motion`.

## 8. Ícones e detalhes

- `lucide-react` com `strokeWidth={1.5}`. Para categorias do PDV, desenhar 6 ícones de linha próprios (xícara, cuscuzeira, prato, frango, copo de suco, fatia de bolo) em `components/brand/icons/`.
- Badges de status com ponto colorido + texto, nunca só cor.
- Moeda sempre `R$ 1.234,56`, com `tabular-nums`.
- Diferenças negativas (caixa, estoque) em `alerta` com sinal explícito `−R$ 37,00`.

## 9. Lista do que é PROIBIDO (sinais de template genérico)

- Grade de cards idênticos com o mesmo raio, a mesma sombra cinza e gradiente decorativo.
- Fundo creme/bege (`#F4F1EA` e parecidos) e acento terracota.
- Rótulos em CAIXA ALTA espaçada acima dos títulos; meta-informação em "A · B · C" em todo lugar; "→" no fim de botões.
- Colorir só uma palavra do título.
- Emojis como ícones de produto ou de interface.
- Fonte monoespaçada decorativa para números pequenos.
- Tabelas "cruas" do shadcn sem tratamento: sempre com densidade, alinhamento numérico à direita e estados.
- Texto de marketing dentro do sistema ("Potencialize sua gestão!"). Copy é **direta e operacional**: "Enviar para cozinha", "Fechar caixa", "Registrar perda".

## 10. Copy (voz do sistema)

- Português do Brasil, simples e caloroso, sem gíria corporativa.
- Botão diz exatamente o que acontece, e o toast repete o verbo: "Enviar para cozinha" → "Comanda #0187 enviada para a cozinha".
- Erros dizem o que houve e como resolver: "PIN incorreto. Peça para a gerente digitar o PIN dela."
- Estados vazios convidam à ação: "Nenhuma perda registrada hoje. Quando algo estragar, registre aqui pra Sarah saber."

## 11. Definition of Done visual (toda fase)

1. Screenshots com Playwright em **390×844, 1024×768 e 1440×900** de cada tela nova, em claro e escuro, salvos em `docs/qa/fase-N/`.
2. Revisar os screenshots contra este documento e a seção 9 (proibidos), corrigir e tirar de novo.
3. Contraste AA, foco visível no teclado, alvos ≥ 44px (≥ 56px no PDV/KDS).
4. Nenhuma imagem quebrada, nenhum texto cortado, nenhuma rolagem horizontal no celular.
5. Lighthouse (Performance e Acessibilidade) ≥ 90 na landing e no painel.
