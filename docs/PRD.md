# PRD — Sistema de Gestão "Sarah Rangel Doces"

> Codinome do produto: **Cereja** (referência à cereja do logo).
> Versão: 0.1 — Protótipo navegável (frontend com dados mockados) para apresentação comercial.
> Autor/arquiteto: NCS TECH · Executor: Claude Code · Deploy: Vercel

---

## 1. Contexto do negócio

**Sarah Rangel Doces** — Café & Confeitaria Artesanal, São Luís/MA (Instagram @sarahdoces, ~10,8 mil seguidores).

- **2 unidades** (restaurante/café) funcionando ao mesmo tempo.
- **~5 atendentes** divididos entre as duas lojas + equipe de cozinha.
- Vende: café da manhã regional (café, cuscuz, ovos, tapioca), **PF (prato feito)**, porções de proteína, sucos, **doces e bolos** (vitrine e **encomendas** por WhatsApp).
- Formas de pagamento: Pix, dinheiro, débito, crédito.
- Compras feitas "no atacado" em supermercado (ex.: Mateus): 10 pct de café, 25 kg de arroz, 20 kg de carne...
- O negócio cresceu e **a dona perdeu a capacidade de controlar "no olho"**.

## 2. Dores (relato de funcionária, out/2026)

| # | Dor | Como acontece hoje | Impacto |
|---|-----|--------------------|---------|
| D1 | **Venda não registrada / desvio de dinheiro** | Não há nada que prove que 5 PFs foram vendidos. O atendente pode "esconder" a venda. | Dinheiro some sem rastro. |
| D2 | **Manipulação de preço** | Atendente pode cobrar café de R$ 3 por R$ 1, PF de R$ 20 por R$ 10. | Receita menor e ninguém sabe. |
| D3 | **Pedido em quadro** | Atendente sai do caixa, escreve no quadro da cozinha, volta e já não sabe quem atendia. | Fila cresce, cliente reclama, **clientes perdidos**. |
| D4 | **Cozinha produz diferente do pedido** | Pediu 1 ovo, saem 2; o extra é descartado sem registro. | Desperdício invisível + briga interna. |
| D5 | **Estoque sem controle** | Compra 20 kg de carne e não sabe quanto virou venda, perda, estrago ou desvio. Vale p/ frango, cuscuz, café, tudo. | Não sabe o custo real. |
| D6 | **Compras não registradas** | Compra grande no supermercado sem lançamento. | Impossível saber o lucro. |
| D7 | **Desperdício confundido com venda** | "Às vezes tem mais estrago do que venda e ela pensa que é venda." | Decisões erradas. |

**Mensagem central da apresentação:** *"Controle de gastos, controle de desperdício e nenhuma venda sem registro."*

## 3. Princípios do sistema (as "regras de ouro")

1. **Sem comanda, não sai prato.** A cozinha só prepara o que chega pelo sistema (impresso ou na tela). Isso fecha o buraco da venda escondida: se o atendente não registrar, a comida não sai.
2. **Preço não se digita, se escolhe.** Atendente toca no produto; preço vem do cardápio. Desconto/cortesia/cancelamento só com **PIN do gerente + motivo**, e tudo fica gravado.
3. **Cada ação tem dono.** Login por PIN individual. Toda venda, cancelamento, desconto e perda mostra *quem, quando, onde (loja)*.
4. **Estoque teórico × estoque real.** Cada venda baixa os ingredientes pela ficha técnica. Contagem física revela a diferença = perda não explicada.
5. **Todo descarte é registrado.** Botão rápido "Registrar perda" na cozinha (motivo, quantidade, foto opcional).
6. **Caixa fechado às cegas.** Atendente informa quanto tem na gaveta sem ver o valor esperado; sistema aponta sobra/falta.
7. **Dona vê tudo pelo celular**, em tempo real, das duas lojas.

> ⚠️ Honestidade comercial: nenhum sistema impede 100% que alguém receba em dinheiro sem registrar. O que o sistema faz é **tornar o desvio visível e rastreável** (cozinha amarrada à comanda + estoque teórico vs real + fechamento cego + Pix direto na conta da empresa). Vale dizer isso na apresentação — passa credibilidade.

## 4. Perfis de usuário

| Perfil | Quem | Acesso |
|--------|------|--------|
| **Dona** (admin) | Sarah | Tudo, nas 2 lojas. Foco em painel, alertas, financeiro. |
| **Gerente** | Responsável de loja | PDV, autorizações (PIN), estoque, contagem, fechamento. |
| **Atendente/Caixa** | 5 atendentes | PDV, comandas, abrir/fechar caixa (cego). |
| **Cozinha** | Cozinheiros | Tela de pedidos (KDS), registrar perda, baixa de produção. |

## 5. Módulos

### M1 — PDV (Caixa) · resolve D1, D2, D3
- Grade de produtos com foto/ícone por categoria (Café da manhã, PF & Pratos, Porções, Bebidas, Doces, Bolos).
- Adicionais e observações ("ovo mole", "sem cebola", "+1 ovo R$ 2").
- Identificação do pedido: **Mesa**, **Balcão (nome do cliente)** ou **Viagem**.
- Pagamento: Pix (QR dinâmico — mock), dinheiro (calcula troco), débito, crédito, misto.
- Desconto/cortesia/cancelamento → modal de **autorização com PIN do gerente + motivo obrigatório**.
- Botão **"Enviar para cozinha"** → gera comanda numerada + **impressão térmica 80 mm** (preview no protótipo).
- Atendente **não sai do caixa**.

### M2 — Cozinha (KDS) · resolve D3, D4
- Tela em tablet/TV: colunas **Novos → Preparando → Prontos**, com cronômetro por pedido (verde < 8 min, amarelo < 15, vermelho > 15).
- Cada item mostra quantidade exata em destaque ("**1×** Ovo frito").
- Botão "Registrar perda" sempre visível (ex.: "ovo quebrou", "queimou", "preparado a mais").
- Som/alerta ao chegar pedido novo.

### M3 — Comandas / Pedidos
- Histórico filtrável (loja, atendente, status, pagamento, período).
- Linha do tempo de cada comanda: criada → enviada → pronta → paga (com responsável em cada etapa).
- Reimpressão gera log.

### M4 — Estoque & Compras · resolve D5, D6
- Cadastro de insumos (kg, g, L, un, pct) com custo médio.
- **Lançamento de compras**: fornecedor (Mateus, Atacadão, açougue…), itens, quantidade, valor, foto do cupom; entra no estoque e no financeiro.
- **Transferência entre lojas** (ex.: 5 kg de carne da Loja 1 para Loja 2).
- **Contagem física** (diária/semanal): lista guiada; compara com estoque teórico → **divergência em R$**.
- Alertas de estoque mínimo e validade.

### M5 — Fichas técnicas (receitas) · base do controle
- Ex.: **PF de carne** = 150 g arroz + 80 g feijão + 120 g carne + 50 g salada + 30 g farofa.
- **Rendimento de proteína**: 20 kg de carne crua → X kg limpa/cozida (fator de correção/cocção). Mostra quantas porções *deveriam* sair.
- Calcula **CMV (custo) e margem** de cada produto.

### M6 — Perdas & Desperdício · resolve D4, D7
- Registro: item, quantidade, motivo (estragou, azedou, queimou, preparado a mais, caiu, vencido, consumo da equipe), quem, loja, foto.
- Painel: perdas em R$ por motivo, por loja, por pessoa, por dia; **% de perda sobre faturamento**.
- Gráfico "Venda × Perda × Divergência" por insumo — *mostra quando tem mais estrago que venda*.

### M7 — Financeiro · resolve D6
- Fluxo de caixa: entradas (vendas por forma de pagamento) e saídas (compras, contas fixas, salários).
- **Abertura e fechamento de caixa cego**, sangria e suprimento.
- **DRE simplificada**: Faturamento − CMV − Perdas − Despesas = **Lucro**.
- Contas a pagar com vencimento.

### M8 — Auditoria & Alertas ("Olho da Dona") · resolve D1, D2
- Feed de eventos sensíveis: cancelamentos, descontos, cortesias, reimpressões, caixa com diferença, contagem com divergência, venda com preço alterado.
- **Score de risco por atendente** (cancelamentos/descontos acima da média).
- Alertas automáticos, ex.: *"Loja 2 · Caixa da Ana fechou com R$ 37,00 a menos"*, *"Carne: 2,4 kg sem explicação esta semana (R$ 96)"*.

### M9 — Painel da Dona (Dashboard)
- KPIs do dia por loja: faturamento, nº de pedidos, ticket médio, perdas (R$), lucro estimado.
- Comparativo Loja 1 × Loja 2.
- Vendas por hora (pico do café da manhã e do almoço).
- Top produtos, formas de pagamento, tempo médio de preparo.
- Cartão de alertas em destaque.
- **Mobile-first** (ela usa celular).

### M10 — Encomendas (confeitaria)
- Agenda de encomendas de bolos/doces: cliente, WhatsApp, data/hora de retirada, itens, sinal pago, status (Orçamento → Confirmada → Em produção → Pronta → Entregue).
- Calendário semanal. Link "Chamar no WhatsApp" (wa.me).

### M11 — Equipe & Configurações
- Usuários, perfis, PIN, loja.
- Cardápio (produtos, preços, categorias, adicionais) — **só Dona/Gerente altera preço** (com log).
- Lojas, impressoras, formas de pagamento.

## 6. Fluxos-chave (para a demo)

**Fluxo A — Pedido sem sair do caixa (D3)**
Atendente toca "PF de carne" + "Suco de acerola" → Mesa 4 → Enviar → comanda #0187 impressa na cozinha (preview) → aparece no KDS → cozinha marca Pronto → caixa recebe Pix → venda registrada.

**Fluxo B — Tentativa de desconto (D2)**
Atendente tenta mudar PF de R$ 20 para R$ 10 → sistema pede PIN do gerente + motivo → evento aparece em Auditoria e no celular da Dona.

**Fluxo C — Carne que some (D5/D7)**
Compra 20 kg carne → fichas técnicas dizem que 112 PFs vendidos consumiram 13,4 kg → perdas registradas 1,2 kg → contagem física 3,0 kg → **2,4 kg sem explicação (R$ 96)** → alerta.

**Fluxo D — Fechamento cego (D1)**
Atendente informa R$ 412,00 na gaveta → esperado R$ 449,00 → diferença −R$ 37,00 → alerta.

## 7. Arquitetura

### 7.1 Fase atual — Protótipo (este repositório)
- **Next.js (App Router, versão estável mais recente) + TypeScript (strict)**
- **Tailwind CSS v4 + shadcn/ui** (componentes) + **lucide-react** (ícones)
- **Recharts** (gráficos) · **framer-motion** (animações sutis)
- **Zustand + persist (localStorage)** como "banco" mock → a demo é interativa: um pedido feito no PDV aparece no KDS, no dashboard e na auditoria.
- **date-fns (pt-BR)**, **zod** (validação de formulários), **sonner** (toasts)
- Dados mock gerados por *seed* determinístico (30 dias de histórico, 2 lojas).
- Botão "Resetar demo" restaura o seed.
- Deploy: **Vercel** (estático/SSR, sem backend).

### 7.2 Fase produção (após contrato) — visão alvo
```
[PDV tablet/PC]  [KDS cozinha]  [Celular da Dona]
        \             |              /
         Next.js (Vercel) — Route Handlers / Server Actions
                      |
          Supabase: Postgres + Auth + Realtime + Storage (fotos de cupom/perda)
                      |
        Agente de impressão local (QZ Tray ou app leve) → Impressora térmica 80mm (ESC/POS)
```
- **Realtime** (Supabase) para pedidos chegarem instantaneamente no KDS.
- **RLS** por loja e perfil. Tabela `audit_log` *append-only* (ninguém apaga).
- **Modo offline** (PWA + fila local) — internet de restaurante cai.
- Pix: integração com PSP/banco (QR dinâmico com confirmação automática) — fase posterior.
- Fiscal (NFC-e) — **fora do escopo inicial**; avaliar integração com emissor terceiro se ela precisar.

### 7.3 Modelo de dados (já usar nos tipos TS do mock)
```
Loja(id, nome, endereco)
Usuario(id, nome, perfil, pin, lojaId, ativo, avatar)
Categoria(id, nome, icone, ordem)
Produto(id, nome, categoriaId, preco, custo, ativo, imagem, fichaTecnicaId?, adicionais[])
Insumo(id, nome, unidade, custoMedio, estoqueMinimo, categoria)
EstoqueLoja(insumoId, lojaId, qtdTeorica, qtdUltimaContagem, dataContagem)
FichaTecnica(id, produtoId, itens[{insumoId, qtd}], rendimento)
Comanda(id, numero, lojaId, atendenteId, tipo[mesa|balcao|viagem], identificador, itens[], status, criadaEm, prontaEm?, pagaEm?)
ItemComanda(produtoId, qtd, precoUnit, precoOriginal, adicionais[], obs)
Pagamento(id, comandaId, forma[pix|dinheiro|debito|credito], valor, troco?)
Compra(id, lojaId, fornecedor, data, itens[{insumoId, qtd, valor}], total, fotoCupom?, usuarioId)
Perda(id, lojaId, insumoId|produtoId, qtd, motivo, custo, usuarioId, data, foto?)
Contagem(id, lojaId, data, usuarioId, itens[{insumoId, teorico, contado, diferenca}])
Transferencia(id, origemId, destinoId, itens[], usuarioId, data)
SessaoCaixa(id, lojaId, usuarioId, abertura, fechamento?, valorInicial, valorInformado?, valorEsperado?, diferenca?, sangrias[])
Despesa(id, lojaId?, descricao, categoria, valor, vencimento, pagoEm?)
Encomenda(id, cliente, whatsapp, itens[], dataEntrega, sinal, total, status, obs)
EventoAuditoria(id, tipo, lojaId, usuarioId, autorizadoPor?, descricao, valorImpacto?, data, severidade[info|atencao|critico])
```

## 8. Identidade visual

Definida em **`docs/DIRECAO-DE-ARTE.md`** (conceito "Confeitaria de azulejo": cereja do logo + azulejo de São Luís + fotos reais da comida; Gloock + Hanken Grotesk; Loja 1 = cereja, Loja 2 = azulejo). Esse documento é a fonte de verdade para tudo que é visual.

## 9. Fora do escopo do protótipo
Backend real, autenticação real, NFC-e, integração bancária, impressão física real (apenas preview fiel de 80 mm + `window.print()` com CSS `@page { size: 80mm auto }`), app nativo.

## 10. Critérios de sucesso da demo
- Dona entende em **< 5 minutos** como o sistema resolve roubo, fila e desperdício.
- Funciona lindo no **celular** dela (painel) e no **tablet** (PDV/KDS).
- Um pedido feito no PDV aparece "ao vivo" no KDS e no painel.
- Tour guiado "Modo Apresentação" com os 4 fluxos da seção 6.

## 11. Hardware sugerido para a fase de produção (para a proposta)
Por loja: 1 tablet ou PC no caixa · 1 tablet/TV na cozinha (opcional, se usar KDS) · 1 impressora térmica 80 mm (USB/Ethernet ou Bluetooth) · gaveta de dinheiro (opcional) · balança (opcional, para pesagem de proteína). *Cotar preços atualizados antes da proposta.*
