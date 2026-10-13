import type {
  BancoMock,
  Comanda,
  Compra,
  Contagem,
  Despesa,
  Encomenda,
  EstoqueLoja,
  EventoAuditoria,
  Fornecedor,
  InsumoId,
  ItemComanda,
  LojaId,
  Pagamento,
  Perda,
  Produto,
  SessaoCaixa,
  StatusComanda,
  TipoComanda,
  UsuarioId,
} from "@/types";
import { criarRng } from "./rng";
import { consumoDaComanda } from "@/lib/domain/estoque";
import { fecharCaixaCego } from "@/lib/domain/financeiro";
import {
  CATEGORIAS,
  FICHAS,
  FICHA_POR_PRODUTO,
  INSUMOS,
  INSUMO_POR_ID,
  LOJAS,
  PRODUTOS,
  PRODUTO_POR_ID,
  USUARIOS,
} from "./data";

/** "Hoje" fixo da demo (sempre os mesmos números). */
export const DATA_REFERENCIA = new Date(2026, 9, 13, 21, 0, 0); // 13/10/2026
const DIAS = 30;
const SEED = 42;

const ATENDENTES_LOJA: Record<LojaId, UsuarioId[]> = {
  "loja-1": ["u-larissa", "u-thiago"],
  "loja-2": ["u-camila", "u-rafael"],
};
const COZINHA_LOJA: Record<LojaId, UsuarioId> = {
  "loja-1": "u-antonio",
  "loja-2": "u-lucia",
};
const GERENTE = "u-marta";

const HORAS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const PESOS_HORA = [3, 8, 10, 9, 5, 4, 9, 10, 7, 4, 4, 5, 5, 4, 3, 2];

const DOCES = new Set([
  "prod-fatia-bolo",
  "prod-brigadeiro",
  "prod-torta-limao",
  "prod-bolo-pote",
]);

// Pools de produto por faixa do dia: [produtoId, peso]
const POOL_MANHA: [string, number][] = [
  ["prod-cafe", 10], ["prod-cafe-leite", 8], ["prod-cuscuz-ovo", 7],
  ["prod-cuscuz-completo", 6], ["prod-tapioca-coco", 4], ["prod-tapioca-frango", 4],
  ["prod-pao-chapa", 5], ["prod-ovos", 4], ["prod-suco", 5], ["prod-cafe-gelado", 3],
];
const POOL_ALMOCO: [string, number][] = [
  ["prod-pf-carne", 10], ["prod-pf-frango", 9], ["prod-porcao-frango", 5],
  ["prod-porcao-carne", 4], ["prod-suco", 6], ["prod-refri", 5],
  ["prod-agua", 3], ["prod-cuscuz-completo", 3],
];
const POOL_TARDE: [string, number][] = [
  ["prod-fatia-bolo", 8], ["prod-brigadeiro", 7], ["prod-torta-limao", 5],
  ["prod-bolo-pote", 6], ["prod-cafe", 6], ["prod-cafe-leite", 4],
  ["prod-suco", 5], ["prod-cafe-gelado", 4],
];
const POOL_NOITE: [string, number][] = [
  ["prod-porcao-frango", 6], ["prod-porcao-carne", 5], ["prod-fatia-bolo", 5],
  ["prod-brigadeiro", 4], ["prod-refri", 5], ["prod-suco", 4],
];

const NOMES_CLIENTE = [
  "João", "Maria", "Ana", "Pedro", "Lucas", "Beatriz", "Carlos",
  "Fernanda", "Rafael", "Juliana", "Marcos", "Patrícia", "Gabriel", "Helena",
];

const FORNECEDOR_CATS: Record<Fornecedor, string[]> = {
  "Açougue Bom Corte": ["proteina"],
  Hortifruti: ["hortifruti"],
  Mateus: ["laticinios", "bebidas", "mercearia", "descartaveis"],
  Atacadão: ["graos", "confeitaria"],
};

function dataNoDia(offset: number, hora: number, minuto: number): string {
  const d = new Date(DATA_REFERENCIA);
  d.setDate(d.getDate() - (DIAS - 1 - offset));
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}
function ehFimDeSemana(offset: number): boolean {
  const d = new Date(DATA_REFERENCIA);
  d.setDate(d.getDate() - (DIAS - 1 - offset));
  const dia = d.getDay();
  return dia === 0 || dia === 6;
}

function poolDoHorario(hora: number): [string, number][] {
  if (hora <= 10) return POOL_MANHA;
  if (hora <= 14) return POOL_ALMOCO;
  if (hora <= 18) return POOL_TARDE;
  return POOL_NOITE;
}

export function gerarSeed(): BancoMock {
  const rng = criarRng(SEED);

  const comandas: Comanda[] = [];
  const pagamentos: Pagamento[] = [];
  const eventos: EventoAuditoria[] = [];
  const perdas: Perda[] = [];
  const compras: Compra[] = [];
  const contagens: Contagem[] = [];
  const sessoesCaixa: SessaoCaixa[] = [];
  const despesas: Despesa[] = [];
  const encomendas: Encomenda[] = [];

  let seqComanda = 0;
  let seqEvento = 0;
  const numeroLoja: Record<LojaId, number> = { "loja-1": 1000, "loja-2": 2000 };
  const novoEventoId = () => `ev-${(++seqEvento).toString().padStart(4, "0")}`;

  // ---- Comandas, pagamentos, eventos de venda, por dia/loja ----
  for (let offset = 0; offset < DIAS; offset++) {
    const fds = ehFimDeSemana(offset);
    const hoje = offset === DIAS - 1;

    for (const loja of LOJAS) {
      const base = loja.id === "loja-1" ? 24 : 20;
      const qtd = Math.round(base * (fds ? 1.1 : 1) * rng.range(0.85, 1.15));
      const atendentes = ATENDENTES_LOJA[loja.id];

      for (let n = 0; n < qtd; n++) {
        const hora = rng.pickPonderado(HORAS, PESOS_HORA);
        const minuto = rng.int(0, 59);
        const atendenteId = rng.pick(atendentes);

        // Itens
        const pool = poolDoHorario(hora);
        const ids = pool.map((p) => p[0]);
        const pesos = pool.map((p) =>
          fds && DOCES.has(p[0]) ? p[1] * 1.8 : p[1],
        );
        const nItens = rng.pickPonderado([1, 2, 3], [5, 4, 2]);
        const itens: ItemComanda[] = [];
        for (let k = 0; k < nItens; k++) {
          const produtoId = rng.pickPonderado(ids, pesos);
          const produto = PRODUTO_POR_ID.get(produtoId) as Produto;
          const qtdItem = rng.pickPonderado([1, 2], [8, 2]);
          const adicionais =
            produto.adicionais.length > 0 && rng.chance(0.18)
              ? [rng.pick(produto.adicionais)]
              : [];
          const precoUnit =
            produto.preco + adicionais.reduce((s, a) => s + a.preco, 0);
          itens.push({
            produtoId,
            qtd: qtdItem,
            precoUnit,
            precoOriginal: precoUnit,
            adicionais,
            obs: rng.chance(0.08) ? "ovo mole" : undefined,
          });
        }

        const tipo: TipoComanda = rng.pickPonderado(
          ["mesa", "balcao", "viagem"],
          [5, 4, 2],
        );
        const identificador =
          tipo === "mesa" ? `Mesa ${rng.int(1, 12)}` : rng.pick(NOMES_CLIENTE);

        const subtotal = itens.reduce((s, it) => s + it.precoUnit * it.qtd, 0);

        // Desconto (autorizado) em alguns casos
        let desconto: number | undefined;
        if (rng.chance(0.05)) {
          desconto = rng.pick([2, 3, 5]);
        }
        const total = Math.max(0, subtotal - (desconto ?? 0));

        // Cancelamento: Thiago cancela ~3× mais que os demais
        const taxaCancel = atendenteId === "u-thiago" ? 0.09 : 0.03;
        const cancelada = rng.chance(taxaCancel);

        const criadaEm = dataNoDia(offset, hora, minuto);
        const enviadaEm = dataNoDia(offset, hora, Math.min(59, minuto + 1));
        const prontaEm = dataNoDia(offset, hora, Math.min(59, minuto + 8));
        const pagaEm = dataNoDia(offset, hora, Math.min(59, minuto + 12));

        let status: StatusComanda = "paga";
        if (cancelada) status = "cancelada";
        else if (hoje && hora >= 19)
          status = rng.pick(["enviada", "preparando", "pronta"]);

        const id = `cmd-${(++seqComanda).toString().padStart(5, "0")}`;
        const comanda: Comanda = {
          id,
          numero: ++numeroLoja[loja.id],
          lojaId: loja.id,
          atendenteId,
          tipo,
          identificador,
          itens,
          status,
          criadaEm,
          enviadaEm,
          prontaEm:
            status === "pronta" || status === "paga" ? prontaEm : undefined,
          pagaEm: status === "paga" ? pagaEm : undefined,
          desconto: cancelada ? undefined : desconto,
          motivoCancelamento: cancelada ? "cliente desistiu" : undefined,
        };
        comandas.push(comanda);

        if (cancelada) {
          eventos.push({
            id: novoEventoId(),
            tipo: "cancelamento",
            lojaId: loja.id,
            usuarioId: atendenteId,
            autorizadoPor: GERENTE,
            descricao: `Comanda #${comanda.numero} cancelada`,
            valorImpacto: -subtotal,
            data: criadaEm,
            severidade: "atencao",
            refId: id,
          });
          continue; // sem pagamento
        }

        if (desconto) {
          eventos.push({
            id: novoEventoId(),
            tipo: "desconto",
            lojaId: loja.id,
            usuarioId: atendenteId,
            autorizadoPor: GERENTE,
            descricao: `Desconto de R$ ${desconto} na comanda #${comanda.numero}`,
            valorImpacto: -desconto,
            data: criadaEm,
            severidade: "atencao",
            refId: id,
          });
        }

        // Pagamento apenas para comandas pagas
        if (status === "paga") {
          const forma = rng.pickPonderado(
            ["pix", "dinheiro", "debito", "credito"] as const,
            [40, 25, 20, 15],
          );
          const troco =
            forma === "dinheiro"
              ? Math.max(0, rng.pick([0, 0, 0, 5, 10, 20]) - (total % 10 || 0))
              : undefined;
          pagamentos.push({
            id: `pag-${id}`,
            comandaId: id,
            lojaId: loja.id,
            forma,
            valor: total,
            troco: troco && troco > 0 ? troco : undefined,
            data: pagaEm,
          });
        }
      }
    }
  }

  // ---- Consumo teórico acumulado por loja/insumo ----
  const consumo: Record<LojaId, Map<InsumoId, number>> = {
    "loja-1": new Map(),
    "loja-2": new Map(),
  };
  for (const c of comandas) {
    if (c.status === "cancelada") continue;
    const uso = consumoDaComanda(c, FICHA_POR_PRODUTO);
    const alvo = consumo[c.lojaId];
    for (const [ins, q] of uso) alvo.set(ins, (alvo.get(ins) ?? 0) + q);
  }

  // ---- Perdas (ovo acima do normal na Loja 1; carne eventual) ----
  const perdaQtd: Record<LojaId, Map<InsumoId, number>> = {
    "loja-1": new Map(),
    "loja-2": new Map(),
  };
  let seqPerda = 0;
  const registrarPerda = (
    loja: LojaId,
    insumoId: InsumoId,
    qtd: number,
    motivo: Perda["motivo"],
    offset: number,
  ) => {
    const insumo = INSUMO_POR_ID.get(insumoId);
    if (!insumo) return;
    const custo = Number((qtd * insumo.custoMedio).toFixed(2));
    const data = dataNoDia(offset, rng.int(9, 18), rng.int(0, 59));
    perdas.push({
      id: `perda-${(++seqPerda).toString().padStart(4, "0")}`,
      lojaId: loja,
      insumoId,
      qtd,
      motivo,
      custo,
      usuarioId: COZINHA_LOJA[loja],
      data,
    });
    perdaQtd[loja].set(insumoId, (perdaQtd[loja].get(insumoId) ?? 0) + qtd);
    if (custo >= 25) {
      eventos.push({
        id: novoEventoId(),
        tipo: "perda",
        lojaId: loja,
        usuarioId: COZINHA_LOJA[loja],
        descricao: `Perda de ${insumo.nome} (${qtd} ${insumo.unidade})`,
        valorImpacto: -custo,
        data,
        severidade: "info",
      });
    }
  };

  for (let offset = 0; offset < DIAS; offset++) {
    // Ovo "acima do normal" na Loja 1
    if (rng.chance(0.55)) registrarPerda("loja-1", "ins-ovo", rng.int(3, 8), "quebrou", offset);
    if (rng.chance(0.2)) registrarPerda("loja-2", "ins-ovo", rng.int(1, 3), "quebrou", offset);
    // Outras perdas ocasionais
    if (rng.chance(0.25))
      registrarPerda(rng.pick(LOJAS).id, "ins-frango", rng.range(0.3, 0.8), "estragou", offset);
    if (rng.chance(0.15))
      registrarPerda(rng.pick(LOJAS).id, "ins-carne", rng.range(0.2, 0.5), "queimou", offset);
    if (rng.chance(0.2))
      registrarPerda(rng.pick(LOJAS).id, "ins-leite", rng.range(0.5, 1.5), "azedou", offset);
  }

  // ---- Estoque teórico final = inicial + compras − consumo − perdas ----
  // Geramos compras suficientes para manter o estoque num nível saudável.
  const estoque: EstoqueLoja[] = [];
  let seqCompra = 0;
  const comprasPorFornecedorSemana: Record<string, Compra> = {};

  for (const loja of LOJAS) {
    for (const insumo of INSUMOS) {
      const cons = consumo[loja.id].get(insumo.id) ?? 0;
      const perd = perdaQtd[loja.id].get(insumo.id) ?? 0;
      const inicial = insumo.estoqueMinimo * 4;
      const desejadoFinal = insumo.estoqueMinimo * 3;
      const totalComprar = Math.max(0, cons + perd + desejadoFinal - inicial);
      const qtdFinal = Number((inicial + totalComprar - cons - perd).toFixed(3));

      estoque.push({
        insumoId: insumo.id,
        lojaId: loja.id,
        qtdTeorica: qtdFinal,
        qtdUltimaContagem: qtdFinal,
        dataContagem: null,
      });

      // Distribui a compra em ~4 semanas no fornecedor da categoria
      if (totalComprar > 0) {
        const fornecedor = (Object.keys(FORNECEDOR_CATS) as Fornecedor[]).find(
          (f) => FORNECEDOR_CATS[f].includes(insumo.categoria),
        );
        if (fornecedor) {
          const porSemana = totalComprar / 4;
          for (let s = 0; s < 4; s++) {
            const offset = Math.min(DIAS - 1, s * 7 + 1);
            const chave = `${loja.id}-${fornecedor}-${s}`;
            if (!comprasPorFornecedorSemana[chave]) {
              comprasPorFornecedorSemana[chave] = {
                id: `cmp-${(++seqCompra).toString().padStart(4, "0")}`,
                lojaId: loja.id,
                fornecedor,
                data: dataNoDia(offset, 8, 0),
                itens: [],
                total: 0,
                fotoCupom: null,
                usuarioId: GERENTE,
              };
            }
            const compra = comprasPorFornecedorSemana[chave];
            const valor = Number((porSemana * insumo.custoMedio).toFixed(2));
            compra.itens.push({ insumoId: insumo.id, qtd: Number(porSemana.toFixed(3)), valor });
            compra.total = Number((compra.total + valor).toFixed(2));
          }
        }
      }
    }
  }
  compras.push(...Object.values(comprasPorFornecedorSemana).filter((c) => c.itens.length > 0));

  // ---- Contagem recente com divergências (carne Loja 1: −2,4 kg sem explicação) ----
  const estoquePorChave = new Map(estoque.map((e) => [`${e.lojaId}:${e.insumoId}`, e]));
  const INSUMOS_CONTAGEM = [
    "ins-carne", "ins-frango", "ins-arroz", "ins-feijao", "ins-ovo",
    "ins-queijo", "ins-flocao", "ins-cafe-po",
  ];
  for (const loja of LOJAS) {
    const dataContagem = dataNoDia(DIAS - 2, 20, 0);
    const itensContagem = INSUMOS_CONTAGEM.map((insumoId) => {
      const e = estoquePorChave.get(`${loja.id}:${insumoId}`)!;
      const teorico = Number(e.qtdTeorica.toFixed(3));
      // Divergência plantada: carne na Loja 1 some 2,4 kg "sem explicação"
      let contado: number;
      if (loja.id === "loja-1" && insumoId === "ins-carne") {
        contado = Number((teorico - 2.4).toFixed(3));
      } else {
        contado = Number((teorico + rng.range(-0.3, 0.2)).toFixed(3));
      }
      e.qtdUltimaContagem = contado;
      e.dataContagem = dataContagem;
      return { insumoId, teorico, contado, diferenca: Number((contado - teorico).toFixed(3)) };
    });
    contagens.push({
      id: `cont-${loja.id}`,
      lojaId: loja.id,
      data: dataContagem,
      usuarioId: GERENTE,
      itens: itensContagem,
    });

    // Evento da divergência da carne (Loja 1)
    if (loja.id === "loja-1") {
      const carne = INSUMO_POR_ID.get("ins-carne")!;
      eventos.push({
        id: novoEventoId(),
        tipo: "contagem_divergencia",
        lojaId: loja.id,
        usuarioId: GERENTE,
        descricao: "Carne: 2,4 kg sem explicação na contagem da semana",
        valorImpacto: Number((-2.4 * carne.custoMedio).toFixed(2)),
        data: dataContagem,
        severidade: "critico",
        refId: `cont-${loja.id}`,
      });
    }
  }

  // ---- Sessões de caixa (uma por atendente/dia) + fechamento cego ----
  let seqSessao = 0;
  for (let offset = 0; offset < DIAS; offset++) {
    if (offset === DIAS - 1) continue; // "hoje" o caixa ainda está aberto
    for (const loja of LOJAS) {
      for (const atendenteId of ATENDENTES_LOJA[loja.id]) {
        const dinheiroDoDia = pagamentos
          .filter(
            (p) =>
              p.forma === "dinheiro" &&
              p.lojaId === loja.id &&
              p.data.startsWith(dataNoDia(offset, 0, 0).slice(0, 10)) &&
              comandas.find((c) => c.id === p.comandaId)?.atendenteId === atendenteId,
          )
          .reduce((s, p) => s + p.valor, 0);

        const valorInicial = 100;
        const totalSangrias = rng.chance(0.2) ? rng.pick([50, 100]) : 0;

        // Anomalia: um fechamento com −R$ 37,00 (Camila / Loja 2)
        const anomalia =
          loja.id === "loja-2" && atendenteId === "u-camila" && offset === DIAS - 4;
        const ruido = anomalia ? -37 : rng.pick([0, 0, 0, 0, -2, 3, -5]);

        const esperadoBase = valorInicial + dinheiroDoDia - totalSangrias;
        const valorInformado = Number((esperadoBase + ruido).toFixed(2));
        const { valorEsperado, diferenca } = fecharCaixaCego({
          valorInicial,
          totalDinheiro: dinheiroDoDia,
          totalSangrias,
          valorInformado,
        });

        const id = `sess-${(++seqSessao).toString().padStart(4, "0")}`;
        sessoesCaixa.push({
          id,
          lojaId: loja.id,
          usuarioId: atendenteId,
          abertura: dataNoDia(offset, 6, 0),
          fechamento: dataNoDia(offset, 21, 0),
          valorInicial,
          valorInformado,
          valorEsperado,
          diferenca: Number(diferenca.toFixed(2)),
          sangrias: totalSangrias
            ? [{ id: `sang-${id}`, valor: totalSangrias, motivo: "depósito", data: dataNoDia(offset, 14, 0) }]
            : [],
        });

        if (Math.abs(diferenca) >= 15) {
          eventos.push({
            id: novoEventoId(),
            tipo: "caixa_diferenca",
            lojaId: loja.id,
            usuarioId: atendenteId,
            descricao: `Caixa fechou com diferença de R$ ${diferenca.toFixed(2)}`,
            valorImpacto: Number(diferenca.toFixed(2)),
            data: dataNoDia(offset, 21, 5),
            severidade: "critico",
            refId: id,
          });
        }
      }
    }
  }

  // ---- Despesas fixas do mês ----
  const despesasFixas: [string, Despesa["categoria"], number, number][] = [
    ["Aluguel Loja 1", "aluguel", 4500, 5],
    ["Aluguel Loja 2", "aluguel", 3800, 5],
    ["Energia elétrica", "energia", 2200, 10],
    ["Água", "agua", 480, 12],
    ["Gás", "gas", 620, 8],
    ["Internet", "internet", 300, 15],
    ["Folha de pagamento", "salarios", 9800, 5],
  ];
  despesasFixas.forEach(([descricao, categoria, valor, diaVenc], i) => {
    despesas.push({
      id: `desp-${(i + 1).toString().padStart(3, "0")}`,
      descricao,
      categoria,
      valor,
      vencimento: new Date(2026, 9, diaVenc, 0, 0, 0).toISOString(),
      pagoEm: diaVenc < 13 ? new Date(2026, 9, diaVenc, 10, 0, 0).toISOString() : undefined,
    });
  });

  // ---- Encomendas (confeitaria) ----
  const statusEnc: Encomenda["status"][] = [
    "orcamento", "confirmada", "em_producao", "pronta", "entregue",
  ];
  const clientesEnc = ["Dona Fátima", "Léo (aniversário)", "Escritório Alfa", "Vânia", "Cléo"];
  clientesEnc.forEach((cliente, i) => {
    const offsetEntrega = i - 1; // alguns futuros, alguns passados
    const d = new Date(DATA_REFERENCIA);
    d.setDate(d.getDate() + offsetEntrega * 2);
    d.setHours(15, 0, 0, 0);
    const total = rng.pick([80, 120, 150, 90, 200]);
    encomendas.push({
      id: `enc-${(i + 1).toString().padStart(3, "0")}`,
      cliente,
      whatsapp: `(98) 9${rng.int(8000, 9999)}-${rng.int(1000, 9999)}`,
      itens: [
        { produtoId: "prod-bolo-pote", qtd: rng.int(6, 20) },
        ...(rng.chance(0.5) ? [{ produtoId: "prod-brigadeiro", qtd: rng.int(20, 50) }] : []),
      ],
      dataEntrega: d.toISOString(),
      sinal: Number((total * 0.5).toFixed(2)),
      total,
      status: statusEnc[i % statusEnc.length],
      lojaId: i % 2 === 0 ? "loja-1" : "loja-2",
      obs: rng.chance(0.4) ? "Sem lactose" : undefined,
    });
  });

  return {
    lojas: LOJAS,
    usuarios: USUARIOS,
    categorias: CATEGORIAS,
    produtos: PRODUTOS,
    insumos: INSUMOS,
    fichas: FICHAS,
    estoque,
    comandas,
    pagamentos,
    compras,
    perdas,
    contagens,
    transferencias: [],
    sessoesCaixa,
    despesas,
    encomendas,
    eventos,
  };
}

/** Restaura o banco mock ao estado inicial (seed determinístico). */
export function resetarDemo(): BancoMock {
  return gerarSeed();
}
